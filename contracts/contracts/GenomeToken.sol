// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

/**
 * @title GENOME Token (BEP-20/ERC20)
 * @dev Upgradeable, pausable, ownable utility token for the Evo2 platform.
 */
contract GenomeToken is Initializable, ERC20Upgradeable, OwnableUpgradeable, PausableUpgradeable, UUPSUpgradeable {
    // Initial supply: 1 billion tokens (18 decimals)
    uint256 public constant INITIAL_SUPPLY = 1_000_000_000 * 1e18;
    
    // Maximum supply cap to prevent inflation
    uint256 public constant MAX_SUPPLY = 10_000_000_000 * 1e18;
    
    // Authorized minters (GenomeNFT contract, DAO, etc.)
    mapping(address => bool) public authorizedMinters;
    
    // Events
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    event TokensMinted(address indexed to, uint256 amount, string reason);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address owner_) public initializer {
        __ERC20_init("GENOME Token", "GENOME");
        __Ownable_init(owner_);
        __Pausable_init();
        __UUPSUpgradeable_init();
        _mint(owner_, INITIAL_SUPPLY);
        transferOwnership(owner_);
        
        // Owner is initially an authorized minter
        authorizedMinters[owner_] = true;
    }

    // Add authorized minter (for GenomeNFT contract, DAO, etc.)
    function addMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = true;
        emit MinterAdded(minter);
    }
    
    // Remove authorized minter
    function removeMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = false;
        emit MinterRemoved(minter);
    }
    
    // Mint tokens for rewards (only authorized minters)
    function mint(address to, uint256 amount) external whenNotPaused {
        require(authorizedMinters[msg.sender], "Not authorized to mint");
        require(totalSupply() + amount <= MAX_SUPPLY, "Would exceed max supply");
        _mint(to, amount);
        emit TokensMinted(to, amount, "Reward");
    }
    
    // Mint tokens with reason (for transparency)
    function mintWithReason(address to, uint256 amount, string calldata reason) external whenNotPaused {
        require(authorizedMinters[msg.sender], "Not authorized to mint");
        require(totalSupply() + amount <= MAX_SUPPLY, "Would exceed max supply");
        _mint(to, amount);
        emit TokensMinted(to, amount, reason);
    }
    
    // Burn tokens (anyone can burn their own tokens)
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
    
    // Override transfer functions to respect pause
    function _update(address from, address to, uint256 value) internal override whenNotPaused {
        super._update(from, to, value);
    }

    function pause() public onlyOwner {
        _pause();
    }
    function unpause() public onlyOwner {
        _unpause();
    }


    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
