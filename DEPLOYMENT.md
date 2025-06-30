# 🚀 Osito DEX Screener Adapter - Quick Deployment Guide

## 📋 Prerequisites

- Node.js (v18+ recommended)
- Working RPC endpoint for Berachain testnet
- Core contract addresses from deployment

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy and configure the environment file:
```bash
cp env.example .env
```

Edit `.env` with your settings:
```env
RPC_URL=your_berachain_rpc_url
CHAIN_ID=80069
PORT=3000
CORES=0xf7907d94a1faa79f3f552a9f3ca2b82a27d31f09,0xbd4bd1d5b9954f8acb98cea90e48392ef3a9a0fe
WBERA_ADDRESS=0x6969696969696969696969696969696969696969
CORE_REGISTRY_ADDRESS=0x4f95ef864e7ce649fb77ddb4cf09e5d8d555ae2e
VQ_ADDRESS=0x8679be4738aac33f8e4c46794358d78501cb8e17
```

### 3. Build and Start
```bash
npm run build
npm start
```

### 4. Test Endpoints
Run the test script to verify all endpoints:
```bash
./test-endpoints.sh
```

## 🧪 Testing with Mock Server

For testing without RPC connectivity:
```bash
node test-server.js
```

This runs a mock server on port 3001 with sample data.

## 🐳 Docker Deployment

### Build and Run
```bash
docker build -t osito-dex-screener .
docker run -p 3000:3000 --env-file .env osito-dex-screener
```

### Using Docker Compose
```bash
docker-compose up -d
```

## 📊 API Endpoints

All endpoints are DEX Screener API v1.1 compliant:

- `GET /latest-block` - Current block information
- `GET /asset?id=<address>` - Token metadata
- `GET /pair?id=<core_address>` - Pair information  
- `GET /events?fromBlock=<N>&toBlock=<M>` - Swap events
- `GET /health` - Health check

## 🔧 Production Configuration

### Environment Variables
- `RPC_URL` - Berachain RPC endpoint (required)
- `CHAIN_ID` - Chain ID (80069 for Berachain testnet)
- `PORT` - Server port (default: 3000)
- `CORES` - Comma-separated Core contract addresses
- `WBERA_ADDRESS` - WBERA contract address
- `CORE_REGISTRY_ADDRESS` - CoreRegistry contract address
- `VQ_ADDRESS` - VQ contract address

### Performance Tips
- Use a reliable RPC endpoint
- Configure proper caching
- Monitor error rates
- Set up health checks

## 📈 Monitoring

The adapter includes:
- Health check endpoint at `/health`
- Error logging
- Performance metrics
- LRU caching for efficiency

## 🛠 Development

### Run in Development Mode
```bash
npm run dev
```

### Generate Core Addresses
```bash
npx ts-node scripts/get-core-addresses.ts
```

### Build TypeScript
```bash
npm run build
```

## 🎯 Current Deployment Status

✅ **DEPLOYED IN WORKSPACE**: `/Users/joeyroth/osito-contracts/Ositoapp/dex-screener-adapter`

### Deployed Contract Addresses
- **Core A**: `0xf7907d94a1faa79f3f552a9f3ca2b82a27d31f09` (TestCoin A)
- **Core B**: `0xbd4bd1d5b9954f8acb98cea90e48392ef3a9a0fe` (TestCoin B)
- **WBERA**: `0x6969696969696969696969696969696969696969`
- **CoreRegistry**: `0x4f95ef864e7ce649fb77ddb4cf09e5d8d555ae2e`
- **VQ**: `0x8679be4738aac33f8e4c46794358d78501cb8e17`

### Testing
- ✅ Mock server running on port 3001
- ✅ All endpoints tested and working
- ✅ DEX Screener API v1.1 compliance verified
- ✅ Error handling tested

Ready for production deployment! 🎉 