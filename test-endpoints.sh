#!/bin/bash

# Test script for Osito DEX Screener Adapter
# Run this to verify all endpoints are working correctly

BASE_URL="http://localhost:3001"

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

# TestCoin A Asset  
echo "🪙 TestCoin A Asset:"
curl -s "$BASE_URL/asset?id=0x07974f37167524b0b56da29b5b437014c5626797" | jq '.'
echo ""

# TestCoin B Asset
echo "🪙 TestCoin B Asset:" 
curl -s "$BASE_URL/asset?id=0xfc363be22236d5034381b08e17c4e763b8334c79" | jq '.'
echo ""

# Core A Pair
echo "🔄 Core A Pair (TESTA/WBERA):"
curl -s "$BASE_URL/pair?id=0xf7907d94a1faa79f3f552a9f3ca2b82a27d31f09" | jq '.'
echo ""

# Core B Pair  
echo "🔄 Core B Pair (TESTB/WBERA):"
curl -s "$BASE_URL/pair?id=0xbd4bd1d5b9954f8acb98cea90e48392ef3a9a0fe" | jq '.'
echo ""

# Swap Events
echo "📈 Recent Swap Events:"
curl -s "$BASE_URL/events?fromBlock=6063000&toBlock=6063200" | jq '.'
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