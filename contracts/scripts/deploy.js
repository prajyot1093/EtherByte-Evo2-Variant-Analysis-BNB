
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const GenomeNFT = await hre.ethers.getContractFactory("GenomeNFT");
  const genomeNFT = await GenomeNFT.deploy();
  await genomeNFT.waitForDeployment();
  const address = await genomeNFT.getAddress();
  console.log("GenomeNFT deployed to:", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
