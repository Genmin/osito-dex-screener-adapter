import { JsonRpcProvider, Contract, formatUnits } from "ethers";
import LRU from "lru-cache";
import express from "express";
import * as dotenv from "dotenv";
dotenv.config();

const RPC  = new JsonRpcProvider(process.env.RPC_URL);
const CHA  = Number(process.env.CHAIN_ID);
const PORT = Number(process.env.PORT ?? 3000);

// Parse CORES from environment variable
const CORES = process.env.CORES?.split(',') || [];

const WBERA = {
  id:      process.env.WBERA_ADDRESS || "0x7507c1dc16935B82698e4C63f2746A5fCf994dF8",
  name:    "Wrapped BERA",
  symbol:  "WBERA",
  decimals: 18
};

const CORE_ABI = [
  "event Swap(address indexed u,bool tokIn,uint256 inAmt,uint256 outAmt,uint256 feeTok)",
  "function TOK() view returns(address)",
  "function R() view returns(uint128 T,uint128 Q,uint128,uint128)"
];

// small 100-block cache
const blockCache = new LRU<number, any[]>({ max: 100 });

const app = express();

// Asset memoization
const assetMemo = new Map<string, any>();

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

    if (id === WBERA.id.toLowerCase()) {
      return res.json({ asset: WBERA });
    }

    if (!assetMemo.has(id)) {
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

      assetMemo.set(id, {
        id: id,
        name,
        symbol,
        totalSupply: supply.toString(),
        decimals,
        metadata: { chainId: CHA.toString() }
      });
    }
    
    res.json({ asset: assetMemo.get(id) });
  } catch (error) {
    console.error("Error getting asset:", error);
    res.status(500).json({ error: "Failed to get asset" });
  }
});

// 3. /pair endpoint
app.get("/pair", async (req, res) => {
  try {
    const core = req.query.id as string;
    if (!core) {
      return res.status(400).json({ error: "Pair id is required" });
    }
    
    if (!CORES.includes(core)) {
      return res.status(404).json({ error: "Pair not found" });
    }

    const con = new Contract(core, CORE_ABI, RPC);
    const tok = (await con.TOK()) as string;

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
    
    if (isNaN(from) || isNaN(to) || to < from) {
      return res.status(400).json({ error: "Invalid block range" });
    }

    const events: any[] = [];

    for (const coreAddr of CORES) {
      const core = new Contract(coreAddr, CORE_ABI, RPC);
      const tokAdr = (await core.TOK()) as string;
      const [asset0Id, asset1Id] = [tokAdr, WBERA.id].sort((a, b) => a.localeCompare(b));
      
      // Get asset decimals
      const tokDecimals = await getAssetDecimals(tokAdr);
      const wberaDecimals = 18;
      
      const topic0 = core.interface.getEvent("Swap").topicHash;

      const logs = await RPC.getLogs({ 
        address: coreAddr, 
        topics: [topic0], 
        fromBlock: from, 
        toBlock: to 
      });

      for (const log of logs) {
        const { args } = core.interface.parseLog(log)!;
        const [u, tokIn, inAmt, outAmt] = args;
        const block = await RPC.getBlock(log.blockNumber);
        
        if (!block) continue;

        // Calculate priceNative (asset0 quoted in asset1)
        let price: number;
        if (tokIn) {
          // Token in, WBERA out
          const tokAmount = Number(formatUnits(inAmt, tokDecimals));
          const wberaAmount = Number(formatUnits(outAmt, wberaDecimals));
          price = asset0Id === tokAdr ? wberaAmount / tokAmount : tokAmount / wberaAmount;
        } else {
          // WBERA in, Token out
          const wberaAmount = Number(formatUnits(inAmt, wberaDecimals));
          const tokAmount = Number(formatUnits(outAmt, tokDecimals));
          price = asset0Id === tokAdr ? wberaAmount / tokAmount : tokAmount / wberaAmount;
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
          eventIndex: log.logIndex || 0,
          maker: u,
          pairId: coreAddr,
          priceNative: price.toString()
        };

        // Set in/out amounts respecting sorted order
        if (tokIn) {
          if (asset0Id === tokAdr) {
            swapObj.asset0In = formatUnits(inAmt, tokDecimals);
            swapObj.asset1Out = formatUnits(outAmt, wberaDecimals);
          } else {
            swapObj.asset1In = formatUnits(inAmt, tokDecimals);
            swapObj.asset0Out = formatUnits(outAmt, wberaDecimals);
          }
        } else {
          if (asset0Id === tokAdr) {
            swapObj.asset1In = formatUnits(inAmt, wberaDecimals);
            swapObj.asset0Out = formatUnits(outAmt, tokDecimals);
          } else {
            swapObj.asset0In = formatUnits(inAmt, wberaDecimals);
            swapObj.asset1Out = formatUnits(outAmt, tokDecimals);
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

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Osito DEX Screener Adapter listening on port ${PORT}`);
  console.log(`Chain ID: ${CHA}`);
  console.log(`RPC URL: ${process.env.RPC_URL}`);
  console.log(`Tracking ${CORES.length} core contracts`);
});

export default app; 