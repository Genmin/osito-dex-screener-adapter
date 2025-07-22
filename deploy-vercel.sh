#!/bin/bash

# Vercel Deployment Script for Osito DEX Screener Adapter
set -e

echo "🚀 Deploying Osito DEX Screener to Vercel..."
echo "============================================"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Ensure we're in the right directory
if [ ! -f "vercel.json" ]; then
    echo "❌ vercel.json not found. Are you in the right directory?"
    exit 1
fi

# Build the project
echo "🔨 Building project..."
npm run build

# Set production environment variables
echo "🔧 Setting up environment variables..."
echo "You'll need to configure these in Vercel dashboard or via CLI:"
echo "  RPC_URL=https://rpc.berachain.com/"
echo "  CHAIN_ID=80094"
echo "  WBERA_ADDRESS=0x6969696969696969696969696969696969696969"
echo "  FACTORY_ADDRESS=0x6139F0c250f6eB8D0d1804520FFd539FeeFA75bE"  
echo "  CORES=0xC18bfd4CfA2e6CFc19327b5B66E30B4A658e39e3,0x7E13Bc6E0A8385433677e0d455c331976e139F34"

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo ""
echo "📋 Post-deployment checklist:"
echo "1. ✅ Verify environment variables are set in Vercel dashboard"
echo "2. ✅ Test the health endpoint: https://your-deployment-url.vercel.app/health"
echo "3. ✅ Test asset endpoint with a token address"
echo "4. ✅ Test pair endpoint with a core address"
echo "5. ✅ Provide the URL to DexScreener team"
echo ""
echo "🔧 Environment variables to set in Vercel:"
echo "   RPC_URL, CHAIN_ID, WBERA_ADDRESS, FACTORY_ADDRESS, CORES"
echo ""
echo "📊 Your adapter is now live and ready for DexScreener integration!"