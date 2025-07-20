import { JsonRpcProvider, Contract, formatUnits, isAddress } from "ethers";
import { LRUCache } from "lru-cache";
import express from "express";
import rateLimit from "express-rate-limit";
import cors from "cors";
import * as dotenv from "dotenv";
dotenv.config();

// Validate required environment variables at startup
function validateEnvironment() {
  const required = ['RPC_URL', 'CHAIN_ID', 'CORES', 'WBERA_ADDRESS'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
  
  // Validate WBERA address format
  if (!isAddress(process.env.WBERA_ADDRESS!)) {
    console.error(`❌ Invalid WBERA_ADDRESS format: ${process.env.WBERA_ADDRESS}`);
    process.exit(1);
  }
  
  // Validate CORES addresses
  const cores = process.env.CORES!.split(',').map(addr => addr.trim());
  const invalidCores = cores.filter(addr => !isAddress(addr));
  if (invalidCores.length > 0) {
    console.error(`❌ Invalid CORES addresses: ${invalidCores.join(', ')}`);
    process.exit(1);
  }
  
  console.log(`✅ Environment validation passed. Found ${cores.length} core addresses.`);
}

validateEnvironment();

const RPC  = new JsonRpcProvider(process.env.RPC_URL);
const CHA  = Number(process.env.CHAIN_ID);
const PORT = Number(process.env.PORT ?? 3000);

// Parse CORES from environment variable
const CORES = process.env.CORES?.split(',') || [];

const WBERA = {
  id:      process.env.WBERA_ADDRESS || "0x6969696969696969696969696969696969696969",
  name:    "Wrapped BERA",
  symbol:  "WBERA",
  decimals: 18
};

const CORE_ABI = [
  "event Swap(bool indexed tokIn,uint256 amountIn,uint256 amountOut,uint256 feeQT)",
  "function name() view returns(string)",
  "function symbol() view returns(string)",
  "function decimals() view returns(uint8)",
  "function totalSupply() view returns(uint256)",
  "function R() view returns(uint128 T,uint128 Q,uint128 B)"
];


const app = express();

// Security and performance middleware
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: "Too many requests from this IP, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Asset memoization with TTL
const assetMemo = new Map<string, { data: any; timestamp: number }>();
const ASSET_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Enhanced block cache
const blockCache = new LRUCache<number, any>({ 
  max: Number(process.env.BLOCK_CACHE_SIZE) || 500,
  ttl: 1000 * 60 * 5 // 5 minutes TTL
});

// Helper function to get asset decimals
const getAssetDecimals = async (address: string): Promise<number> => {
  if (address.toLowerCase() === WBERA.id.toLowerCase()) return 18;
  
  const erc = new Contract(address, [
    "function decimals() view returns(uint8)"
  ], RPC);
  
  try {
    return await erc.decimals();
  } catch {
    return 18; // default fallback
  }
};

// 1. /latest-block endpoint
app.get("/latest-block", async (_req, res) => {
  try {
    const b = await RPC.getBlock("latest");
    if (!b) {
      return res.status(500).json({ error: "Failed to get latest block" });
    }
    res.json({ 
      block: { 
        blockNumber: b.number, 
        blockTimestamp: b.timestamp 
      }
    });
  } catch (error) {
    console.error("Error getting latest block:", error);
    res.status(500).json({ error: "Failed to get latest block" });
  }
});

// 2. /asset endpoint
app.get("/asset", async (req, res) => {
  try {
    const id = (req.query.id as string)?.toLowerCase();
    if (!id) {
      return res.status(400).json({ error: "Asset id is required" });
    }
    
    // Validate address format
    if (!isAddress(id)) {
      return res.status(400).json({ error: "Invalid asset address format" });
    }

    if (id === WBERA.id.toLowerCase()) {
      return res.json({ asset: WBERA });
    }

    // Check cache with TTL
    const cached = assetMemo.get(id);
    if (cached && (Date.now() - cached.timestamp) < ASSET_CACHE_TTL) {
      return res.json({ asset: cached.data });
    }

    // Fetch fresh data if not cached or expired
    const erc = new Contract(id, [
      "function name() view returns(string)",
      "function symbol() view returns(string)",
      "function totalSupply() view returns(uint256)",
      "function decimals() view returns(uint8)"
    ], RPC);

    const [name, symbol, supply, decimals] = await Promise.all([
      erc.name().catch(() => "Unknown"),
      erc.symbol().catch(() => "UNK"),
      erc.totalSupply().catch(() => "0"),
      erc.decimals().catch(() => 18)
    ]);

    const assetData = {
      id: id,
      name,
      symbol,
      totalSupply: supply.toString(),
      decimals: Number(decimals),
      metadata: { chainId: CHA.toString() }
    };

    // Cache with timestamp
    assetMemo.set(id, {
      data: assetData,
      timestamp: Date.now()
    });
    
    res.json({ asset: assetData });
  } catch (error) {
    console.error("Error getting asset:", error);
    res.status(500).json({ error: "Failed to get asset" });
  }
});

// 3. /pair endpoint
app.get("/pair", async (req, res) => {
  try {
    const core = (req.query.id as string)?.toLowerCase();
    if (!core) {
      return res.status(400).json({ error: "Pair id is required" });
    }
    
    // Validate address format
    if (!isAddress(core)) {
      return res.status(400).json({ error: "Invalid pair address format" });
    }
    
    if (!CORES.includes(core)) {
      return res.status(404).json({ error: "Pair not found" });
    }

    const con = new Contract(core, CORE_ABI, RPC);
    const tok = core; // Core IS the token in Osito architecture

    // deterministic ordering (alphabetical)
    const [asset0Id, asset1Id] = [tok, WBERA.id].sort((a, b) => a.localeCompare(b));

    res.json({
      pair: {
        id: core,
        dexKey: "osito",
        asset0Id,
        asset1Id,
        feeBps: 30,
        metadata: { chainId: CHA.toString() }
      }
    });
  } catch (error) {
    console.error("Error getting pair:", error);
    res.status(500).json({ error: "Failed to get pair" });
  }
});

// 4. /events endpoint
app.get("/events", async (req, res) => {
  try {
    const from = Number(req.query.fromBlock);
    const to = Number(req.query.toBlock);
    
    // Enhanced validation
    if (isNaN(from) || isNaN(to) || to < from) {
      return res.status(400).json({ error: "Invalid block range" });
    }
    
    // Prevent very large block ranges that could cause timeouts
    const MAX_BLOCK_RANGE = Number(process.env.MAX_BLOCK_RANGE) || 1000;
    if ((to - from) > MAX_BLOCK_RANGE) {
      return res.status(400).json({ 
        error: `Block range too large. Maximum allowed range is ${MAX_BLOCK_RANGE} blocks.` 
      });
    }
    
    // Ensure blocks are not in the future
    const latestBlock = await RPC.getBlock("latest");
    if (latestBlock && to > latestBlock.number) {
      return res.status(400).json({ 
        error: `Block range extends beyond latest block ${latestBlock.number}` 
      });
    }

    const events: any[] = [];

    for (const coreAddr of CORES) {
      const core = new Contract(coreAddr, CORE_ABI, RPC);
      const tokAdr = coreAddr; // Core IS the token in Osito architecture
      const [asset0Id, asset1Id] = [tokAdr, WBERA.id].sort((a, b) => a.localeCompare(b));
      
      // Get asset decimals
      const tokDecimals = await getAssetDecimals(tokAdr);
      const wberaDecimals = 18;
      
      const topic0 = core.interface.getEvent("Swap")?.topicHash;
      if (!topic0) continue;

      const logs = await RPC.getLogs({ 
        address: coreAddr, 
        topics: [topic0], 
        fromBlock: from, 
        toBlock: to 
      });

      // Batch fetch all required data for performance
      const uniqueBlockNumbers = [...new Set(logs.map(log => log.blockNumber))];
      const uniqueTxHashes = [...new Set(logs.map(log => log.transactionHash))];
      
      // Batch fetch blocks and transactions
      const blockPromises = uniqueBlockNumbers.map(blockNum => RPC.getBlock(blockNum));
      const txPromises = uniqueTxHashes.map(txHash => RPC.getTransaction(txHash));
      
      const [blocks, transactions] = await Promise.all([
        Promise.all(blockPromises),
        Promise.all(txPromises)
      ]);
      
      // Create lookup maps for fast access
      const blockMap = new Map(blocks.filter(b => b).map(b => [b!.number, b!]));
      const txMap = new Map(transactions.filter(tx => tx).map(tx => [tx!.hash, tx!]));

      for (const log of logs) {
        const { args } = core.interface.parseLog(log)!;
        const [tokIn, amountIn, amountOut, feeQT] = args;
        const block = blockMap.get(log.blockNumber);
        const transaction = txMap.get(log.transactionHash);
        
        if (!block) continue;

        // Calculate priceNative (asset0 quoted in asset1) with precision handling
        let price: number;
        if (tokIn) {
          // Token in, WBERA out
          const tokAmount = Number(formatUnits(amountIn, tokDecimals));
          const wberaAmount = Number(formatUnits(amountOut, wberaDecimals));
          // Price = asset1 / asset0 (always WBERA / Token for consistency)
          price = asset0Id === tokAdr ? wberaAmount / tokAmount : tokAmount / wberaAmount;
        } else {
          // WBERA in, Token out
          const wberaAmount = Number(formatUnits(amountIn, wberaDecimals));
          const tokAmount = Number(formatUnits(amountOut, tokDecimals));
          // Price = asset1 / asset0 (always WBERA / Token for consistency)
          price = asset0Id === tokAdr ? wberaAmount / tokAmount : tokAmount / wberaAmount;
        }
        
        // Ensure price is finite and positive
        if (!isFinite(price) || price <= 0) {
          console.warn(`Invalid price calculated: ${price} for tx ${log.transactionHash}`);
          continue;
        }

        // Create swap object
        const swapObj: any = {
          block: { 
            blockNumber: block.number, 
            blockTimestamp: block.timestamp 
          },
          eventType: "swap",
          txnId: log.transactionHash,
          txnIndex: log.transactionIndex || 0,
          eventIndex: (log as any).logIndex || 0,
          maker: transaction?.from || "0x0000000000000000000000000000000000000000", // Actual transaction sender
          pairId: coreAddr,
          priceNative: price.toString()
        };

        // Set in/out amounts respecting sorted order
        if (tokIn) {
          if (asset0Id === tokAdr) {
            swapObj.asset0In = formatUnits(amountIn, tokDecimals);
            swapObj.asset1Out = formatUnits(amountOut, wberaDecimals);
          } else {
            swapObj.asset1In = formatUnits(amountIn, tokDecimals);
            swapObj.asset0Out = formatUnits(amountOut, wberaDecimals);
          }
        } else {
          if (asset0Id === tokAdr) {
            swapObj.asset1In = formatUnits(amountIn, wberaDecimals);
            swapObj.asset0Out = formatUnits(amountOut, tokDecimals);
          } else {
            swapObj.asset0In = formatUnits(amountIn, wberaDecimals);
            swapObj.asset1Out = formatUnits(amountOut, tokDecimals);
          }
        }

        events.push(swapObj);
      }

      // Attach reserves only to last event of each block
      if (events.length > 0) {
        const lastByBlock = new Map<number, any>();
        for (const ev of events) {
          if (ev.pairId === coreAddr) {
            lastByBlock.set(ev.block.blockNumber, ev);
          }
        }
        
        for (const [blk, ev] of lastByBlock) {
          try {
            const R = await core.R({ blockTag: blk });
            const reserveTok = Number(formatUnits(R.T, tokDecimals));
            const reserveW = Number(formatUnits(R.Q, wberaDecimals));

            ev.reserves = {
              asset0: asset0Id === tokAdr ? reserveTok.toString() : reserveW.toString(),
              asset1: asset1Id === tokAdr ? reserveTok.toString() : reserveW.toString()
            };
          } catch (error) {
            console.error(`Error getting reserves for block ${blk}:`, error);
          }
        }
      }
    }

    // Sort for determinism
    events.sort((a, b) =>
      a.block.blockNumber - b.block.blockNumber ||
      a.txnIndex - b.txnIndex ||
      a.eventIndex - b.eventIndex
    );

    res.json({ events });
  } catch (error) {
    console.error("Error getting events:", error);
    res.status(500).json({ error: "Failed to get events" });
  }
});

// Optional dust sweep (low priority)
app.post("/sweep-dust", (_req, res) => {
  // Implementation would depend on specific requirements
  res.json({ message: "Dust sweep not implemented yet" });
});

// Enhanced health check endpoint
app.get("/health", async (_req, res) => {
  try {
    // Check RPC connectivity
    const latestBlock = await RPC.getBlock("latest");
    if (!latestBlock) {
      return res.status(503).json({ 
        status: "unhealthy", 
        error: "Cannot connect to RPC",
        timestamp: Date.now() 
      });
    }

    res.json({ 
      status: "ok", 
      timestamp: Date.now(),
      blockNumber: latestBlock.number,
      coreCount: CORES.length,
      cacheSize: assetMemo.size,
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({ 
      status: "unhealthy", 
      error: "Health check failed",
      timestamp: Date.now() 
    });
  }
});

// Start server with graceful shutdown
const server = app.listen(PORT, () => {
  console.log(`✅ Osito DEX Screener Adapter listening on port ${PORT}`);
  console.log(`📊 Chain ID: ${CHA}`);
  console.log(`🌐 RPC URL: ${process.env.RPC_URL}`);
  console.log(`💎 Tracking ${CORES.length} core contracts`);
  console.log(`🚀 Server ready for DexScreener integration`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed. Goodbye!');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed. Goodbye!');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
export default app; 