const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("Deploying Genome Platform contracts to BNB Chain...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "BNB");

  // 1. Deploy GenomeToken first
  console.log("\n1. Deploying GenomeToken...");
  const GenomeToken = await ethers.getContractFactory("GenomeToken");
  const genomeToken = await upgrades.deployProxy(
    GenomeToken,
    [deployer.address], // owner
    { initializer: "initialize" }
  );
  await genomeToken.waitForDeployment();
  console.log("GenomeToken deployed to:", await genomeToken.getAddress());

  // 2. Deploy GenomeNFT
  console.log("\n2. Deploying GenomeNFT...");
  const GenomeNFT = await ethers.getContractFactory("GenomeNFT");
  const genomeNFT = await upgrades.deployProxy(
    GenomeNFT,
    [deployer.address], // owner
    { initializer: "initialize" }
  );
  await genomeNFT.waitForDeployment();
  console.log("GenomeNFT deployed to:", await genomeNFT.getAddress());

  // 3. Deploy GenomeMarketplace
  console.log("\n3. Deploying GenomeMarketplace...");
  const GenomeMarketplace = await ethers.getContractFactory("GenomeMarketplace");
  const genomeMarketplace = await upgrades.deployProxy(
    GenomeMarketplace,
    [
      await genomeNFT.getAddress(),    // NFT contract
      await genomeToken.getAddress(),  // Token contract
      deployer.address,                // Fee recipient
      deployer.address                 // Owner
    ],
    { initializer: "initialize" }
  );
  await genomeMarketplace.waitForDeployment();
  console.log("GenomeMarketplace deployed to:", await genomeMarketplace.getAddress());

  // 4. Deploy GenomeDAO
  console.log("\n4. Deploying GenomeDAO...");
  const GenomeDAO = await ethers.getContractFactory("GenomeDAO");
  const genomeDAO = await upgrades.deployProxy(
    GenomeDAO,
    [
      await genomeToken.getAddress(),  // Token contract for voting
      deployer.address,                // Treasury
      deployer.address                 // Owner
    ],
    { initializer: "initialize" }
  );
  await genomeDAO.waitForDeployment();
  console.log("GenomeDAO deployed to:", await genomeDAO.getAddress());

  // 5. Setup contract connections
  console.log("\n5. Setting up contract connections...");
  
  // Set GenomeToken address in GenomeNFT for rewards
  console.log("Setting GenomeToken in GenomeNFT...");
  await genomeNFT.setGenomeToken(await genomeToken.getAddress());
  
  // Add GenomeNFT as authorized minter for GenomeToken
  console.log("Adding GenomeNFT as authorized minter...");
  await genomeToken.addMinter(await genomeNFT.getAddress());
  
  // Add GenomeDAO as authorized minter for GenomeToken (for research rewards)
  console.log("Adding GenomeDAO as authorized minter...");
  await genomeToken.addMinter(await genomeDAO.getAddress());

  // Transfer some tokens to DAO treasury for research funding
  console.log("Funding DAO treasury with GENOME tokens...");
  const daoFunding = ethers.parseEther("10000000"); // 10M tokens
  await genomeToken.transfer(await genomeDAO.getAddress(), daoFunding);

  // Send some BNB to DAO for funding (reduced amount)
  console.log("Funding DAO treasury with BNB...");
  await deployer.sendTransaction({
    to: await genomeDAO.getAddress(),
    value: ethers.parseEther("0.1") // Reduced to 0.1 BNB
  });

  console.log("\n✅ All contracts deployed and configured successfully!");
  
  // Print summary
  console.log("\n📋 Contract Addresses Summary:");
  console.log("================================");
  console.log("GenomeToken:      ", await genomeToken.getAddress());
  console.log("GenomeNFT:        ", await genomeNFT.getAddress());
  console.log("GenomeMarketplace:", await genomeMarketplace.getAddress());
  console.log("GenomeDAO:        ", await genomeDAO.getAddress());
  
  console.log("\n📊 Initial State:");
  console.log("=================");
  console.log("GenomeToken total supply:", ethers.formatEther(await genomeToken.totalSupply()), "GENOME");
  console.log("DAO GENOME balance:      ", ethers.formatEther(await genomeToken.balanceOf(await genomeDAO.getAddress())), "GENOME");
  console.log("DAO BNB balance:         ", ethers.formatEther(await ethers.provider.getBalance(await genomeDAO.getAddress())), "BNB");
  
  console.log("\n🔗 Next Steps:");
  console.log("===============");
  console.log("1. Update frontend with contract addresses");
  console.log("2. Update backend with contract ABIs");
  console.log("3. Test NFT minting and marketplace functionality");
  console.log("4. Create first DAO proposal");
  
  // Save addresses to file for frontend/backend integration
  const addresses = {
    genomeToken: await genomeToken.getAddress(),
    genomeNFT: await genomeNFT.getAddress(),
    genomeMarketplace: await genomeMarketplace.getAddress(),
    genomeDAO: await genomeDAO.getAddress(),
    deployer: deployer.address,
    network: "bnb-testnet",
    deployedAt: new Date().toISOString()
  };
  
  const fs = require('fs');
  fs.writeFileSync(
    'deployed-contracts.json',
    JSON.stringify(addresses, null, 2)
  );
  console.log("\n💾 Contract addresses saved to 'deployed-contracts.json'");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
