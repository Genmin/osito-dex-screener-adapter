import { JsonRpcProvider, Contract } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

// CoreRegistry ABI - minimal interface for getting core addresses
const CORE_REGISTRY_ABI = [
  "function getCores() view returns(address[])",
  "function coreCount() view returns(uint256)"
];

async function getCoreAddresses() {
  const RPC_URL = process.env.RPC_URL;
  const CORE_REGISTRY_ADDRESS = process.env.CORE_REGISTRY_ADDRESS;

  if (!RPC_URL) {
    console.error("❌ RPC_URL not found in environment variables");
    process.exit(1);
  }

  if (!CORE_REGISTRY_ADDRESS) {
    console.error("❌ CORE_REGISTRY_ADDRESS not found in environment variables");
    console.log("Please add CORE_REGISTRY_ADDRESS to your .env file");
    process.exit(1);
  }

  try {
    const provider = new JsonRpcProvider(RPC_URL);
    const registry = new Contract(CORE_REGISTRY_ADDRESS, CORE_REGISTRY_ABI, provider);

    console.log("🔍 Fetching Core contract addresses...");
    
    const coreCount = await registry.coreCount();
    console.log(`📊 Found ${coreCount} core contracts`);

    const coreAddresses = await registry.getCores();
    
    console.log("\n✅ Core Contract Addresses:");
    coreAddresses.forEach((address: string, index: number) => {
      console.log(`${index + 1}. ${address}`);
    });

    console.log("\n📋 For your .env file:");
    console.log(`CORES=${coreAddresses.join(',')}`);

  } catch (error) {
    console.error("❌ Error fetching core addresses:", error);
    process.exit(1);
  }
}

// Run the script
getCoreAddresses().catch(console.error); 