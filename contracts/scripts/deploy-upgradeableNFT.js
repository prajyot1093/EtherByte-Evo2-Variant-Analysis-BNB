
const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const GenomeNFT = await ethers.getContractFactory("GenomeNFT");
  const genomeNFT = await upgrades.deployProxy(GenomeNFT, [deployer.address], {
    initializer: "initialize",
  });
  await genomeNFT.waitForDeployment();
  const address = await genomeNFT.getAddress();
  console.log("GenomeNFT (proxy) deployed to:", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
