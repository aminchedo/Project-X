# AWS Deployment Guide for Project-X Trading System

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     AWS Cloud Architecture                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  CloudFront CDN                                              │
│       │                                                      │
│       ├──> S3 Bucket (React Frontend Build)                 │
│       │                                                      │
│       └──> API Gateway (WebSocket + REST)                   │
│              │                                               │
│              ├──> Lambda Functions (REST endpoints)          │
│              │     - /api/portfolio/*                        │
│              │     - /api/risk/*                             │
│              │     - /api/signals/*                          │
│              │                                               │
│              ├──> ECS Fargate (FastAPI Backend)             │
│              │     - WebSocket server (/ws/market)          │
│              │     - ML inference endpoints                 │
│              │                                               │
│              └──> Application Load Balancer                  │
│                                                              │
│  ElastiCache (Redis)                                         │
│       - Order book cache                                     │
│       - Signal cache (15s TTL)                               │
│       - Session management                                   │
│                                                              │
│  RDS PostgreSQL                                              │
│       - Trading history                                      │
│       - Positions & PnL                                      │
│       - User accounts                                        │
│                                                              │
│  SageMaker Endpoints                                         │
│       - ML model inference                                   │
│       - Real-time signal generation                          │
│                                                              │
│  CloudWatch                                                  │
│       - Logs aggregation                                     │
│       - Metrics & alerts                                     │
│       - Trading system monitoring                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Step 1: Prerequisites Setup

### Install AWS CLI
```bash
# Windows (PowerShell)
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi

# Verify installation
aws --version

# Configure AWS credentials
aws configure
# Enter: Access Key ID, Secret Access Key, Region (us-east-1), Output (json)
```

### Install Required Tools
```bash
# Docker Desktop (for container builds)
# Download from: https://www.docker.com/products/docker-desktop

# AWS CDK (Infrastructure as Code)
npm install -g aws-cdk

# Verify CDK
cdk --version
```

## Step 2: Frontend Deployment (S3 + CloudFront)

### Build Frontend for Production
```bash
cd C:\project\Project-X-main

# Install dependencies
npm install

# Build optimized production bundle
npm run build
# Output: dist/ folder with static assets
```

### Deploy to S3
```bash
# Create S3 bucket for frontend
aws s3 mb s3://projectx-trading-frontend --region us-east-1

# Enable static website hosting
aws s3 website s3://projectx-trading-frontend --index-document index.html --error-document index.html

# Upload build files
aws s3 sync dist/ s3://projectx-trading-frontend --delete

# Set bucket policy for public read
aws s3api put-bucket-policy --bucket projectx-trading-frontend --policy file://deployment/s3-bucket-policy.json
```

### CloudFront Distribution (CDN)
```bash
# Create CloudFront distribution
aws cloudfront create-distribution --distribution-config file://deployment/cloudfront-config.json

# Note: Takes 15-20 minutes to deploy globally
# You'll get a CloudFront URL: https://d1234567890.cloudfront.net
```

## Step 3: Backend Deployment (ECS Fargate)

### Build and Push Docker Image
```bash
cd C:\project\Project-X-main\backend

# Login to Amazon ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <your-account-id>.dkr.ecr.us-east-1.amazonaws.com

# Create ECR repository
aws ecr create-repository --repository-name projectx-backend --region us-east-1

# Build Docker image
docker build -t projectx-backend:latest -f Dockerfile.production .

# Tag image
docker tag projectx-backend:latest <your-account-id>.dkr.ecr.us-east-1.amazonaws.com/projectx-backend:latest

# Push to ECR
docker push <your-account-id>.dkr.ecr.us-east-1.amazonaws.com/projectx-backend:latest
```

### Deploy to ECS Fargate
```bash
# Create ECS cluster
aws ecs create-cluster --cluster-name projectx-trading-cluster --region us-east-1

# Create task definition (see deployment/ecs-task-definition.json)
aws ecs register-task-definition --cli-input-json file://deployment/ecs-task-definition.json

# Create ECS service with auto-scaling
aws ecs create-service \
  --cluster projectx-trading-cluster \
  --service-name projectx-backend-service \
  --task-definition projectx-backend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:xxx:targetgroup/projectx-tg,containerName=projectx-backend,containerPort=8000
```

## Step 4: Database Setup (RDS PostgreSQL)

### Create RDS Instance
```bash
# Create PostgreSQL database
aws rds create-db-instance \
  --db-instance-identifier projectx-trading-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.4 \
  --master-username admin \
  --master-user-password <strong-password> \
  --allocated-storage 100 \
  --storage-type gp3 \
  --backup-retention-period 7 \
  --multi-az \
  --publicly-accessible false \
  --region us-east-1

# Wait for database to be available (5-10 minutes)
aws rds wait db-instance-available --db-instance-identifier projectx-trading-db
```

### Initialize Database Schema
```bash
# Get database endpoint
aws rds describe-db-instances --db-instance-identifier projectx-trading-db --query 'DBInstances[0].Endpoint.Address'

# Connect and run init.sql
psql -h <db-endpoint> -U admin -d postgres -f init.sql
```

## Step 5: Redis Cache Setup (ElastiCache)

### Create Redis Cluster
```bash
# Create Redis cluster for caching
aws elasticache create-cache-cluster \
  --cache-cluster-id projectx-cache \
  --cache-node-type cache.t3.medium \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-nodes 1 \
  --cache-subnet-group-name default \
  --region us-east-1

# Get Redis endpoint
aws elasticache describe-cache-clusters --cache-cluster-id projectx-cache --show-cache-node-info
```

## Step 6: WebSocket API Gateway

### Create WebSocket API
```bash
# Deploy WebSocket API
aws apigatewayv2 create-api \
  --name projectx-websocket \
  --protocol-type WEBSOCKET \
  --route-selection-expression '$request.body.action'

# Create routes
aws apigatewayv2 create-route \
  --api-id <api-id> \
  --route-key $connect \
  --target integrations/<integration-id>

aws apigatewayv2 create-route \
  --api-id <api-id> \
  --route-key $disconnect \
  --target integrations/<integration-id>

aws apigatewayv2 create-route \
  --api-id <api-id> \
  --route-key $default \
  --target integrations/<integration-id>

# Deploy stage
aws apigatewayv2 create-stage \
  --api-id <api-id> \
  --stage-name production \
  --auto-deploy
```

## Step 7: ML Model Deployment (SageMaker)

### Deploy ML Model to SageMaker
```bash
# Package ML model
cd C:\project\Project-X-main\backend

# Create model artifact
tar -czf model.tar.gz models/

# Upload to S3
aws s3 cp model.tar.gz s3://projectx-ml-models/trading-signals/model.tar.gz

# Create SageMaker model
aws sagemaker create-model \
  --model-name projectx-trading-signals \
  --primary-container Image=<ecr-image>,ModelDataUrl=s3://projectx-ml-models/trading-signals/model.tar.gz \
  --execution-role-arn arn:aws:iam::<account-id>:role/SageMakerRole

# Create endpoint configuration
aws sagemaker create-endpoint-config \
  --endpoint-config-name projectx-signals-config \
  --production-variants VariantName=AllTraffic,ModelName=projectx-trading-signals,InstanceType=ml.t3.medium,InitialInstanceCount=1

# Create endpoint
aws sagemaker create-endpoint \
  --endpoint-name projectx-signals-endpoint \
  --endpoint-config-name projectx-signals-config
```

## Step 8: Environment Variables

### Create SSM Parameter Store Secrets
```bash
# Store sensitive configuration
aws ssm put-parameter \
  --name /projectx/production/database_url \
  --value "postgresql://admin:<password>@<rds-endpoint>:5432/trading" \
  --type SecureString

aws ssm put-parameter \
  --name /projectx/production/redis_url \
  --value "redis://<elasticache-endpoint>:6379" \
  --type SecureString

aws ssm put-parameter \
  --name /projectx/production/sagemaker_endpoint \
  --value "projectx-signals-endpoint" \
  --type String

aws ssm put-parameter \
  --name /projectx/production/jwt_secret \
  --value "<generate-random-secret>" \
  --type SecureString
```

## Step 9: Auto-Scaling Configuration

### Configure ECS Auto-Scaling
```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/projectx-trading-cluster/projectx-backend-service \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10

# Create scaling policy (CPU-based)
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --resource-id service/projectx-trading-cluster/projectx-backend-service \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-name cpu-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://deployment/autoscaling-policy.json
```

## Step 10: Monitoring & Alerts

### CloudWatch Dashboards
```bash
# Create monitoring dashboard
aws cloudwatch put-dashboard \
  --dashboard-name ProjectX-Trading \
  --dashboard-body file://deployment/cloudwatch-dashboard.json
```

### CloudWatch Alarms
```bash
# High CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name projectx-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:us-east-1:<account-id>:projectx-alerts

# WebSocket connection errors
aws cloudwatch put-metric-alarm \
  --alarm-name projectx-websocket-errors \
  --alarm-description "Alert on WebSocket connection failures" \
  --metric-name ConnectionErrors \
  --namespace ProjectX/Trading \
  --statistic Sum \
  --period 60 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:us-east-1:<account-id>:projectx-alerts
```

## Cost Estimates (Monthly)

### Production Environment
- **ECS Fargate (2 instances)**: $50-70
- **RDS PostgreSQL (t3.medium, Multi-AZ)**: $80-100
- **ElastiCache Redis (t3.medium)**: $45-60
- **SageMaker Endpoint (ml.t3.medium)**: $50-70
- **S3 + CloudFront**: $10-20
- **API Gateway (WebSocket + REST)**: $20-30
- **Data Transfer**: $30-50
- **CloudWatch Logs**: $10-15

**Total**: ~$295-415/month

### Cost Optimization Tips
1. Use **Reserved Instances** for RDS/ElastiCache (30-50% savings)
2. Enable **S3 Intelligent-Tiering**
3. Use **Lambda for low-traffic REST endpoints** instead of ECS
4. Implement **CloudFront caching** aggressively
5. Use **SageMaker Serverless Inference** for ML models (pay per request)

## Deployment Checklist

- [ ] AWS account setup with billing alerts
- [ ] IAM roles and policies configured
- [ ] VPC and security groups created
- [ ] Frontend built and deployed to S3
- [ ] CloudFront distribution configured
- [ ] Backend Docker image pushed to ECR
- [ ] ECS Fargate service running
- [ ] RDS PostgreSQL database initialized
- [ ] ElastiCache Redis cluster active
- [ ] WebSocket API Gateway deployed
- [ ] SageMaker ML endpoint active
- [ ] Environment variables in SSM Parameter Store
- [ ] Auto-scaling policies configured
- [ ] CloudWatch monitoring active
- [ ] SNS alerts configured
- [ ] Custom domain and SSL certificate (optional)
- [ ] Backup strategies in place

## Next Steps

1. **Test the deployment**: Use Postman/Insomnia to test all endpoints
2. **Load testing**: Use Artillery or k6 to simulate trading load
3. **Security audit**: Run AWS Trusted Advisor
4. **Documentation**: Update API docs with production URLs
5. **CI/CD**: Set up GitHub Actions for automated deployments

## Troubleshooting

### Backend won't connect to RDS
```bash
# Check security group rules
aws ec2 describe-security-groups --group-ids <sg-id>

# Ensure ECS tasks are in same VPC as RDS
# Add inbound rule: PostgreSQL (5432) from ECS security group
```

### WebSocket connections dropping
```bash
# Check API Gateway settings
aws apigatewayv2 get-api --api-id <api-id>

# Increase idle timeout (default 10 minutes)
# Enable connection logging
```

### High latency on API calls
```bash
# Check CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name TargetResponseTime \
  --dimensions Name=ServiceName,Value=projectx-backend-service

# Solutions:
# 1. Add Redis caching
# 2. Increase ECS task count
# 3. Enable CloudFront caching for API
```

## Support Resources

- AWS Documentation: https://docs.aws.amazon.com
- Project-X Repository: Your private GitHub/GitLab repo
- AWS Support: Support plan required for production issues
