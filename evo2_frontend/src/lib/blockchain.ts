import { createPublicClient, createWalletClient, custom, http, parseAbi } from 'viem';
import { bscTestnet } from 'viem/chains';
import { env } from '~/env';

// Create public client for reading blockchain data
export const publicClient = createPublicClient({
  chain: bscTestnet,
  transport: http()
});

// Create wallet client for writing to blockchain
export const createWalletClientFromWindow = () => {
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    return createWalletClient({
      chain: bscTestnet,
      transport: custom((window as any).ethereum)
    });
  }
  return null;
};

// Contract addresses from environment
export const CONTRACTS = {
  GENOME_NFT: env.NEXT_PUBLIC_GENOME_NFT_ADDRESS,
  GENOME_TOKEN: env.NEXT_PUBLIC_GENOME_TOKEN_ADDRESS,
  MARKETPLACE: env.NEXT_PUBLIC_MARKETPLACE_ADDRESS,
  DAO: env.NEXT_PUBLIC_DAO_ADDRESS,
} as const;

// Basic ABIs for contract interactions
export const GENOME_NFT_ABI = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function mint(address to, string uri) returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
]);

export const GENOME_TOKEN_ABI = parseAbi([
  'function balanceOf(address account) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 value)'
]);

export const MARKETPLACE_ABI = parseAbi([
  'function listData(uint256 tokenId, uint256 priceInBNB, uint256 priceInGenomeToken, uint256 accessDuration, string accessLevel)',
  'function purchaseWithBNB(uint256 listingId) payable',
  'function purchaseWithGenomeToken(uint256 listingId)',
  'function cancelListing(uint256 listingId)',
  'function hasAccess(address user, uint256 tokenId) view returns (bool, string, uint256)',
  'function getUserListings(address user) view returns (uint256[])',
  'function getActiveListing(uint256 tokenId) view returns (bool)',
  'function listings(uint256 listingId) view returns (address seller, uint256 tokenId, uint256 price, uint256 genomeTokenPrice, bool active, uint256 duration, string accessLevel, uint256 createdAt)',
  'function listingCounter() view returns (uint256)',
  'event DataListed(uint256 indexed listingId, address indexed seller, uint256 indexed tokenId, uint256 price, uint256 genomeTokenPrice, string accessLevel)',
  'event DataSold(uint256 indexed listingId, address indexed buyer, address indexed seller, uint256 tokenId, uint256 price, bool paidWithGenomeToken)'
]);

export const DAO_ABI = parseAbi([
  'function propose(string title, string description, string ipfsHash, uint256 fundingAmount, uint256 genomeTokenAmount, uint8 proposalType) returns (uint256)',
  'function vote(uint256 proposalId, uint8 choice, string reason)',
  'function executeProposal(uint256 proposalId)',
  'function cancelProposal(uint256 proposalId)',
  'function proposalCounter() view returns (uint256)',
  'function proposals(uint256 proposalId) view returns (uint256 id, address proposer, string title, string description, string ipfsHash, uint256 fundingAmount, uint256 genomeTokenAmount, uint256 votingStart, uint256 votingEnd, uint256 executionTime, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, bool executed, bool canceled, uint8 proposalType)',
  'function proposalVotes(uint256 proposalId, address voter) view returns (address voter, uint8 choice, uint256 weight, string reason)',
  'function getUserProposals(address user) view returns (uint256[])',
  'function getVotingPower(address account) view returns (uint256)',
  'event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string title, uint256 fundingAmount, uint256 votingStart, uint256 votingEnd)',
  'event VoteCast(uint256 indexed proposalId, address indexed voter, uint8 choice, uint256 weight, string reason)'
]);

// Helper functions for contract interactions
export const getUserNFTBalance = async (address: string): Promise<number> => {
  if (!CONTRACTS.GENOME_NFT) return 0;
  
  try {
    const balance = await publicClient.readContract({
      address: CONTRACTS.GENOME_NFT as `0x${string}`,
      abi: GENOME_NFT_ABI,
      functionName: 'balanceOf',
      args: [address as `0x${string}`]
    });
    return Number(balance);
  } catch (error) {
    console.error('Error getting NFT balance:', error);
    return 0;
  }
};

export const getUserTokenBalance = async (address: string): Promise<number> => {
  if (!CONTRACTS.GENOME_TOKEN) return 0;
  
  try {
    const balance = await publicClient.readContract({
      address: CONTRACTS.GENOME_TOKEN as `0x${string}`,
      abi: GENOME_TOKEN_ABI,
      functionName: 'balanceOf',
      args: [address as `0x${string}`]
    });
    // Convert from wei to tokens (assuming 18 decimals)
    return Number(balance) / Math.pow(10, 18);
  } catch (error) {
    console.error('Error getting token balance:', error);
    return 0;
  }
};

export const getVotingPower = async (address: string): Promise<number> => {
  // DAO voting power is based on GENOME token balance
  if (!CONTRACTS.GENOME_TOKEN) return 0;
  
  try {
    const balance = await publicClient.readContract({
      address: CONTRACTS.GENOME_TOKEN as `0x${string}`,
      abi: GENOME_TOKEN_ABI,
      functionName: 'balanceOf',
      args: [address as `0x${string}`]
    });
    // Convert from wei to tokens (assuming 18 decimals)
    return Number(balance) / Math.pow(10, 18);
  } catch (error) {
    console.error('Error getting voting power (token balance):', error);
    return 0;
  }
};

export const getTotalNFTSupply = async (): Promise<number> => {
  if (!CONTRACTS.GENOME_NFT) return 0;
  
  try {
    const supply = await publicClient.readContract({
      address: CONTRACTS.GENOME_NFT as `0x${string}`,
      abi: GENOME_NFT_ABI,
      functionName: 'totalSupply'
    });
    return Number(supply);
  } catch (error) {
    console.error('Error getting total NFT supply:', error);
    return 0;
  }
};

// Mint NFT function
export const mintGenomeNFT = async (
  walletClient: any,
  account: string,
  metadataUri: string
): Promise<string | null> => {
  if (!CONTRACTS.GENOME_NFT) return null;
  
  try {
    const hash = await walletClient.writeContract({
      address: CONTRACTS.GENOME_NFT as `0x${string}`,
      abi: GENOME_NFT_ABI,
      functionName: 'mint',
      args: [account as `0x${string}`, metadataUri],
      account: account as `0x${string}`
    });
    return hash;
  } catch (error) {
    console.error('Error minting NFT:', error);
    return null;
  }
};

// Marketplace functions
export const listNFTForSale = async (
  walletClient: any,
  account: string,
  tokenId: number,
  priceInBNB: number,
  priceInGenomeToken: number = 0,
  accessDuration: number = 7 * 24 * 60 * 60, // 7 days default
  accessLevel: string = "read"
): Promise<string | null> => {
  if (!CONTRACTS.MARKETPLACE) return null;
  
  try {
    // Convert BNB to wei
    const priceInWei = BigInt(Math.floor(priceInBNB * Math.pow(10, 18)));
    const tokenPriceInWei = BigInt(Math.floor(priceInGenomeToken * Math.pow(10, 18)));
    
    const hash = await walletClient.writeContract({
      address: CONTRACTS.MARKETPLACE as `0x${string}`,
      abi: MARKETPLACE_ABI,
      functionName: 'listData',
      args: [BigInt(tokenId), priceInWei, tokenPriceInWei, BigInt(accessDuration), accessLevel],
      account: account as `0x${string}`
    });
    return hash;
  } catch (error) {
    console.error('Error listing NFT:', error);
    return null;
  }
};

export const buyNFT = async (
  walletClient: any,
  account: string,
  listingId: number,
  priceInBNB: number
): Promise<string | null> => {
  if (!CONTRACTS.MARKETPLACE) return null;
  
  try {
    // Convert BNB to wei
    const priceInWei = BigInt(Math.floor(priceInBNB * Math.pow(10, 18)));
    
    const hash = await walletClient.writeContract({
      address: CONTRACTS.MARKETPLACE as `0x${string}`,
      abi: MARKETPLACE_ABI,
      functionName: 'purchaseWithBNB',
      args: [BigInt(listingId)],
      value: priceInWei,
      account: account as `0x${string}`
    });
    return hash;
  } catch (error) {
    console.error('Error buying NFT:', error);
    return null;
  }
};

export const getNFTListingPrice = async (tokenId: number): Promise<number> => {
  if (!CONTRACTS.MARKETPLACE) return 0;
  
  try {
    // Get the listing by checking if it's active and getting price from listings mapping
    const listingCount = await publicClient.readContract({
      address: CONTRACTS.MARKETPLACE as `0x${string}`,
      abi: MARKETPLACE_ABI,
      functionName: 'listingCounter'
    });
    
    // Search through listings for this tokenId
    // This is a simplified approach - in production you'd want events or a better query method
    for (let i = 0; i < Number(listingCount); i++) {
      try {
        const listing = await publicClient.readContract({
          address: CONTRACTS.MARKETPLACE as `0x${string}`,
          abi: MARKETPLACE_ABI,
          functionName: 'listings',
          args: [BigInt(i)]
        });
        
        // listing is a tuple: [seller, tokenId, price, genomeTokenPrice, active, duration, accessLevel, createdAt]
        if (listing && Array.isArray(listing) && listing[1] === BigInt(tokenId) && listing[4] === true) {
          return Number(listing[2]) / Math.pow(10, 18); // Convert from wei to BNB
        }
      } catch (error) {
        continue; // Skip invalid listings
      }
    }
    return 0;
  } catch (error) {
    console.error('Error getting listing price:', error);
    return 0;
  }
};

export const isNFTListed = async (tokenId: number): Promise<boolean> => {
  if (!CONTRACTS.MARKETPLACE) return false;
  
  try {
    const listingCount = await publicClient.readContract({
      address: CONTRACTS.MARKETPLACE as `0x${string}`,
      abi: MARKETPLACE_ABI,
      functionName: 'listingCounter'
    });
    
    // Search through listings for this tokenId
    for (let i = 0; i < Number(listingCount); i++) {
      try {
        const listing = await publicClient.readContract({
          address: CONTRACTS.MARKETPLACE as `0x${string}`,
          abi: MARKETPLACE_ABI,
          functionName: 'listings',
          args: [BigInt(i)]
        });
        
        // Check if this tokenId has an active listing
        if (listing && Array.isArray(listing) && listing[1] === BigInt(tokenId) && listing[4] === true) {
          return true;
        }
      } catch (error) {
        continue;
      }
    }
    return false;
  } catch (error) {
    console.error('Error checking if NFT is listed:', error);
    return false;
  }
};

// DAO functions
export const createDAOProposal = async (
  walletClient: any,
  account: string,
  title: string,
  description: string,
  ipfsHash: string = "",
  fundingAmount: number = 0,
  genomeTokenAmount: number = 0,
  proposalType: number = 0 // 0=Research, 1=Platform, 2=Parameter, 3=Emergency
): Promise<string | null> => {
  if (!CONTRACTS.DAO) return null;
  
  try {
    // Check user's GENOME token balance first
    const userBalance = await getUserTokenBalance(account);
    const requiredBalance = 10000; // 10,000 GENOME tokens required
    
    if (userBalance < requiredBalance) {
      throw new Error(`Insufficient GENOME tokens. Required: ${requiredBalance}, You have: ${userBalance}`);
    }
    
    const fundingInWei = BigInt(Math.floor(fundingAmount * Math.pow(10, 18)));
    const tokenAmountInWei = BigInt(Math.floor(genomeTokenAmount * Math.pow(10, 18)));
    
    const hash = await walletClient.writeContract({
      address: CONTRACTS.DAO as `0x${string}`,
      abi: DAO_ABI,
      functionName: 'propose',
      args: [title, description, ipfsHash, fundingInWei, tokenAmountInWei, proposalType],
      account: account as `0x${string}`,
      gas: BigInt(500000) // Set explicit gas limit
    });
    return hash;
  } catch (error) {
    console.error('Error creating proposal:', error);
    throw error; // Re-throw to show specific error message
  }
};

export const voteOnProposal = async (
  walletClient: any,
  account: string,
  proposalId: number,
  choice: number, // 0=Against, 1=For, 2=Abstain
  reason: string = ""
): Promise<string | null> => {
  if (!CONTRACTS.DAO) return null;
  
  try {
    const hash = await walletClient.writeContract({
      address: CONTRACTS.DAO as `0x${string}`,
      abi: DAO_ABI,
      functionName: 'vote',
      args: [BigInt(proposalId), choice, reason],
      account: account as `0x${string}`
    });
    return hash;
  } catch (error) {
    console.error('Error voting on proposal:', error);
    return null;
  }
};

export const getDAOProposalCount = async (): Promise<number> => {
  if (!CONTRACTS.DAO) return 0;
  
  try {
    const count = await publicClient.readContract({
      address: CONTRACTS.DAO as `0x${string}`,
      abi: DAO_ABI,
      functionName: 'proposalCounter'
    });
    return Number(count);
  } catch (error) {
    console.error('Error getting proposal count:', error);
    return 0;
  }
};

// Additional helper functions for marketplace
export const getAllMarketplaceListings = async (): Promise<any[]> => {
  if (!CONTRACTS.MARKETPLACE) return [];
  
  try {
    const count = await publicClient.readContract({
      address: CONTRACTS.MARKETPLACE as `0x${string}`,
      abi: MARKETPLACE_ABI,
      functionName: 'listingCounter'
    });
    
    const listings = [];
    for (let i = 0; i < Number(count); i++) {
      try {
        const listing = await publicClient.readContract({
          address: CONTRACTS.MARKETPLACE as `0x${string}`,
          abi: MARKETPLACE_ABI,
          functionName: 'listings',
          args: [BigInt(i)]
        });
        
        if (listing && Array.isArray(listing) && listing[4] === true) { // active listing
          listings.push({
            listingId: i,
            seller: listing[0],
            tokenId: Number(listing[1]),
            price: Number(listing[2]) / Math.pow(10, 18), // Convert from wei
            genomeTokenPrice: Number(listing[3]) / Math.pow(10, 18),
            active: listing[4],
            duration: Number(listing[5]),
            accessLevel: listing[6],
            createdAt: Number(listing[7])
          });
        }
      } catch (error) {
        console.error(`Error fetching listing ${i}:`, error);
      }
    }
    
    return listings;
  } catch (error) {
    console.error('Error getting marketplace listings:', error);
    return [];
  }
};

export const getUserMarketplaceListings = async (address: string): Promise<number[]> => {
  if (!CONTRACTS.MARKETPLACE) return [];
  
  try {
    const listings = await publicClient.readContract({
      address: CONTRACTS.MARKETPLACE as `0x${string}`,
      abi: MARKETPLACE_ABI,
      functionName: 'getUserListings',
      args: [address as `0x${string}`]
    });
    return (listings as bigint[]).map(id => Number(id));
  } catch (error) {
    console.error('Error getting user listings:', error);
    return [];
  }
};

// Additional helper functions for DAO
export const getDAOProposal = async (proposalId: number): Promise<any | null> => {
  if (!CONTRACTS.DAO) return null;
  
  try {
    const proposal = await publicClient.readContract({
      address: CONTRACTS.DAO as `0x${string}`,
      abi: DAO_ABI,
      functionName: 'proposals',
      args: [BigInt(proposalId)]
    });
    
    if (proposal && Array.isArray(proposal)) {
      return {
        id: Number(proposal[0]),
        proposer: proposal[1],
        title: proposal[2],
        description: proposal[3],
        ipfsHash: proposal[4],
        fundingAmount: Number(proposal[5]) / Math.pow(10, 18),
        genomeTokenAmount: Number(proposal[6]) / Math.pow(10, 18),
        votingStart: Number(proposal[7]),
        votingEnd: Number(proposal[8]),
        executionTime: Number(proposal[9]),
        forVotes: Number(proposal[10]),
        againstVotes: Number(proposal[11]),
        abstainVotes: Number(proposal[12]),
        executed: proposal[13],
        canceled: proposal[14],
        proposalType: Number(proposal[15])
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting DAO proposal:', error);
    return null;
  }
};

export const getAllDAOProposals = async (): Promise<any[]> => {
  if (!CONTRACTS.DAO) return [];
  
  try {
    const count = await getDAOProposalCount();
    const proposals = [];
    
    for (let i = 0; i < count; i++) {
      const proposal = await getDAOProposal(i);
      if (proposal) {
        proposals.push(proposal);
      }
    }
    
    return proposals;
  } catch (error) {
    console.error('Error getting all DAO proposals:', error);
    return [];
  }
};

export const getUserDAOVote = async (proposalId: number, address: string): Promise<any | null> => {
  if (!CONTRACTS.DAO) return null;
  
  try {
    const vote = await publicClient.readContract({
      address: CONTRACTS.DAO as `0x${string}`,
      abi: DAO_ABI,
      functionName: 'proposalVotes',
      args: [BigInt(proposalId), address as `0x${string}`]
    });
    
    if (vote && Array.isArray(vote) && vote[0] !== '0x0000000000000000000000000000000000000000') {
      return {
        voter: vote[0],
        choice: Number(vote[1]), // 0=Against, 1=For, 2=Abstain
        weight: Number(vote[2]),
        reason: vote[3]
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting user vote:', error);
    return null;
  }
};
