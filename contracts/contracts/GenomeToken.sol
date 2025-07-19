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
    }

    function pause() public onlyOwner {
        _pause();
    }
    function unpause() public onlyOwner {
        _unpause();
    }


    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
