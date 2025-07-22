import { JsonRpcProvider, Contract, formatEther } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

// Factory ABI - for getting deployed cores
const FACTORY_ABI = [
  "event CoreCreated(address indexed token, address indexed core, address indexed burner, string symbol, address deployer)",
  "function allCores(uint256) view returns(address)",
  "function coreCount() view returns(uint256)"
];

async function getCoreAddresses() {
  const RPC_URL = process.env.RPC_URL;
  const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS;

  if (!RPC_URL) {
    console.error("❌ RPC_URL not found in environment variables");
    process.exit(1);
  }

  if (!FACTORY_ADDRESS) {
    console.error("❌ FACTORY_ADDRESS not found in environment variables");
    console.log("Please add FACTORY_ADDRESS to your .env file");
    console.log("Factory address: 0xCC5bD9c91006f56e789349786fcd7F49576c17F0");
    process.exit(1);
  }

  try {
    const provider = new JsonRpcProvider(RPC_URL);
    const factory = new Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);

    console.log("🔍 Fetching Core contract addresses from Factory...");
    
    // Get current block for querying events
    const latestBlock = await provider.getBlock("latest");
    if (!latestBlock) {
      throw new Error("Could not get latest block");
    }

    console.log(`📊 Current block: ${latestBlock.number}`);

    // Query CoreCreated events from factory deployment to now
    // Use smaller blocks to avoid RPC limits
    const deploymentBlock = 8071795; // Approximate block when factory was deployed
    
    let events: any[] = [];
    const blockRange = 9999; // Just under the 10k limit
    
    for (let fromBlock = deploymentBlock; fromBlock <= latestBlock.number; fromBlock += blockRange) {
      const toBlock = Math.min(fromBlock + blockRange - 1, latestBlock.number);
      console.log(`🔍 Querying blocks ${fromBlock} to ${toBlock}...`);
      
      try {
        const batchEvents = await factory.queryFilter("CoreCreated", fromBlock, toBlock);
        events = events.concat(batchEvents);
        console.log(`   Found ${batchEvents.length} events in this batch`);
      } catch (error) {
        console.log(`   Error in batch ${fromBlock}-${toBlock}, continuing...`);
      }
    }
    
    console.log(`📊 Found ${events.length} CoreCreated events`);

    if (events.length === 0) {
      console.log("⚠️ No cores have been deployed yet");
      console.log("📋 For your .env file:");
      console.log("CORES=");
      return;
    }

    const coreAddresses = events
      .filter((event): event is any => 'args' in event && event.args != null)
      .map(event => event.args.core)
      .filter(addr => addr);
    
    console.log("\n✅ Core Contract Addresses:");
    coreAddresses.forEach((address: string, index: number) => {
      console.log(`${index + 1}. ${address}`);
    });

    console.log("\n📋 For your .env file:");
    console.log(`CORES=${coreAddresses.join(',')}`);

    // Also show event details
    console.log("\n📋 Core Details:");
    events
      .filter((event): event is any => 'args' in event && event.args != null)
      .forEach((event, index) => {
        const { core, token, burner, symbol, deployer } = event.args;
        console.log(`${index + 1}. Core: ${core}`);
        console.log(`   Token: ${token}`);  
        console.log(`   Symbol: ${symbol}`);
        console.log(`   Burner: ${burner}`);
        console.log(`   Deployer: ${deployer}`);
        console.log(`   Block: ${event.blockNumber}`);
        console.log();
      });

  } catch (error) {
    console.error("❌ Error fetching core addresses:", error);
    process.exit(1);
  }
}

// Run the script
getCoreAddresses().catch(console.error); 