// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GenomeNFT
 * @dev BEP-721 NFT contract for representing genomic discoveries as unique tokens.
 * Each NFT stores a tokenURI (IPFS metadata) with gene info, quality score, etc.
 */
contract GenomeNFT is ERC721URIStorage, Ownable {
    uint256 public nextTokenId;

    constructor() ERC721("GenomeNFT", "GENOME") Ownable(msg.sender) {}

    /**
     * @dev Mint a new NFT to `to` with metadata URI `tokenURI` (should point to IPFS JSON).
     * Only the contract owner can mint.
     */
    function mint(address to, string memory tokenURI) public onlyOwner returns (uint256) {
        uint256 tokenId = nextTokenId;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        nextTokenId++;
        return tokenId;
    }
}
