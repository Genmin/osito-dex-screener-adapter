# Osito DEX Screener Adapter

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.1+-blue.svg)](https://www.typescriptlang.org/)

A lightweight, stateless adapter that enables DEX Screener to track Osito protocol data on Berachain. This adapter implements the DEX Screener API v1.1 specification to provide real-time swap data, asset information, and liquidity tracking for Osito's decentralized exchange.

## Features

- Real-time swap event tracking
- Asset and pair information endpoints
- Stateless design with on-demand data fetching
- Compliant with DEX Screener Adapter v1.1 specifications
- TypeScript implementation with Express.js

## Setup

1. **Install dependencies:**
   ```bash
   cd dex-screener-adapter
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp env.example .env
   ```
   
   Update `.env` with your specific values:
   ```env
   RPC_URL=https://rpc.ankr.com/berachain_testnet
   CHAIN_ID=80085
   PORT=3000
   CORES=0xCoreAddress1,0xCoreAddress2
   WBERA_ADDRESS=0x7507c1dc16935B82698e4C63f2746A5fCf994dF8
   CORE_REGISTRY_ADDRESS=0xRegistryAddress
   ```

   **To get Core contract addresses automatically:**
   ```bash
   npm run get-cores
   ```
   This will fetch all deployed Core contracts from the CoreRegistry and output the addresses for your `.env` file.

3. **Build the project:**
   ```bash
   npm run build
   ```

4. **Deploy:**
   
   **Option A: Automated deployment script**
   ```bash
   ./deploy.sh
   ```
   The script will detect available tools (Docker/Node.js) and guide you through deployment.

   **Option B: Manual Node.js deployment**
   ```bash
   npm start
   ```

   **Option C: Development mode**
   ```bash
   npm run dev
   ```

   **Option D: Docker Compose (recommended for production)**
   ```bash
   docker-compose up -d
   ```

## API Endpoints

### GET /latest-block
Returns the latest block information.

### GET /asset?id=:address
Returns asset information for the given contract address.

### GET /pair?id=:address
Returns pair information for the given Osito core contract address.

### GET /events?fromBlock=:number&toBlock=:number
Returns swap events within the specified block range.

### GET /health
Health check endpoint.

## Deployment

Deploy this service behind a reverse proxy and provide the base URL to DEX Screener for indexing.

### Docker Deployment (Optional)

Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

Build and run:
```bash
docker build -t osito-dex-adapter .
docker run -p 3000:3000 --env-file .env osito-dex-adapter
```

## Configuration

### Environment Variables

- `RPC_URL`: Berachain RPC endpoint
- `CHAIN_ID`: Berachain network ID (80085 for testnet)
- `PORT`: Server port (default: 3000)
- `CORES`: Comma-separated list of Osito core contract addresses
- `WBERA_ADDRESS`: Wrapped BERA token contract address

### Core Contracts

Update the `CORES` environment variable with the deployed Osito core contract addresses. These can be obtained from the CoreRegistry contract.

## Architecture

- **Stateless**: No database required, all data fetched on-demand
- **Caching**: LRU cache for block data and asset information
- **Error Handling**: Comprehensive error handling with fallbacks
- **Standards Compliant**: Follows DEX Screener Adapter v1.1 specifications

## Monitoring

The service provides a `/health` endpoint for monitoring and includes structured logging for debugging.

## Support

For issues related to the Osito protocol, please refer to the main Osito documentation or contact the development team. 