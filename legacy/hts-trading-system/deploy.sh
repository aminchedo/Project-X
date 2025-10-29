#!/bin/bash

# HTS Trading System - Deployment Script
# Automated deployment and setup script

set -e

echo "🚀 HTS Trading System Deployment Script"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed"
}

# Check if required ports are available
check_ports() {
    print_status "Checking if required ports are available..."
    
    ports=(3000 8000 5432 6379)
    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
            print_warning "Port $port is already in use"
        else
            print_success "Port $port is available"
        fi
    done
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p logs
    mkdir -p data/postgres
    mkdir -p data/redis
    mkdir -p monitoring
    mkdir -p nginx
    
    print_success "Directories created"
}

# Generate nginx configuration
generate_nginx_config() {
    print_status "Generating nginx configuration..."
    
    cat > nginx/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server hts_backend:8000;
    }
    
    upstream frontend {
        server hts_frontend:3000;
    }
    
    server {
        listen 80;
        server_name localhost;
        
        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
        
        # Backend API
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
        
        # WebSocket
        location /ws {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
        }
    }
}
EOF
    
    print_success "Nginx configuration generated"
}

# Generate monitoring configuration
generate_monitoring_config() {
    print_status "Generating monitoring configuration..."
    
    cat > monitoring/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'hts-backend'
    static_configs:
      - targets: ['hts_backend:8000']
    metrics_path: /metrics
    scrape_interval: 5s
    
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']
      
  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
EOF
    
    print_success "Monitoring configuration generated"
}

# Build and start services
deploy_services() {
    print_status "Building and starting services..."
    
    # Stop any existing services
    docker-compose down --remove-orphans
    
    # Build and start services
    docker-compose up -d --build
    
    print_success "Services started successfully"
}

# Wait for services to be ready
wait_for_services() {
    print_status "Waiting for services to be ready..."
    
    # Wait for database
    print_status "Waiting for PostgreSQL..."
    until docker-compose exec -T postgres pg_isready -U postgres; do
        sleep 2
    done
    print_success "PostgreSQL is ready"
    
    # Wait for Redis
    print_status "Waiting for Redis..."
    until docker-compose exec -T redis redis-cli ping; do
        sleep 2
    done
    print_success "Redis is ready"
    
    # Wait for backend
    print_status "Waiting for backend..."
    until curl -f http://localhost:8000/api/health > /dev/null 2>&1; do
        sleep 5
    done
    print_success "Backend is ready"
    
    # Wait for frontend
    print_status "Waiting for frontend..."
    until curl -f http://localhost:3000 > /dev/null 2>&1; do
        sleep 5
    done
    print_success "Frontend is ready"
}

# Run health checks
run_health_checks() {
    print_status "Running health checks..."
    
    # Backend health check
    if curl -f http://localhost:8000/api/health > /dev/null 2>&1; then
        print_success "Backend health check passed"
    else
        print_error "Backend health check failed"
        return 1
    fi
    
    # API health check
    if curl -f http://localhost:8000/api/health/all-apis > /dev/null 2>&1; then
        print_success "API health check passed"
    else
        print_warning "Some APIs may not be responding"
    fi
    
    # Database connectivity
    if docker-compose exec -T postgres psql -U postgres -d hts -c "SELECT 1;" > /dev/null 2>&1; then
        print_success "Database connectivity check passed"
    else
        print_error "Database connectivity check failed"
        return 1
    fi
    
    print_success "All health checks completed"
}

# Display deployment information
show_deployment_info() {
    print_success "🎉 HTS Trading System deployed successfully!"
    echo ""
    echo "📍 Access URLs:"
    echo "   Frontend:  http://localhost:3000"
    echo "   Backend:   http://localhost:8000"
    echo "   API Docs:  http://localhost:8000/docs"
    echo "   Grafana:   http://localhost:3001 (admin/admin)"
    echo "   Prometheus: http://localhost:9090"
    echo ""
    echo "📊 Service Status:"
    docker-compose ps
    echo ""
    echo "📝 Useful Commands:"
    echo "   View logs:     docker-compose logs -f"
    echo "   Stop services: docker-compose down"
    echo "   Restart:       docker-compose restart"
    echo "   Update:        docker-compose pull && docker-compose up -d"
    echo ""
    print_warning "⚠️  Remember to configure your API keys and Telegram bot token!"
}

# Main deployment function
main() {
    print_status "Starting HTS Trading System deployment..."
    
    check_docker
    check_ports
    create_directories
    generate_nginx_config
    generate_monitoring_config
    deploy_services
    wait_for_services
    run_health_checks
    show_deployment_info
    
    print_success "Deployment completed successfully! 🚀"
}

# Handle script interruption
trap 'print_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"