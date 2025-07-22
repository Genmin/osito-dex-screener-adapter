#!/bin/bash

# Osito DEX Screener Production Deployment Script
# Prepares and validates the dexscreener adapter for production deployment

set -e

echo "🚀 Osito DEX Screener - Production Deployment"
echo "=============================================="

# 1. Validate environment
echo "📋 Validating environment configuration..."

if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please create it first."
    exit 1
fi

source .env

if [ -z "$RPC_URL" ] || [ -z "$CHAIN_ID" ] || [ -z "$WBERA_ADDRESS" ]; then
    echo "❌ Missing required environment variables"
    echo "Required: RPC_URL, CHAIN_ID, WBERA_ADDRESS"
    exit 1
fi

echo "✅ Environment validated:"
echo "   Chain ID: $CHAIN_ID"
echo "   RPC URL: $RPC_URL"
echo "   WBERA: $WBERA_ADDRESS"
echo "   Cores configured: $(echo $CORES | tr ',' '\n' | wc -l | tr -d ' ')"

# 2. Update core addresses from factory
echo ""
echo "🔍 Fetching latest core addresses from factory..."
npm run get-cores

# 3. Build the application
echo ""
echo "🔨 Building application..."
npm run build

# 4. Test server startup
echo ""
echo "🧪 Testing server startup..."
npm run start &
SERVER_PID=$!
sleep 8

# Test health endpoint
if curl -f -s http://localhost:3000/health > /dev/null; then
    echo "✅ Server health check passed"
else
    echo "❌ Server health check failed"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi

# Kill test server
kill $SERVER_PID 2>/dev/null || true
sleep 2

# 5. Final validation
echo ""
echo "✅ Production readiness check complete!"
echo ""
echo "📊 Deployment Summary:"
echo "   ✅ Environment validated"
echo "   ✅ Core addresses updated"  
echo "   ✅ Application built successfully"
echo "   ✅ Server startup test passed"
echo ""
echo "🚀 Ready for production deployment!"
echo ""
echo "Next steps:"
echo "1. Deploy to your hosting platform"
echo "2. Configure DexScreener to use your endpoint"
echo "3. Monitor logs after token launches"
echo ""
echo "Endpoints:"
echo "   Health: GET /health"
echo "   Latest Block: GET /latest-block"  
echo "   Asset Info: GET /asset?id=<address>"
echo "   Pair Info: GET /pair?id=<core_address>"
echo "   Events: GET /events?fromBlock=<n>&toBlock=<n>"