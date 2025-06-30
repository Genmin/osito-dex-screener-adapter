const express = require('express');
const app = express();
const PORT = 3001;

// Mock data for testing
const MOCK_WBERA = {
  id: "0x6969696969696969696969696969696969696969",
  name: "Wrapped BERA",
  symbol: "WBERA",
  totalSupply: "1000000000000000000000000",
  decimals: 18,
  metadata: { chainId: "80069" }
};

const MOCK_CORES = [
  "0xf7907d94a1faa79f3f552a9f3ca2b82a27d31f09",
  "0xbd4bd1d5b9954f8acb98cea90e48392ef3a9a0fe"
];

// 1. /latest-block endpoint
app.get("/latest-block", (req, res) => {
  res.json({ 
    block: { 
      blockNumber: 6063155, 
      blockTimestamp: 1751303331 
    }
  });
});

// 2. /asset endpoint
app.get("/asset", (req, res) => {
  const id = req.query.id?.toLowerCase();
  
  if (!id) {
    return res.status(400).json({ error: "Asset id is required" });
  }

  if (id === MOCK_WBERA.id.toLowerCase()) {
    return res.json({ asset: MOCK_WBERA });
  }

  // Mock token data for test tokens
  if (id === "0x07974f37167524b0b56da29b5b437014c5626797") {
    return res.json({
      asset: {
        id: id,
        name: "TestCoin A",
        symbol: "TESTA",
        totalSupply: "1000000000000000000000000",
        decimals: 18,
        metadata: { chainId: "80069" }
      }
    });
  }

  if (id === "0xfc363be22236d5034381b08e17c4e763b8334c79") {
    return res.json({
      asset: {
        id: id,
        name: "TestCoin B", 
        symbol: "TESTB",
        totalSupply: "2000000000000000000000000",
        decimals: 18,
        metadata: { chainId: "80069" }
      }
    });
  }

  // Default unknown token
  res.json({
    asset: {
      id: id,
      name: "Unknown Token",
      symbol: "UNK",
      totalSupply: "0",
      decimals: 18,
      metadata: { chainId: "80069" }
    }
  });
});

// 3. /pair endpoint
app.get("/pair", (req, res) => {
  const core = req.query.id;
  
  if (!core) {
    return res.status(400).json({ error: "Pair id is required" });
  }
  
  if (!MOCK_CORES.includes(core)) {
    return res.status(404).json({ error: "Pair not found" });
  }

  // Mock pair data
  let asset0Id, asset1Id;
  if (core === MOCK_CORES[0]) {
    // TestCoin A pair
    [asset0Id, asset1Id] = ["0x07974f37167524b0b56da29b5b437014c5626797", MOCK_WBERA.id].sort();
  } else {
    // TestCoin B pair  
    [asset0Id, asset1Id] = ["0xfc363be22236d5034381b08e17c4e763b8334c79", MOCK_WBERA.id].sort();
  }

  res.json({
    pair: {
      id: core,
      dexKey: "osito",
      asset0Id,
      asset1Id,
      feeBps: 30,
      metadata: { chainId: "80069" }
    }
  });
});

// 4. /events endpoint
app.get("/events", (req, res) => {
  const from = Number(req.query.fromBlock);
  const to = Number(req.query.toBlock);
  
  if (isNaN(from) || isNaN(to) || to < from) {
    return res.status(400).json({ error: "Invalid block range" });
  }

  // Mock swap events
  const events = [
    {
      block: { 
        blockNumber: 6063100, 
        blockTimestamp: 1751303000 
      },
      eventType: "swap",
      txnId: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      txnIndex: 0,
      eventIndex: 0,
      maker: "0x37a9b9df87b2cd3fc73a9c0ad10b4aff2d52bcc5",
      pairId: MOCK_CORES[0],
      asset0In: "1000.0",
      asset1Out: "500.0",
      priceNative: "0.5"
    },
    {
      block: { 
        blockNumber: 6063120, 
        blockTimestamp: 1751303100 
      },
      eventType: "swap",
      txnId: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
      txnIndex: 1,
      eventIndex: 1,
      maker: "0x37a9b9df87b2cd3fc73a9c0ad10b4aff2d52bcc5",
      pairId: MOCK_CORES[1],
      asset1In: "200.0",
      asset0Out: "100.0", 
      priceNative: "2.0"
    }
  ];

  // Filter events by block range
  const filteredEvents = events.filter(e => 
    e.block.blockNumber >= from && e.block.blockNumber <= to
  );

  res.json({ events: filteredEvents });
});

// Health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: Date.now(),
    message: "Osito DEX Screener Adapter Mock Server" 
  });
});

app.listen(PORT, () => {
  console.log(`🎯 Osito DEX Screener Mock Adapter listening on port ${PORT}`);
  console.log(`📊 Chain ID: 80069 (Berachain Testnet)`);
  console.log(`🚀 Tracking ${MOCK_CORES.length} core contracts`);
  console.log('');
  console.log('✅ Test endpoints:');
  console.log(`   http://localhost:${PORT}/health`);
  console.log(`   http://localhost:${PORT}/latest-block`);
  console.log(`   http://localhost:${PORT}/asset?id=${MOCK_WBERA.id}`);
  console.log(`   http://localhost:${PORT}/pair?id=${MOCK_CORES[0]}`);
  console.log(`   http://localhost:${PORT}/events?fromBlock=6063000&toBlock=6063200`);
}); 