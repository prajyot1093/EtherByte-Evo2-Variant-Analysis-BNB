#!/usr/bin/env node

/**
 * Quick test script to verify blockchain integrations are working
 * Run with: node test-contracts.js
 */

const { createPublicClient, http } = require('viem');
const { bscTestnet } = require('viem/chains');

// Contract addresses
const CONTRACTS = {
  GENOME_NFT: "0x2181B366B730628F97c44C17de19949e5359682C",
  GENOME_TOKEN: "0x0C5f98e281cB3562a2EEDF3EE63D3b623De98b15",
  MARKETPLACE: "0xd80bE0DDCA595fFf35bF44A7d2D4E312b05A1576",
  DAO: "0x8FEbF8eA03E8e54846a7B82f7F6146bAE17bd3f4"
};

// Create public client
const publicClient = createPublicClient({
  chain: bscTestnet,
  transport: http()
});

async function testContracts() {
  console.log('🧬 Testing Evo2 Variant Analysis BNB Smart Contracts...\n');

  try {
    // Test 1: Check if contracts are deployed
    console.log('📋 Testing contract deployments...');
    
    for (const [name, address] of Object.entries(CONTRACTS)) {
      try {
        const code = await publicClient.getBytecode({ address });
        const status = code && code !== '0x' ? '✅ Deployed' : '❌ Not deployed';
        console.log(`${name}: ${address} - ${status}`);
      } catch (error) {
        console.log(`${name}: ${address} - ❌ Error: ${error.message}`);
      }
    }

    // Test 2: Check blockchain connection
    console.log('\n⛓️  Testing blockchain connection...');
    const blockNumber = await publicClient.getBlockNumber();
    console.log(`✅ Connected to BNB Testnet, latest block: ${blockNumber}`);

    // Test 3: Test basic contract calls (if contracts support them)
    console.log('\n🔧 Testing basic contract calls...');
    
    // Test NFT total supply (if function exists)
    try {
      const nftSupply = await publicClient.readContract({
        address: CONTRACTS.GENOME_NFT,
        abi: [{ 
          "inputs": [], 
          "name": "totalSupply", 
          "outputs": [{"type": "uint256"}], 
          "stateMutability": "view", 
          "type": "function" 
        }],
        functionName: 'totalSupply'
      });
      console.log(`✅ NFT Total Supply: ${nftSupply}`);
    } catch (error) {
      console.log(`⚠️  NFT totalSupply not available or different ABI`);
    }

    // Test token total supply
    try {
      const tokenSupply = await publicClient.readContract({
        address: CONTRACTS.GENOME_TOKEN,
        abi: [{ 
          "inputs": [], 
          "name": "totalSupply", 
          "outputs": [{"type": "uint256"}], 
          "stateMutability": "view", 
          "type": "function" 
        }],
        functionName: 'totalSupply'
      });
      console.log(`✅ Token Total Supply: ${Number(tokenSupply) / Math.pow(10, 18)} GENOME`);
    } catch (error) {
      console.log(`⚠️  Token totalSupply call failed: ${error.message}`);
    }

    // Test marketplace listing counter
    try {
      const listingCount = await publicClient.readContract({
        address: CONTRACTS.MARKETPLACE,
        abi: [{ 
          "inputs": [], 
          "name": "listingCounter", 
          "outputs": [{"type": "uint256"}], 
          "stateMutability": "view", 
          "type": "function" 
        }],
        functionName: 'listingCounter'
      });
      console.log(`✅ Marketplace Listings: ${listingCount}`);
    } catch (error) {
      console.log(`⚠️  Marketplace listingCounter call failed: ${error.message}`);
    }

    // Test DAO proposal counter
    try {
      const proposalCount = await publicClient.readContract({
        address: CONTRACTS.DAO,
        abi: [{ 
          "inputs": [], 
          "name": "proposalCounter", 
          "outputs": [{"type": "uint256"}], 
          "stateMutability": "view", 
          "type": "function" 
        }],
        functionName: 'proposalCounter'
      });
      console.log(`✅ DAO Proposals: ${proposalCount}`);
    } catch (error) {
      console.log(`⚠️  DAO proposalCounter call failed: ${error.message}`);
    }

    console.log('\n🎉 Contract testing completed!');
    console.log('\n💡 Next steps:');
    console.log('1. Connect your wallet to the frontend');
    console.log('2. Test the sequence analysis → NFT minting flow');
    console.log('3. Try marketplace and DAO features');
    console.log('4. Check that token rewards are working');

  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

// Run the test
testContracts().catch(console.error);
