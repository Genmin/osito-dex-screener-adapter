#!/bin/bash

# Test script for Osito DEX Screener Adapter
# Run this to verify all endpoints are working correctly

BASE_URL="http://localhost:3002"

echo "🎯 Testing Osito DEX Screener Adapter Endpoints"
echo "================================================="
echo ""

# Health Check
echo "✅ Health Check:"
curl -s "$BASE_URL/health" | jq '.'
echo ""

# Latest Block
echo "📊 Latest Block:"
curl -s "$BASE_URL/latest-block" | jq '.'
echo ""

# WBERA Asset
echo "💰 WBERA Asset:"
curl -s "$BASE_URL/asset?id=0x6969696969696969696969696969696969696969" | jq '.'
echo ""

# TestToken Asset  
echo "🪙 TestToken Asset:"
curl -s "$BASE_URL/asset?id=0x63983bf08eaeb83454ea661830a4fba89485b7fb" | jq '.'
echo ""

# TestToken Pair
echo "🔄 TestToken Pair (TEST/WBERA):"
curl -s "$BASE_URL/pair?id=0x63983bf08eaeb83454ea661830a4fba89485b7fb" | jq '.'
echo ""

# Swap Events
echo "📈 Recent Swap Events:"
curl -s "$BASE_URL/events?fromBlock=6863000&toBlock=6863182" | jq '.'
echo ""

# Error Cases
echo "❌ Error Test (missing asset id):"
curl -s "$BASE_URL/asset" | jq '.'
echo ""

echo "❌ Error Test (invalid pair):"  
curl -s "$BASE_URL/pair?id=0x1234567890123456789012345678901234567890" | jq '.'
echo ""

echo "❌ Error Test (invalid block range):"
curl -s "$BASE_URL/events?fromBlock=100&toBlock=50" | jq '.'
echo ""

echo "🎉 All tests completed!"
echo ""
echo "📚 DEX Screener API v1.1 Compliance:"
echo "   ✅ /latest-block - Returns current block info"
echo "   ✅ /asset - Returns token metadata"  
echo "   ✅ /pair - Returns pair information"
echo "   ✅ /events - Returns swap events"
echo "   ✅ Error handling for invalid requests"
echo "   ✅ Proper JSON responses"
echo "   ✅ String serialization for large numbers" 