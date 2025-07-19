const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GenomeNFT", function () {
  let GenomeNFT, genomeNFT, owner, addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    GenomeNFT = await ethers.getContractFactory("GenomeNFT");
    genomeNFT = await GenomeNFT.deploy();
  });

  it("Should mint an NFT and set token URI", async function () {
    const tx = await genomeNFT.mint(addr1.address, "ipfs://testuri");
    await tx.wait();

    expect(await genomeNFT.ownerOf(0)).to.equal(addr1.address);
    expect(await genomeNFT.tokenURI(0)).to.equal("ipfs://testuri");
  });

  it("Should only allow owner to mint", async function () {
    await expect(
      genomeNFT.connect(addr1).mint(addr1.address, "ipfs://testuri2")
    ).to.be.revertedWithCustomError(genomeNFT, "OwnableUnauthorizedAccount");
  });

  it("Should increment tokenId for each mint", async function () {
    await genomeNFT.mint(addr1.address, "ipfs://uri1");
    await genomeNFT.mint(addr1.address, "ipfs://uri2");
    expect(await genomeNFT.ownerOf(1)).to.equal(addr1.address);
    expect(await genomeNFT.tokenURI(1)).to.equal("ipfs://uri2");
    expect(await genomeNFT.nextTokenId()).to.equal(2);
  });
});