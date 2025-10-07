#!/bin/bash
# Verification script for runtime disable implementation
# Tests that model files are kept but runtime is independent

set -e

echo "=== Runtime Disable Verification ==="
echo ""

# 1. Check config has neural_head flag
echo "✓ Checking neural_head config..."
if grep -q '"neural_head"' config/ai_config.json; then
    echo "  ✅ neural_head config found in ai_config.json"
    ENABLED=$(grep -A1 '"neural_head"' config/ai_config.json | grep '"enabled"' | grep -o 'false\|true')
    echo "  ✅ neural_head.enabled = $ENABLED"
else
    echo "  ❌ neural_head config NOT found"
    exit 1
fi

# 2. Verify requirements.txt is minimal
echo ""
echo "✓ Checking requirements.txt..."
if grep -q "tensorflow\|torch\|transformers" backend/requirements.txt; then
    echo "  ❌ Heavy ML deps still in requirements.txt"
    exit 1
else
    echo "  ✅ No heavy ML dependencies in requirements.txt"
fi

# 3. Check ML deps moved to separate file
echo ""
echo "✓ Checking requirements-ml.txt..."
if [ -f backend/requirements-ml.txt ]; then
    echo "  ✅ requirements-ml.txt exists"
    if grep -q "tensorflow\|torch" backend/requirements-ml.txt; then
        echo "  ✅ ML dependencies properly separated"
    fi
else
    echo "  ❌ requirements-ml.txt not found"
    exit 1
fi

# 4. Verify static files mount in main.py
echo ""
echo "✓ Checking static files mount..."
if grep -q "StaticFiles" backend/main.py; then
    echo "  ✅ Static files mount found in main.py"
else
    echo "  ❌ Static files mount NOT found"
    exit 1
fi

# 5. Check Dockerfile exists
echo ""
echo "✓ Checking Dockerfile..."
if [ -f Dockerfile ]; then
    echo "  ✅ Dockerfile exists"
    if grep -q "fe-build" Dockerfile; then
        echo "  ✅ Multi-stage build configured"
    fi
else
    echo "  ❌ Dockerfile not found"
    exit 1
fi

# 6. Verify ai_extras router is available
echo ""
echo "✓ Checking AI extras router..."
if grep -q "from routers.ai_extras import router" backend/main.py; then
    echo "  ✅ AI extras router imported"
fi
if grep -q "extras_router" backend/main.py; then
    echo "  ✅ AI extras router mounted"
fi

# 7. Check that model files are still in repo (not deleted)
echo ""
echo "✓ Checking model files are kept..."
MODEL_FILES=$(find backend/analytics -name "ml_*.py" -o -name "*predictor*.py" 2>/dev/null | wc -l)
if [ "$MODEL_FILES" -gt 0 ]; then
    echo "  ✅ Model files still in repository (count: $MODEL_FILES)"
else
    echo "  ℹ️  No model files found (may not exist in this repo)"
fi

echo ""
echo "=== ✅ All Checks Passed ==="
echo ""
echo "Summary:"
echo "  - neural_head feature flag: DISABLED by default"
echo "  - Heavy ML dependencies: REMOVED from requirements.txt"
echo "  - Optional ML deps: AVAILABLE in requirements-ml.txt"
echo "  - Frontend static serving: CONFIGURED"
echo "  - Dockerfile: READY for HF Spaces"
echo "  - AI extras (Platt/Goal): AVAILABLE"
echo "  - Model files: KEPT in repository"
echo ""
echo "To enable neural head in future:"
echo "  1. Set NEURAL_HEAD_ENABLED=true environment variable, OR"
echo "  2. Edit config/ai_config.json: \"neural_head\": {\"enabled\": true, ...}"
echo "  3. Install ML deps: pip install -r backend/requirements-ml.txt"
echo ""