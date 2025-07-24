#!/bin/bash
# Set environment variables for Vercel deployment

echo "Setting up environment variables for Vercel..."

# RPC_URL
echo "https://rpc.berachain.com/" | vercel env add RPC_URL production

# CHAIN_ID  
echo "80094" | vercel env add CHAIN_ID production

# WBERA_ADDRESS
echo "0x6969696969696969696969696969696969696969" | vercel env add WBERA_ADDRESS production

# FACTORY_ADDRESS
echo "0x6139F0c250f6eB8D0d1804520FFd539FeeFA75bE" | vercel env add FACTORY_ADDRESS production

# CORES
echo "0xC18bfd4CfA2e6CFc19327b5B66E30B4A658e39e3,0x7E13Bc6E0A8385433677e0d455c331976e139F34" | vercel env add CORES production

echo "✅ All environment variables set!"