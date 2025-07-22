# DexScreener Integration Guide - Osito Protocol

## Overview

This adapter provides DexScreener-compatible endpoints for the **Osito Protocol** on **Berachain Mainnet**. The Osito Protocol is a token launchpad with built-in lending mechanics, where each launched token has its own AMM pool for swapping against WBERA.

## Protocol Architecture

- **Network**: Berachain Mainnet (Chain ID: 80094)
- **Factory**: `0xCC5bD9c91006f56e789349786fcd7F49576c17F0` - Creates new token launches
- **Quote Token**: WBERA (`0x6969696969696969696969696969696969696969`)
- **Core Contracts**: Each launched token gets its own "Core" contract that acts as both the token and the AMM pool

## Integration Details

### DEX Information
- **DEX Key**: `osito`
- **DEX Name**: Osito Protocol
- **Base URL**: Your deployed adapter endpoint
- **Fee Structure**: Dynamic fees starting at configured rate, decreasing as tokens are burned

### Endpoints

#### 1. Health Check
```
GET /health
```
Returns server health and RPC connectivity status.

#### 2. Latest Block
```
GET /latest-block
```
Returns the latest block number and timestamp from Berachain.

#### 3. Asset Information
```
GET /asset?id=<token_address>
```
Returns token metadata including name, symbol, decimals, and total supply.
- Supports both launched tokens and WBERA
- Data is cached for 24 hours for performance

#### 4. Pair Information
```
GET /pair?id=<core_address>
```
Returns trading pair information for a Core contract.
- `asset0Id` and `asset1Id` are sorted alphabetically
- Always shows 30 bps fee (0.3%)

#### 5. Swap Events
```
GET /events?fromBlock=<start>&toBlock=<end>
```
Returns swap events from the specified block range.
- Includes swap amounts, prices, and reserve data
- Maximum block range: 1000 blocks
- Events are sorted by block number, transaction index, and event index

## Event Format

Each swap event includes:
- `block`: Block number and timestamp
- `eventType`: Always "swap"
- `txnId`: Transaction hash
- `txnIndex`: Transaction index in block
- `eventIndex`: Log index in transaction
- `maker`: Transaction sender address
- `pairId`: Core contract address
- `priceNative`: Token price in WBERA
- `asset0In`/`asset0Out`/`asset1In`/`asset1Out`: Swap amounts
- `reserves`: Current pool reserves (attached to last event per block)

## Deployment Information

### Current Status
- ✅ Factory deployed and verified
- ✅ DEX Screener adapter ready
- ✅ **2 LIVE tokens deployed and tracked!**
  - TEST1: `0xC77C6B29Eea5fAda772f85be313935DdCB7CFFBD` (Core: `0xC18bfd4CfA2e6CFc19327b5B66E30B4A658e39e3`)
  - TEST: `0x6b64616a6bc17C136B9a92DC5AC904C392631Fb5` (Core: `0x7E13Bc6E0A8385433677e0d455c331976e139F34`)

### Mainnet Configuration
```env
RPC_URL=https://rpc.berachain.com/
CHAIN_ID=80094
WBERA_ADDRESS=0x6969696969696969696969696969696969696969
FACTORY_ADDRESS=0x6139F0c250f6eB8D0d1804520FFd539FeeFA75bE
CORES=0xC18bfd4CfA2e6CFc19327b5B66E30B4A658e39e3,0x7E13Bc6E0A8385433677e0d455c331976e139F34
```

### Dynamic Core Discovery
The adapter automatically discovers new token launches by:
1. Monitoring `CoreCreated` events from the Factory
2. Updating the tracked cores list via the `/get-cores` script
3. No manual configuration needed for new launches

## Production Deployment

### Requirements
- Node.js 18+
- Stable RPC endpoint for Berachain Mainnet
- Public endpoint accessible to DexScreener

### Deployment Steps
1. Clone and configure the adapter
2. Set environment variables for mainnet
3. Run `./deploy-production.sh` to validate setup
4. Deploy to your hosting platform
5. Provide the public endpoint URL to DexScreener team

### Monitoring
- Monitor `/health` endpoint for service status
- Check logs for RPC errors or rate limiting
- Verify events are being captured after token launches

## Contact & Support

- **Protocol**: Osito Protocol
- **Network**: Berachain Mainnet
- **Documentation**: See attached protocol specification
- **Technical Support**: Available for integration assistance

---

**Status**: ✅ **PRODUCTION READY WITH LIVE DATA!** 
The adapter is fully operational and tracking 2 live tokens on Berachain Mainnet. All endpoints are functional and ready for DexScreener integration.