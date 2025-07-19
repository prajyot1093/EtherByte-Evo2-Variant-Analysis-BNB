const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("GenomeNFT", function () {
  let GenomeNFT, genomeNFT, GenomeToken, genomeToken, owner, addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    
    // Deploy GenomeToken first
    GenomeToken = await ethers.getContractFactory("GenomeToken");
    genomeToken = await upgrades.deployProxy(GenomeToken, [owner.address]);
    
    // Deploy GenomeNFT
    GenomeNFT = await ethers.getContractFactory("GenomeNFT");
    genomeNFT = await upgrades.deployProxy(GenomeNFT, [owner.address]);
    
    // Connect them
    await genomeNFT.setGenomeToken(await genomeToken.getAddress());
    await genomeToken.addMinter(await genomeNFT.getAddress());
  });

  it("Should mint an NFT and set token URI", async function () {
    const tx = await genomeNFT.mint(
      addr1.address, 
      "ipfs://testuri",
      "BRCA1",
      "Test gene",
      "QmTestHash",
      80
    );
    await tx.wait();

    expect(await genomeNFT.ownerOf(0)).to.equal(addr1.address);
    expect(await genomeNFT.tokenURI(0)).to.equal("ipfs://testuri");
  });

  it("Should only allow owner to mint", async function () {
    await expect(
      genomeNFT.connect(addr1).mint(
        addr1.address, 
        "ipfs://testuri2",
        "BRCA2",
        "Test gene 2", 
        "QmTestHash2",
        90
      )
    ).to.be.revertedWithCustomError(genomeNFT, "OwnableUnauthorizedAccount");
  });

  it("Should increment tokenId for each mint", async function () {
    await genomeNFT.mint(addr1.address, "ipfs://uri1", "GENE1", "Test 1", "QmHash1", 75);
    await genomeNFT.mint(addr1.address, "ipfs://uri2", "GENE2", "Test 2", "QmHash2", 85);
    
    expect(await genomeNFT.ownerOf(1)).to.equal(addr1.address);
    expect(await genomeNFT.tokenURI(1)).to.equal("ipfs://uri2");
    expect(await genomeNFT.nextTokenId()).to.equal(2);
  });
});