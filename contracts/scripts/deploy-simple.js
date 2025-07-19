const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("🚀 Deploying Genome Platform contracts to BNB Chain...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "BNB");

  // 1. Deploy GenomeToken
  console.log("\n1. Deploying GenomeToken...");
  const GenomeToken = await ethers.getContractFactory("GenomeToken");
  const genomeToken = await upgrades.deployProxy(
    GenomeToken,
    [deployer.address],
    { initializer: "initialize" }
  );
  await genomeToken.waitForDeployment();
  const genomeTokenAddress = await genomeToken.getAddress();
  console.log("✅ GenomeToken deployed to:", genomeTokenAddress);

  // 2. Deploy GenomeNFT
  console.log("\n2. Deploying GenomeNFT...");
  const GenomeNFT = await ethers.getContractFactory("GenomeNFT");
  const genomeNFT = await upgrades.deployProxy(
    GenomeNFT,
    [deployer.address],
    { initializer: "initialize" }
  );
  await genomeNFT.waitForDeployment();
  const genomeNFTAddress = await genomeNFT.getAddress();
  console.log("✅ GenomeNFT deployed to:", genomeNFTAddress);

  // 3. Deploy GenomeMarketplace
  console.log("\n3. Deploying GenomeMarketplace...");
  const GenomeMarketplace = await ethers.getContractFactory("GenomeMarketplace");
  const genomeMarketplace = await upgrades.deployProxy(
    GenomeMarketplace,
    [genomeNFTAddress, genomeTokenAddress, deployer.address, deployer.address],
    { initializer: "initialize" }
  );
  await genomeMarketplace.waitForDeployment();
  const genomeMarketplaceAddress = await genomeMarketplace.getAddress();
  console.log("✅ GenomeMarketplace deployed to:", genomeMarketplaceAddress);

  // 4. Deploy GenomeDAO
  console.log("\n4. Deploying GenomeDAO...");
  const GenomeDAO = await ethers.getContractFactory("GenomeDAO");
  const genomeDAO = await upgrades.deployProxy(
    GenomeDAO,
    [genomeTokenAddress, deployer.address, deployer.address],
    { initializer: "initialize" }
  );
  await genomeDAO.waitForDeployment();
  const genomeDAOAddress = await genomeDAO.getAddress();
  console.log("✅ GenomeDAO deployed to:", genomeDAOAddress);

  // 5. Setup contract connections
  console.log("\n5. 🔗 Setting up contract connections...");
  
  console.log("Setting GenomeToken in GenomeNFT...");
  await genomeNFT.setGenomeToken(genomeTokenAddress);
  
  console.log("Adding GenomeNFT as authorized minter...");
  await genomeToken.addMinter(genomeNFTAddress);
  
  console.log("Adding GenomeDAO as authorized minter...");
  await genomeToken.addMinter(genomeDAOAddress);

  console.log("\n🎉 All contracts deployed and configured successfully!");
  
  // Contract addresses for integration
  const addresses = {
    network: "bnb-testnet",
    chainId: 97,
    deployer: deployer.address,
    contracts: {
      genomeToken: genomeTokenAddress,
      genomeNFT: genomeNFTAddress,
      genomeMarketplace: genomeMarketplaceAddress,
      genomeDAO: genomeDAOAddress
    },
    deployedAt: new Date().toISOString(),
    explorerUrls: {
      genomeToken: `https://testnet.bscscan.com/address/${genomeTokenAddress}`,
      genomeNFT: `https://testnet.bscscan.com/address/${genomeNFTAddress}`,
      genomeMarketplace: `https://testnet.bscscan.com/address/${genomeMarketplaceAddress}`,
      genomeDAO: `https://testnet.bscscan.com/address/${genomeDAOAddress}`
    }
  };
  
  // Save addresses
  const fs = require('fs');
  fs.writeFileSync('deployed-contracts.json', JSON.stringify(addresses, null, 2));
  
  console.log("\n📋 Contract Addresses Summary:");
  console.log("================================");
  console.log("GenomeToken:      ", genomeTokenAddress);
  console.log("GenomeNFT:        ", genomeNFTAddress);
  console.log("GenomeMarketplace:", genomeMarketplaceAddress);
  console.log("GenomeDAO:        ", genomeDAOAddress);
  
  console.log("\n🔍 View on BscScan Testnet:");
  console.log("===========================");
  console.log("GenomeToken:      ", addresses.explorerUrls.genomeToken);
  console.log("GenomeNFT:        ", addresses.explorerUrls.genomeNFT);
  console.log("GenomeMarketplace:", addresses.explorerUrls.genomeMarketplace);
  console.log("GenomeDAO:        ", addresses.explorerUrls.genomeDAO);
  
  console.log("\n💾 Contract addresses saved to 'deployed-contracts.json'");
  console.log("\n🎯 Next Steps:");
  console.log("1. Share deployed-contracts.json with your team");
  console.log("2. Update frontend with contract addresses");
  console.log("3. Update backend with contract ABIs");
  console.log("4. Test NFT minting functionality");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
