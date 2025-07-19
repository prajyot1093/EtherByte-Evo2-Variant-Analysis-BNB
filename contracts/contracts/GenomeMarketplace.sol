// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title GenomeMarketplace
 * @dev Decentralized marketplace for trading genomic data access rights via NFTs
 */
contract GenomeMarketplace is 
    Initializable, 
    OwnableUpgradeable, 
    PausableUpgradeable, 
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable 
{
    struct Listing {
        address seller;
        uint256 tokenId;
        uint256 price; // Price in BNB (wei)
        uint256 genomeTokenPrice; // Alternative price in GENOME tokens
        bool active;
        uint256 duration; // Access duration in seconds
        string accessLevel; // "read", "download", "analyze"
        uint256 createdAt;
    }

    struct AccessGrant {
        address grantee;
        uint256 tokenId;
        uint256 expiresAt;
        string accessLevel;
        bool active;
    }

    // State variables
    IERC721 public genomeNFT;
    IERC20 public genomeToken;
    
    mapping(uint256 => Listing) public listings;
    mapping(bytes32 => AccessGrant) public accessGrants; // keccak256(grantee, tokenId) => AccessGrant
    mapping(address => uint256[]) public userListings;
    mapping(address => bytes32[]) public userAccess;
    
    uint256 public platformFeePercentage; // Will be set in initializer
    address public feeRecipient;
    uint256 public listingCounter;

    // Events
    event DataListed(
        uint256 indexed listingId,
        address indexed seller,
        uint256 indexed tokenId,
        uint256 price,
        uint256 genomeTokenPrice,
        string accessLevel
    );
    
    event DataSold(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed seller,
        uint256 tokenId,
        uint256 price,
        bool paidWithGenomeToken
    );
    
    event AccessGranted(
        address indexed grantee,
        uint256 indexed tokenId,
        uint256 expiresAt,
        string accessLevel
    );
    
    event ListingCancelled(uint256 indexed listingId, address indexed seller);
    
    event AccessRevoked(address indexed grantee, uint256 indexed tokenId);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _genomeNFT,
        address _genomeToken,
        address _feeRecipient,
        address _owner
    ) public initializer {
        __Ownable_init(_owner);
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        
        genomeNFT = IERC721(_genomeNFT);
        genomeToken = IERC20(_genomeToken);
        feeRecipient = _feeRecipient;
        platformFeePercentage = 250; // 2.5% in basis points
        transferOwnership(_owner);
    }

    // List genomic data for sale
    function listData(
        uint256 tokenId,
        uint256 priceInBNB,
        uint256 priceInGenomeToken,
        uint256 accessDuration,
        string calldata accessLevel
    ) external whenNotPaused {
        require(genomeNFT.ownerOf(tokenId) == msg.sender, "Not the owner of this NFT");
        require(priceInBNB > 0 || priceInGenomeToken > 0, "Price must be greater than 0");
        require(accessDuration > 0, "Duration must be greater than 0");
        
        uint256 listingId = listingCounter++;
        
        listings[listingId] = Listing({
            seller: msg.sender,
            tokenId: tokenId,
            price: priceInBNB,
            genomeTokenPrice: priceInGenomeToken,
            active: true,
            duration: accessDuration,
            accessLevel: accessLevel,
            createdAt: block.timestamp
        });
        
        userListings[msg.sender].push(listingId);
        
        emit DataListed(listingId, msg.sender, tokenId, priceInBNB, priceInGenomeToken, accessLevel);
    }

    // Purchase access with BNB
    function purchaseWithBNB(uint256 listingId) external payable whenNotPaused nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(listing.price > 0, "BNB payment not accepted for this listing");
        require(msg.value >= listing.price, "Insufficient payment");
        
        // Handle payment first
        _handleBNBPayment(listing);
        
        // Execute purchase
        _executePurchase(listingId, false);
        
        // Refund excess payment
        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }
    }

    // Handle BNB payment processing
    function _handleBNBPayment(Listing storage listing) internal {
        uint256 platformFee = (listing.price * platformFeePercentage) / 10000;
        uint256 sellerAmount = listing.price - platformFee;
        
        payable(listing.seller).transfer(sellerAmount);
        payable(feeRecipient).transfer(platformFee);
    }

    // Purchase access with GENOME tokens
    function purchaseWithGenomeToken(uint256 listingId) external whenNotPaused nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(listing.genomeTokenPrice > 0, "GENOME token payment not accepted");
        
        // Handle token payment
        _handleTokenPayment(listing);
        
        // Execute purchase
        _executePurchase(listingId, true);
    }

    // Handle GENOME token payment processing
    function _handleTokenPayment(Listing storage listing) internal {
        uint256 platformFee = (listing.genomeTokenPrice * platformFeePercentage) / 10000;
        uint256 sellerAmount = listing.genomeTokenPrice - platformFee;
        
        // Transfer tokens
        require(
            genomeToken.transferFrom(msg.sender, listing.seller, sellerAmount),
            "Token transfer to seller failed"
        );
        require(
            genomeToken.transferFrom(msg.sender, feeRecipient, platformFee),
            "Token transfer for fee failed"
        );
    }

    // Internal function to execute purchase logic
    function _executePurchase(uint256 listingId, bool paidWithGenomeToken) internal {
        Listing storage listing = listings[listingId];
        require(listing.seller != msg.sender, "Cannot buy your own listing");
        
        // Grant access
        bytes32 accessKey = keccak256(abi.encodePacked(msg.sender, listing.tokenId));
        accessGrants[accessKey] = AccessGrant({
            grantee: msg.sender,
            tokenId: listing.tokenId,
            expiresAt: block.timestamp + listing.duration,
            accessLevel: listing.accessLevel,
            active: true
        });
        
        userAccess[msg.sender].push(accessKey);
        
        // Deactivate listing (one-time purchase model)
        listing.active = false;
        
        emit DataSold(
            listingId, 
            msg.sender, 
            listing.seller, 
            listing.tokenId, 
            paidWithGenomeToken ? listing.genomeTokenPrice : listing.price,
            paidWithGenomeToken
        );
        
        emit AccessGranted(msg.sender, listing.tokenId, accessGrants[accessKey].expiresAt, listing.accessLevel);
    }

    // Cancel listing
    function cancelListing(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender, "Not your listing");
        require(listing.active, "Listing not active");
        
        listing.active = false;
        emit ListingCancelled(listingId, msg.sender);
    }

    // Check if user has valid access to data
    function hasAccess(address user, uint256 tokenId) external view returns (bool, string memory, uint256) {
        bytes32 accessKey = keccak256(abi.encodePacked(user, tokenId));
        AccessGrant storage grant = accessGrants[accessKey];
        
        if (!grant.active || block.timestamp > grant.expiresAt) {
            return (false, "", 0);
        }
        
        return (true, grant.accessLevel, grant.expiresAt);
    }

    // Get user's active listings
    function getUserListings(address user) external view returns (uint256[] memory) {
        return userListings[user];
    }

    // Get user's access grants
    function getUserAccess(address user) external view returns (bytes32[] memory) {
        return userAccess[user];
    }

    // Admin functions
    function setPlatformFee(uint256 _feePercentage) external onlyOwner {
        require(_feePercentage <= 1000, "Fee too high"); // Max 10%
        platformFeePercentage = _feePercentage;
    }

    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        feeRecipient = _feeRecipient;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // Emergency function to revoke access (in case of disputes)
    function revokeAccess(address user, uint256 tokenId) external onlyOwner {
        bytes32 accessKey = keccak256(abi.encodePacked(user, tokenId));
        accessGrants[accessKey].active = false;
        emit AccessRevoked(user, tokenId);
    }

    // Get listing details
    function getListing(uint256 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }
}
