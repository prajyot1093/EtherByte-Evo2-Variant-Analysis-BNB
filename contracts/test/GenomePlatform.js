const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("Genome Platform Integration Tests", function () {
  let genomeToken, genomeNFT, genomeMarketplace, genomeDAO;
  let owner, researcher1, researcher2, buyer, feeRecipient;
  
  const INITIAL_SUPPLY = ethers.parseEther("1000000000"); // 1B tokens
  const RESEARCH_REWARD = ethers.parseEther("150"); // Base reward + max bonus
  const LISTING_PRICE_BNB = ethers.parseEther("0.1"); // 0.1 BNB
  const LISTING_PRICE_GENOME = ethers.parseEther("1000"); // 1000 GENOME tokens

  beforeEach(async function () {
    [owner, researcher1, researcher2, buyer, feeRecipient] = await ethers.getSigners();

    // Deploy GenomeToken
    const GenomeToken = await ethers.getContractFactory("GenomeToken");
    genomeToken = await upgrades.deployProxy(GenomeToken, [owner.address]);

    // Deploy GenomeNFT
    const GenomeNFT = await ethers.getContractFactory("GenomeNFT");
    genomeNFT = await upgrades.deployProxy(GenomeNFT, [owner.address]);

    // Deploy GenomeMarketplace
    const GenomeMarketplace = await ethers.getContractFactory("GenomeMarketplace");
    genomeMarketplace = await upgrades.deployProxy(
      GenomeMarketplace,
      [await genomeNFT.getAddress(), await genomeToken.getAddress(), feeRecipient.address, owner.address]
    );

    // Deploy GenomeDAO
    const GenomeDAO = await ethers.getContractFactory("GenomeDAO");
    genomeDAO = await upgrades.deployProxy(
      GenomeDAO,
      [await genomeToken.getAddress(), owner.address, owner.address]
    );

    // Setup connections
    await genomeNFT.setGenomeToken(await genomeToken.getAddress());
    await genomeToken.addMinter(await genomeNFT.getAddress());
    await genomeToken.addMinter(await genomeDAO.getAddress());

    // Fund users with GENOME tokens for testing (need more for quorum)
    await genomeToken.transfer(researcher1.address, ethers.parseEther("50000000")); // 50M tokens
    await genomeToken.transfer(researcher2.address, ethers.parseEther("50000000")); // 50M tokens  
    await genomeToken.transfer(buyer.address, ethers.parseEther("50000000"));       // 50M tokens
  });

  describe("Full User Journey: Upload → AI Validation → NFT → Marketplace → DAO", function () {
    it("Should complete the full genomic research lifecycle", async function () {
      // Step 1: Researcher uploads data and mints NFT
      console.log("Step 1: Minting NFT for genomic discovery...");
      
      const mintTx = await genomeNFT.mint(
        researcher1.address,
        "ipfs://QmTestURI",
        "BRCA1",
        "Important cancer gene variant discovery",
        "QmTestHash",
        95 // High quality score
      );
      await mintTx.wait();

      // Verify NFT minted
      expect(await genomeNFT.ownerOf(0)).to.equal(researcher1.address);
      expect(await genomeNFT.tokenURI(0)).to.equal("ipfs://QmTestURI");

      // Verify researcher got rewarded with GENOME tokens
      const researcherBalance = await genomeToken.balanceOf(researcher1.address);
      expect(researcherBalance).to.be.above(ethers.parseEther("100000")); // Should have initial + reward

      // Step 2: List the data on marketplace
      console.log("Step 2: Listing data on marketplace...");
      
      await genomeMarketplace.connect(researcher1).listData(
        0, // tokenId
        LISTING_PRICE_BNB,
        LISTING_PRICE_GENOME,
        30 * 24 * 60 * 60, // 30 days access
        "read"
      );

      // Verify listing created
      const listing = await genomeMarketplace.getListing(0);
      expect(listing.seller).to.equal(researcher1.address);
      expect(listing.active).to.be.true;

      // Step 3: Another researcher purchases access
      console.log("Step 3: Purchasing data access...");
      
      // First approve tokens
      await genomeToken.connect(buyer).approve(await genomeMarketplace.getAddress(), LISTING_PRICE_GENOME);
      
      await genomeMarketplace.connect(buyer).purchaseWithGenomeToken(0);

      // Verify access granted
      const [hasAccess, accessLevel, expiresAt] = await genomeMarketplace.hasAccess(buyer.address, 0);
      expect(hasAccess).to.be.true;
      expect(accessLevel).to.equal("read");

      // Step 4: Create DAO proposal for research funding
      console.log("Step 4: Creating DAO research proposal...");
      
      const proposalTx = await genomeDAO.connect(researcher2).propose(
        "BRCA2 Gene Sequencing Project",
        "Comprehensive analysis of BRCA2 variants in diverse populations",
        "QmProposalHash",
        ethers.parseEther("0.5"), // 0.5 BNB funding
        ethers.parseEther("10000"), // 10k GENOME tokens
        0 // Research proposal
      );
      await proposalTx.wait();

      // Step 5: Vote on proposal
      console.log("Step 5: Voting on DAO proposal...");
      
      // Wait for voting period to start
      await ethers.provider.send("evm_increaseTime", [2 * 24 * 60 * 60 + 1]); // 2 days + 1 second
      await ethers.provider.send("evm_mine");

      // Vote (need multiple voters for quorum)
      await genomeDAO.connect(researcher1).vote(0, 1, "Great research proposal"); // For
      await genomeDAO.connect(researcher2).vote(0, 1, "Supporting innovative research"); // For
      await genomeDAO.connect(buyer).vote(0, 1, "Beneficial for community"); // For

      // Check proposal state
      const proposalState = await genomeDAO.getProposalState(0);
      console.log("Proposal state:", proposalState);

      // Step 6: Execute proposal (after voting period ends)
      console.log("Step 6: Executing approved proposal...");
      
      // Fund the DAO first
      await owner.sendTransaction({
        to: await genomeDAO.getAddress(),
        value: ethers.parseEther("1.0")
      });
      await genomeToken.transfer(await genomeDAO.getAddress(), ethers.parseEther("50000"));

      // Wait for voting period to end and execution delay
      await ethers.provider.send("evm_increaseTime", [9 * 24 * 60 * 60 + 1]); // 7 days voting + 2 days execution delay + 1 second
      await ethers.provider.send("evm_mine");

      const initialBalance = await ethers.provider.getBalance(researcher2.address);
      await genomeDAO.execute(0);

      // Verify funding was transferred
      const finalBalance = await ethers.provider.getBalance(researcher2.address);
      expect(finalBalance).to.be.above(initialBalance);

      console.log("✅ Full genomic research lifecycle completed successfully!");
    });
  });

  describe("Smart Contract Security Tests", function () {
    it("Should prevent unauthorized minting", async function () {
      await expect(
        genomeNFT.connect(researcher1).mint(
          researcher1.address,
          "ipfs://malicious",
          "FAKE",
          "Unauthorized mint",
          "QmFake",
          100
        )
      ).to.be.revertedWithCustomError(genomeNFT, "OwnableUnauthorizedAccount");
    });

    it("Should prevent double voting in DAO", async function () {
      // Create proposal
      await genomeDAO.connect(researcher1).propose(
        "Test Proposal",
        "Test Description",
        "QmTest",
        0,
        0,
        0
      );

      // Wait for voting to start
      await ethers.provider.send("evm_increaseTime", [2 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine");

      // First vote should succeed
      await genomeDAO.connect(researcher1).vote(0, 1, "First vote");

      // Second vote should fail
      await expect(
        genomeDAO.connect(researcher1).vote(0, 0, "Second vote")
      ).to.be.revertedWith("Already voted");
    });

    it("Should prevent buying own listing", async function () {
      // Mint NFT
      await genomeNFT.mint(researcher1.address, "ipfs://test", "TEST", "Test", "QmTest", 80);

      // List data
      await genomeMarketplace.connect(researcher1).listData(0, LISTING_PRICE_BNB, 0, 86400, "read");

      // Try to buy own listing
      await expect(
        genomeMarketplace.connect(researcher1).purchaseWithBNB(0, { value: LISTING_PRICE_BNB })
      ).to.be.revertedWith("Cannot buy your own listing");
    });
  });

  describe("Token Economics Tests", function () {
    it("Should distribute rewards correctly for high-quality submissions", async function () {
      const initialBalance = await genomeToken.balanceOf(researcher1.address);

      // Mint NFT with perfect quality score
      await genomeNFT.mint(researcher1.address, "ipfs://perfect", "PERFECT", "Perfect data", "QmPerfect", 100);

      const finalBalance = await genomeToken.balanceOf(researcher1.address);
      const reward = finalBalance - initialBalance;

      // Should get base reward (100) + full quality bonus (50) = 150 tokens
      expect(reward).to.equal(ethers.parseEther("150"));
    });

    it("Should handle marketplace fees correctly", async function () {
      // Mint and list NFT
      await genomeNFT.mint(researcher1.address, "ipfs://test", "TEST", "Test", "QmTest", 80);
      await genomeMarketplace.connect(researcher1).listData(0, LISTING_PRICE_BNB, 0, 86400, "read");

      const initialSellerBalance = await ethers.provider.getBalance(researcher1.address);
      const initialFeeRecipientBalance = await ethers.provider.getBalance(feeRecipient.address);

      // Purchase with BNB
      await genomeMarketplace.connect(buyer).purchaseWithBNB(0, { value: LISTING_PRICE_BNB });

      const finalSellerBalance = await ethers.provider.getBalance(researcher1.address);
      const finalFeeRecipientBalance = await ethers.provider.getBalance(feeRecipient.address);

      // Calculate expected amounts (2.5% platform fee)
      const platformFee = (LISTING_PRICE_BNB * 250n) / 10000n;
      const sellerAmount = LISTING_PRICE_BNB - platformFee;

      expect(finalSellerBalance - initialSellerBalance).to.equal(sellerAmount);
      expect(finalFeeRecipientBalance - initialFeeRecipientBalance).to.equal(platformFee);
    });
  });
});
