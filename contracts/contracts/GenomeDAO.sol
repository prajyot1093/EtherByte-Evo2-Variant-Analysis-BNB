// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title GenomeDAO
 * @dev Decentralized autonomous organization for genomic research governance
 */
contract GenomeDAO is 
    Initializable,
    OwnableUpgradeable, 
    PausableUpgradeable, 
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable 
{
    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        string ipfsHash; // Detailed proposal data
        uint256 fundingAmount; // Amount requested in BNB
        uint256 genomeTokenAmount; // Amount requested in GENOME tokens
        uint256 votingStart;
        uint256 votingEnd;
        uint256 executionTime; // When proposal can be executed after passing
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool executed;
        bool canceled;
        ProposalType proposalType;
    }

    enum ProposalType {
        Research,      // Research funding proposal
        Platform,      // Platform development/upgrade
        Parameter,     // Change system parameters
        Emergency      // Emergency actions
    }

    enum VoteChoice {
        Against,
        For,
        Abstain
    }

    struct Vote {
        address voter;
        VoteChoice choice;
        uint256 weight;
        string reason;
    }

    // State variables
    IERC20 public genomeToken;
    
    uint256 public proposalCounter;
    uint256 public votingDelay;       // Will be set in initializer
    uint256 public votingPeriod;      // Will be set in initializer  
    uint256 public executionDelay;    // Will be set in initializer
    uint256 public proposalThreshold; // Will be set in initializer
    uint256 public quorum;            // Will be set in initializer
    
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => Vote)) public proposalVotes;
    mapping(uint256 => address[]) public proposalVoters;
    mapping(address => uint256[]) public userProposals;
    
    address public treasury;
    uint256 public treasuryBalance;

    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        uint256 fundingAmount,
        uint256 votingStart,
        uint256 votingEnd
    );
    
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        VoteChoice choice,
        uint256 weight,
        string reason
    );
    
    event ProposalExecuted(uint256 indexed proposalId, address indexed executor);
    event ProposalCanceled(uint256 indexed proposalId);
    event FundsDeposited(address indexed depositor, uint256 amount);
    event FundsWithdrawn(address indexed recipient, uint256 amount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _genomeToken,
        address _treasury,
        address _owner
    ) public initializer {
        __Ownable_init(_owner);
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        
        genomeToken = IERC20(_genomeToken);
        treasury = _treasury;
        
        // Set default governance parameters
        votingDelay = 2 days;      // Delay before voting starts
        votingPeriod = 7 days;     // Voting duration
        executionDelay = 2 days;   // Delay before execution after passing
        proposalThreshold = 10000 * 1e18; // Min GENOME tokens to propose
        quorum = 4; // 4% of total supply needed for quorum
        
        transferOwnership(_owner);
    }

    // Create a new proposal
    function propose(
        string calldata title,
        string calldata description,
        string calldata ipfsHash,
        uint256 fundingAmount,
        uint256 genomeTokenAmount,
        ProposalType proposalType
    ) external whenNotPaused returns (uint256) {
        require(
            genomeToken.balanceOf(msg.sender) >= proposalThreshold,
            "Insufficient GENOME tokens to propose"
        );
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");
        
        uint256 proposalId = proposalCounter++;
        uint256 votingStart = block.timestamp + votingDelay;
        uint256 votingEnd = votingStart + votingPeriod;
        
        proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: msg.sender,
            title: title,
            description: description,
            ipfsHash: ipfsHash,
            fundingAmount: fundingAmount,
            genomeTokenAmount: genomeTokenAmount,
            votingStart: votingStart,
            votingEnd: votingEnd,
            executionTime: votingEnd + executionDelay,
            forVotes: 0,
            againstVotes: 0,
            abstainVotes: 0,
            executed: false,
            canceled: false,
            proposalType: proposalType
        });
        
        userProposals[msg.sender].push(proposalId);
        
        emit ProposalCreated(
            proposalId,
            msg.sender,
            title,
            fundingAmount,
            votingStart,
            votingEnd
        );
        
        return proposalId;
    }

    // Cast a vote on a proposal
    function vote(
        uint256 proposalId,
        VoteChoice choice,
        string calldata reason
    ) external whenNotPaused {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id == proposalId, "Proposal does not exist");
        require(block.timestamp >= proposal.votingStart, "Voting has not started");
        require(block.timestamp <= proposal.votingEnd, "Voting has ended");
        require(!proposal.executed && !proposal.canceled, "Proposal not active");
        
        // Check if user already voted
        require(proposalVotes[proposalId][msg.sender].voter == address(0), "Already voted");
        
        uint256 votingWeight = genomeToken.balanceOf(msg.sender);
        require(votingWeight > 0, "No voting power");
        
        // Record vote
        proposalVotes[proposalId][msg.sender] = Vote({
            voter: msg.sender,
            choice: choice,
            weight: votingWeight,
            reason: reason
        });
        
        proposalVoters[proposalId].push(msg.sender);
        
        // Update vote counts
        if (choice == VoteChoice.For) {
            proposal.forVotes += votingWeight;
        } else if (choice == VoteChoice.Against) {
            proposal.againstVotes += votingWeight;
        } else {
            proposal.abstainVotes += votingWeight;
        }
        
        emit VoteCast(proposalId, msg.sender, choice, votingWeight, reason);
    }

    // Execute a passed proposal
    function execute(uint256 proposalId) external whenNotPaused nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id == proposalId, "Proposal does not exist");
        require(!proposal.executed, "Proposal already executed");
        require(!proposal.canceled, "Proposal canceled");
        require(block.timestamp >= proposal.executionTime, "Execution time not reached");
        require(_hasPassedVote(proposalId), "Proposal did not pass");
        
        proposal.executed = true;
        
        // Execute funding if requested
        if (proposal.fundingAmount > 0) {
            require(address(this).balance >= proposal.fundingAmount, "Insufficient treasury BNB");
            payable(proposal.proposer).transfer(proposal.fundingAmount);
        }
        
        if (proposal.genomeTokenAmount > 0) {
            require(
                genomeToken.balanceOf(address(this)) >= proposal.genomeTokenAmount,
                "Insufficient treasury GENOME tokens"
            );
            require(
                genomeToken.transfer(proposal.proposer, proposal.genomeTokenAmount),
                "Token transfer failed"
            );
        }
        
        emit ProposalExecuted(proposalId, msg.sender);
    }

    // Cancel a proposal (only proposer or owner)
    function cancel(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id == proposalId, "Proposal does not exist");
        require(!proposal.executed, "Proposal already executed");
        require(!proposal.canceled, "Proposal already canceled");
        require(
            msg.sender == proposal.proposer || msg.sender == owner(),
            "Not authorized to cancel"
        );
        
        proposal.canceled = true;
        emit ProposalCanceled(proposalId);
    }

    // Check if proposal has passed
    function _hasPassedVote(uint256 proposalId) internal view returns (bool) {
        Proposal storage proposal = proposals[proposalId];
        
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        uint256 totalSupply = genomeToken.totalSupply();
        
        // Check quorum
        if (totalVotes < (totalSupply * quorum) / 100) {
            return false;
        }
        
        // Check majority
        return proposal.forVotes > proposal.againstVotes;
    }

    // Get proposal state
    function getProposalState(uint256 proposalId) external view returns (string memory) {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id == proposalId, "Proposal does not exist");
        
        if (proposal.canceled) return "Canceled";
        if (proposal.executed) return "Executed";
        if (block.timestamp < proposal.votingStart) return "Pending";
        if (block.timestamp <= proposal.votingEnd) return "Active";
        if (!_hasPassedVote(proposalId)) return "Defeated";
        if (block.timestamp < proposal.executionTime) return "Succeeded";
        return "Queued";
    }

    // Get proposal details
    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        return proposals[proposalId];
    }

    // Get user's proposals
    function getUserProposals(address user) external view returns (uint256[] memory) {
        return userProposals[user];
    }

    // Get proposal voters
    function getProposalVoters(uint256 proposalId) external view returns (address[] memory) {
        return proposalVoters[proposalId];
    }

    // Get user's vote on a proposal
    function getUserVote(uint256 proposalId, address user) external view returns (Vote memory) {
        return proposalVotes[proposalId][user];
    }

    // Deposit BNB to treasury
    function depositBNB() external payable {
        treasuryBalance += msg.value;
        emit FundsDeposited(msg.sender, msg.value);
    }

    // Admin functions
    function setVotingParameters(
        uint256 _votingDelay,
        uint256 _votingPeriod,
        uint256 _executionDelay,
        uint256 _proposalThreshold,
        uint256 _quorum
    ) external onlyOwner {
        require(_quorum <= 50, "Quorum too high"); // Max 50%
        votingDelay = _votingDelay;
        votingPeriod = _votingPeriod;
        executionDelay = _executionDelay;
        proposalThreshold = _proposalThreshold;
        quorum = _quorum;
    }

    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
    }

    function emergencyWithdraw(uint256 amount, address recipient) external onlyOwner {
        require(recipient != address(0), "Invalid recipient");
        require(amount <= address(this).balance, "Insufficient balance");
        payable(recipient).transfer(amount);
        emit FundsWithdrawn(recipient, amount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // Receive BNB deposits
    receive() external payable {
        treasuryBalance += msg.value;
        emit FundsDeposited(msg.sender, msg.value);
    }
}
