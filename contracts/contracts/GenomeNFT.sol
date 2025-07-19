// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;


import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title GenomeNFT
 * @dev BEP-721 NFT contract for representing genomic discoveries as unique tokens.
 * Each NFT stores a tokenURI (IPFS metadata) with gene info, quality score, etc.
 */

contract GenomeNFT is Initializable, ERC721URIStorageUpgradeable, OwnableUpgradeable, PausableUpgradeable, UUPSUpgradeable {
    uint256 public nextTokenId;

    // Metadata struct for on-chain reference (optional, most data in tokenURI/IPFS)
    struct GenomicMetadata {
        string geneName;
        string description;
        string ipfsHash;
        uint256 qualityScore;
        address contributor;
        uint256 timestamp;
    }
    mapping(uint256 => GenomicMetadata) public genomicMetadata;

    // Address of $GENOME token contract (settable by owner/DAO)
    address public genomeToken;

    event NFTMinted(address indexed to, uint256 indexed tokenId, string ipfsHash, uint256 qualityScore, address contributor);
    event MetadataUpdated(uint256 indexed tokenId, string ipfsHash, uint256 qualityScore);
    event GenomeTokenSet(address indexed genomeToken);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address owner_) public initializer {
        __ERC721_init("GenomeNFT", "GENOME");
        __ERC721URIStorage_init();
        __Ownable_init(owner_);
        __Pausable_init();
        __UUPSUpgradeable_init();
        nextTokenId = 0;
        transferOwnership(owner_);
    }

    // Set $GENOME token contract address (owner/DAO only)
    function setGenomeToken(address _genomeToken) external onlyOwner {
        genomeToken = _genomeToken;
        emit GenomeTokenSet(_genomeToken);
    }

    // Mint NFT after AI validation (can add more access control as needed)
    function mint(
        address to,
        string memory tokenURI_,
        string memory geneName,
        string memory description,
        string memory ipfsHash,
        uint256 qualityScore
    ) public whenNotPaused onlyOwner returns (uint256) {
        uint256 tokenId = nextTokenId;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI_);
        genomicMetadata[tokenId] = GenomicMetadata({
            geneName: geneName,
            description: description,
            ipfsHash: ipfsHash,
            qualityScore: qualityScore,
            contributor: to,
            timestamp: block.timestamp
        });
        emit NFTMinted(to, tokenId, ipfsHash, qualityScore, to);
        nextTokenId++;

        // Reward logic: call $GENOME token contract to reward contributor (to be implemented)
        // if (genomeToken != address(0)) { ... }

        return tokenId;
    }

    // Update metadata (owner/DAO only, e.g., after re-validation)
    function updateMetadata(
        uint256 tokenId,
        string memory ipfsHash,
        uint256 qualityScore
    ) public onlyOwner {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        genomicMetadata[tokenId].ipfsHash = ipfsHash;
        genomicMetadata[tokenId].qualityScore = qualityScore;
        emit MetadataUpdated(tokenId, ipfsHash, qualityScore);
    }

    // Pause/unpause contract (emergency stop)
    function pause() public onlyOwner {
        _pause();
    }
    function unpause() public onlyOwner {
        _unpause();
    }

    // UUPS upgrade authorization
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // Override _beforeTokenTransfer to respect pause

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721URIStorageUpgradeable)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721URIStorageUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
