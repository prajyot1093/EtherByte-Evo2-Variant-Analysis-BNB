require('@openzeppelin/hardhat-upgrades');
const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const GenomeToken = await ethers.getContractFactory("GenomeToken");
  const genomeToken = await upgrades.deployProxy(GenomeToken, [deployer.address], {
    initializer: "initialize",
  });
  await genomeToken.waitForDeployment();
  const address = await genomeToken.getAddress();
  console.log("GenomeToken (proxy) deployed to:", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
