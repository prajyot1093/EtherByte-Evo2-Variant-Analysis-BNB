"""
Blockchain Integration Module
Connects the AI API with deployed BNB Chain smart contracts
"""
import os
import json
import logging
from typing import Dict, Any, Optional, Tuple
from decimal import Decimal
from datetime import datetime

from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware
import httpx

logger = logging.getLogger(__name__)

# Contract addresses from your deployment
CONTRACT_ADDRESSES = {
    "genomeToken": "0x0C5f98e281cB3562a2EEDF3EE63D3b623De98b15",
    "genomeNFT": "0x2181B366B730628F97c44C17de19949e5359682C",
    "genomeMarketplace": "0xd80bE0DDCA595fFf35bF44A7d2D4E312b05A1576",
    "genomeDAO": "0x8FEbF8eA03E8e54846a7B82f7F6146bAE17bd3f4"
}

# BNB Testnet configuration
BNB_TESTNET_RPC = "https://data-seed-prebsc-1-s1.binance.org:8545"
CHAIN_ID = 97

# Reward amounts (in tokens with 18 decimals)
REWARD_AMOUNTS = {
    "analysis": 10,      # 10 GENOME tokens for sequence analysis
    "nft_mint": 5,       # 5 GENOME tokens for NFT minting
    "marketplace_sale": 15,  # 15 GENOME tokens for marketplace sale
    "dao_vote": 2,       # 2 GENOME tokens for DAO participation
    "quality_bonus": 20,  # 20 GENOME tokens for high-quality analysis
}

class BlockchainIntegration:
    def __init__(self, private_key: str = None):
        """Initialize blockchain connection"""
        self.w3 = Web3(Web3.HTTPProvider(BNB_TESTNET_RPC))
        
        # Add PoA middleware for BNB Chain
        self.w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
        
        if private_key:
            self.account = self.w3.eth.account.from_key(private_key)
        else:
            self.account = None
            
        # Load contract ABIs (you'll need to add these)
        self.contracts = self._load_contracts()
        
        logger.info(f"Connected to BNB Chain, latest block: {self.w3.eth.block_number}")
    
    def _load_contracts(self) -> Dict[str, Any]:
        """Load contract instances with ABIs"""
        contracts = {}
        
        # You would load these from your artifacts/contracts/ directory
        # For now, we'll create minimal ABIs for the key functions we need
        
        # GenomeNFT minimal ABI for minting
        genome_nft_abi = [
            {
                "inputs": [
                    {"name": "to", "type": "address"},
                    {"name": "tokenURI_", "type": "string"},
                    {"name": "geneName", "type": "string"},
                    {"name": "description", "type": "string"},
                    {"name": "ipfsHash", "type": "string"},
                    {"name": "qualityScore", "type": "uint256"}
                ],
                "name": "mint",
                "outputs": [{"name": "", "type": "uint256"}],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "anonymous": False,
                "inputs": [
                    {"indexed": True, "name": "from", "type": "address"},
                    {"indexed": True, "name": "to", "type": "address"},
                    {"indexed": True, "name": "tokenId", "type": "uint256"}
                ],
                "name": "Transfer",
                "type": "event"
            }
        ]
        
        # GenomeToken minimal ABI
        genome_token_abi = [
            {
                "inputs": [{"name": "account", "type": "address"}],
                "name": "balanceOf",
                "outputs": [{"name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {"name": "to", "type": "address"},
                    {"name": "amount", "type": "uint256"}
                ],
                "name": "transfer",
                "outputs": [{"name": "", "type": "bool"}],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ]
        
        contracts["genomeNFT"] = self.w3.eth.contract(
            address=CONTRACT_ADDRESSES["genomeNFT"],
            abi=genome_nft_abi
        )
        
        contracts["genomeToken"] = self.w3.eth.contract(
            address=CONTRACT_ADDRESSES["genomeToken"],
            abi=genome_token_abi
        )
        
        return contracts
    
    async def mint_genomic_nft(
        self,
        contributor_address: str,
        token_uri: str,
        gene_name: str,
        description: str,
        ipfs_hash: str,
        quality_score: int
    ) -> Dict[str, Any]:
        """Mint a genomic discovery NFT"""
        
        if not self.account:
            raise ValueError("No private key configured for transactions")
        
        # Ensure no None values
        gene_name = gene_name or "Unknown Gene"
        description = description or "AI-analyzed genomic sequence"
        ipfs_hash = ipfs_hash or ""
        
        try:
            # Prepare transaction
            nft_contract = self.contracts["genomeNFT"]
            
            # Build transaction
            transaction = nft_contract.functions.mint(
                contributor_address,
                token_uri,
                gene_name,
                description,
                ipfs_hash,
                quality_score
            ).build_transaction({
                'from': self.account.address,
                'gas': 300000,
                'gasPrice': self.w3.eth.gas_price,
                'nonce': self.w3.eth.get_transaction_count(self.account.address),
                'chainId': CHAIN_ID
            })
            
            # Sign transaction
            signed_txn = self.w3.eth.account.sign_transaction(transaction, self.account.key)
            
            # Send transaction (handle different web3.py versions)
            try:
                raw_transaction = signed_txn.raw_transaction
            except AttributeError:
                raw_transaction = signed_txn.rawTransaction
            
            tx_hash = self.w3.eth.send_raw_transaction(raw_transaction)
            
            logger.info(f"NFT minting transaction sent: {tx_hash.hex()}")
            logger.info(f"Chain ID: {CHAIN_ID}")
            logger.info(f"RPC URL: {BNB_TESTNET_RPC}")
            logger.info(f"Transaction hash length: {len(tx_hash.hex())}")
            
            # Wait for confirmation (optional - can be done in background)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            
            if receipt.status == 1:
                logger.info(f"NFT minted successfully! Gas used: {receipt.gasUsed}")
                
                # Extract token ID from Transfer event logs
                token_id = None
                try:
                    # Parse the Transfer event to get token ID
                    nft_contract = self.contracts["genomeNFT"]
                    transfer_events = nft_contract.events.Transfer().process_receipt(receipt)
                    if transfer_events:
                        token_id = transfer_events[0]['args']['tokenId']
                        logger.info(f"Token ID minted: {token_id}")
                except Exception as e:
                    logger.warning(f"Could not extract token ID: {e}")
                    # Fallback: use a placeholder or transaction-based ID
                    token_id = receipt.blockNumber  # Use block number as fallback
                
                return {
                    "success": True,
                    "transaction_hash": tx_hash.hex(),
                    "token_id": token_id,
                    "gas_used": receipt.gasUsed,
                    "block_number": receipt.blockNumber
                }
            else:
                raise Exception("Transaction failed")
                
        except Exception as e:
            logger.error(f"NFT minting failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_token_balance(self, address: str) -> int:
        """Get GENOME token balance for an address"""
        try:
            balance = self.contracts["genomeToken"].functions.balanceOf(address).call()
            return balance
        except Exception as e:
            logger.error(f"Failed to get token balance: {e}")
            return 0
    
    async def upload_to_ipfs(self, metadata: Dict[str, Any]) -> str:
        """Upload metadata to IPFS (mock implementation)"""
        # In production, you would use a service like Pinata, Infura, or run your own IPFS node
        
        try:
            # Mock IPFS upload - replace with actual IPFS service
            metadata_json = json.dumps(metadata, indent=2)
            
            # For demo, we'll just return a mock hash
            # In production: upload to IPFS and return real hash
            mock_hash = f"Qm{hash(metadata_json) % 1000000000000000000:018x}"
            
            logger.info(f"Metadata uploaded to IPFS: {mock_hash}")
            return f"ipfs://{mock_hash}"
            
        except Exception as e:
            logger.error(f"IPFS upload failed: {e}")
            raise
    
    def create_nft_metadata(
        self,
        analysis_id: str,
        gene_name: str,
        description: str,
        quality_score: float,
        contributor_address: str,
        analysis_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create NFT metadata following OpenSea standards"""
        
        return {
            "name": f"Genomic Discovery: {gene_name or 'Unknown Gene'}",
            "description": description or f"High-quality genomic analysis (Score: {quality_score}/100)",
            "image": "ipfs://QmGenomeNFTImage",  # You would upload an image representing the discovery
            "attributes": [
                {
                    "trait_type": "Quality Score",
                    "value": quality_score,
                    "max_value": 100
                },
                {
                    "trait_type": "Gene Name",
                    "value": gene_name or "Unknown"
                },
                {
                    "trait_type": "Analysis ID",
                    "value": analysis_id
                },
                {
                    "trait_type": "Contributor",
                    "value": contributor_address
                },
                {
                    "trait_type": "Sequence Length",
                    "value": analysis_data.get("sequence_length", 0)
                },
                {
                    "trait_type": "Analysis Date",
                    "value": analysis_data.get("timestamp", "")
                }
            ],
            "external_url": f"https://your-platform.com/analysis/{analysis_id}",
            "analysis_data": {
                "analysis_id": analysis_id,
                "quality_metrics": analysis_data,
                "blockchain_network": "BNB Smart Chain Testnet"
            }
        }

# Global instance (you might want to make this configurable)
blockchain = None

def get_blockchain_instance() -> BlockchainIntegration:
    """Get blockchain integration instance"""
    global blockchain
    if blockchain is None:
        private_key = os.getenv("PRIVATE_KEY")
        blockchain = BlockchainIntegration(private_key)
    return blockchain

async def process_nft_minting_with_blockchain(
    analysis_result: Dict[str, Any],
    contributor_address: str
) -> Dict[str, Any]:
    """Complete NFT minting process with blockchain integration"""
    
    try:
        blockchain_client = get_blockchain_instance()
        
        # Create metadata
        metadata = blockchain_client.create_nft_metadata(
            analysis_id=analysis_result["analysis_id"],
            gene_name=analysis_result["analysis_metadata"].get("gene_name"),
            description=analysis_result["analysis_metadata"].get("description"),
            quality_score=analysis_result["quality_score"]["overall_score"],
            contributor_address=contributor_address,
            analysis_data=analysis_result["analysis_metadata"]
        )
        
        # Upload to IPFS
        ipfs_uri = await blockchain_client.upload_to_ipfs(metadata)
        
        # Mint NFT on blockchain
        mint_result = await blockchain_client.mint_genomic_nft(
            contributor_address=contributor_address,
            token_uri=ipfs_uri,
            gene_name=analysis_result["analysis_metadata"].get("gene_name") or "Unknown Gene",
            description=analysis_result["analysis_metadata"].get("description") or "AI-analyzed genomic sequence",
            ipfs_hash=ipfs_uri.replace("ipfs://", ""),
            quality_score=int(analysis_result["quality_score"]["overall_score"])
        )
        
        return {
            "minting_successful": mint_result["success"],
            "transaction_hash": mint_result.get("transaction_hash"),
            "token_id": mint_result.get("token_id"),
            "gas_used": mint_result.get("gas_used"),
            "ipfs_uri": ipfs_uri,
            "metadata": metadata
        }
        
    except Exception as e:
        logger.error(f"Blockchain NFT minting failed: {e}")
        return {
            "minting_successful": False,
            "error": str(e)
        }


# Automated Reward System Functions
class RewardSystem:
    """Automated reward distribution system for platform activities"""
    
    def __init__(self, blockchain_client: BlockchainIntegration):
        self.blockchain = blockchain_client
        
    async def distribute_analysis_reward(self, user_address: str, quality_score: float) -> Dict[str, Any]:
        """Distribute tokens for completing genomic sequence analysis"""
        try:
            base_reward = REWARD_AMOUNTS["analysis"]
            
            # Quality bonus for high-quality analysis (score > 0.8)
            quality_bonus = REWARD_AMOUNTS["quality_bonus"] if quality_score > 0.8 else 0
            total_reward = base_reward + quality_bonus
            
            # Distribute tokens
            result = await self._distribute_tokens(user_address, total_reward, "analysis_reward")
            
            logger.info(f"Analysis reward distributed: {total_reward} tokens to {user_address}")
            return {
                "success": True,
                "reward_amount": total_reward,
                "base_reward": base_reward,
                "quality_bonus": quality_bonus,
                "transaction_hash": result.get("transaction_hash")
            }
            
        except Exception as e:
            logger.error(f"Error distributing analysis reward: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def distribute_nft_mint_reward(self, user_address: str) -> Dict[str, Any]:
        """Distribute tokens for minting an NFT"""
        try:
            reward_amount = REWARD_AMOUNTS["nft_mint"]
            result = await self._distribute_tokens(user_address, reward_amount, "nft_mint_reward")
            
            logger.info(f"NFT mint reward distributed: {reward_amount} tokens to {user_address}")
            return {
                "success": True,
                "reward_amount": reward_amount,
                "transaction_hash": result.get("transaction_hash")
            }
            
        except Exception as e:
            logger.error(f"Error distributing NFT mint reward: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def distribute_dao_participation_reward(self, user_address: str) -> Dict[str, Any]:
        """Distribute tokens for DAO participation (voting)"""
        try:
            reward_amount = REWARD_AMOUNTS["dao_vote"]
            result = await self._distribute_tokens(user_address, reward_amount, "dao_participation_reward")
            
            logger.info(f"DAO participation reward distributed: {reward_amount} tokens to {user_address}")
            return {
                "success": True,
                "reward_amount": reward_amount,
                "transaction_hash": result.get("transaction_hash")
            }
            
        except Exception as e:
            logger.error(f"Error distributing DAO participation reward: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def distribute_marketplace_reward(self, seller_address: str) -> Dict[str, Any]:
        """Distribute tokens for successful marketplace sale"""
        try:
            reward_amount = REWARD_AMOUNTS["marketplace_sale"]
            result = await self._distribute_tokens(seller_address, reward_amount, "marketplace_sale_reward")
            
            logger.info(f"Marketplace sale reward distributed: {reward_amount} tokens to {seller_address}")
            return {
                "success": True,
                "reward_amount": reward_amount,
                "transaction_hash": result.get("transaction_hash")
            }
            
        except Exception as e:
            logger.error(f"Error distributing marketplace sale reward: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def _distribute_tokens(self, recipient_address: str, amount: float, reward_type: str) -> Dict[str, Any]:
        """Internal function to distribute GENOME tokens"""
        if not self.blockchain.account:
            raise ValueError("No private key configured for reward distribution")
        
        try:
            # Convert to wei (18 decimals)
            amount_wei = int(amount * 10**18)
            
            # Get token contract
            token_contract = self.blockchain.contracts["genomeToken"]
            
            # Build transaction
            transaction = token_contract.functions.transfer(
                recipient_address,
                amount_wei
            ).build_transaction({
                'from': self.blockchain.account.address,
                'gas': 100000,
                'gasPrice': self.blockchain.w3.eth.gas_price,
                'nonce': self.blockchain.w3.eth.get_transaction_count(self.blockchain.account.address),
                'chainId': CHAIN_ID
            })
            
            # Sign and send transaction
            signed_txn = self.blockchain.w3.eth.account.sign_transaction(transaction, self.blockchain.account.key)
            
            try:
                raw_transaction = signed_txn.raw_transaction
            except AttributeError:
                raw_transaction = signed_txn.rawTransaction
            
            tx_hash = self.blockchain.w3.eth.send_raw_transaction(raw_transaction)
            
            logger.info(f"Token reward transaction sent: {tx_hash.hex()}")
            
            return {
                "success": True,
                "transaction_hash": tx_hash.hex(),
                "amount": amount,
                "recipient": recipient_address,
                "reward_type": reward_type
            }
            
        except Exception as e:
            logger.error(f"Error in token distribution: {str(e)}")
            raise


# Enhanced NFT minting process with automatic rewards
async def process_nft_minting_with_rewards(
    analysis_result: Dict[str, Any],
    contributor_address: str,
    blockchain_client: BlockchainIntegration
) -> Dict[str, Any]:
    """Process NFT minting with automatic reward distribution"""
    try:
        # Initialize reward system
        reward_system = RewardSystem(blockchain_client)
        
        # First, mint the NFT (existing process)
        mint_result = await process_nft_minting_with_blockchain(
            analysis_result, contributor_address
        )
        
        if mint_result["minting_successful"]:
            # Distribute analysis reward
            analysis_reward = await reward_system.distribute_analysis_reward(
                contributor_address, 
                analysis_result["quality_score"]["overall_score"]
            )
            
            # Distribute NFT minting reward
            mint_reward = await reward_system.distribute_nft_mint_reward(contributor_address)
            
            # Add reward information to result
            mint_result["rewards"] = {
                "analysis_reward": analysis_reward,
                "mint_reward": mint_reward,
                "total_tokens_earned": (
                    analysis_reward.get("reward_amount", 0) + 
                    mint_reward.get("reward_amount", 0)
                )
            }
        
        return mint_result
        
    except Exception as e:
        logger.error(f"Error in enhanced NFT minting process: {str(e)}")
        raise


# IPFS Integration for Metadata Storage
class IPFSIntegration:
    """IPFS integration for storing NFT metadata"""
    
    def __init__(self, ipfs_gateway: str = "https://ipfs.io/ipfs/"):
        self.gateway = ipfs_gateway
        # For production, you'd use a service like Pinata, Infura IPFS, or local IPFS node
        self.pinata_api_key = os.getenv("PINATA_API_KEY")
        self.pinata_secret = os.getenv("PINATA_SECRET_API_KEY")
    
    async def upload_metadata(self, metadata: Dict[str, Any]) -> str:
        """Upload NFT metadata to IPFS and return IPFS URI"""
        try:
            if self.pinata_api_key and self.pinata_secret:
                return await self._upload_to_pinata(metadata)
            else:
                # Fallback to mock IPFS for demo
                return await self._mock_ipfs_upload(metadata)
        except Exception as e:
            logger.error(f"IPFS upload failed: {str(e)}")
            return await self._mock_ipfs_upload(metadata)
    
    async def _upload_to_pinata(self, metadata: Dict[str, Any]) -> str:
        """Upload to Pinata IPFS service"""
        url = "https://api.pinata.cloud/pinning/pinJSONToIPFS"
        headers = {
            "pinata_api_key": self.pinata_api_key,
            "pinata_secret_api_key": self.pinata_secret,
            "Content-Type": "application/json"
        }
        
        payload = {
            "pinataContent": metadata,
            "pinataMetadata": {
                "name": f"genome_nft_{metadata.get('tokenId', 'unknown')}.json"
            }
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            
            result = response.json()
            ipfs_hash = result["IpfsHash"]
            
            logger.info(f"Metadata uploaded to IPFS: {ipfs_hash}")
            return f"ipfs://{ipfs_hash}"
    
    async def _mock_ipfs_upload(self, metadata: Dict[str, Any]) -> str:
        """Mock IPFS upload for demo purposes"""
        import hashlib
        import json
        
        # Create a deterministic hash based on metadata content
        content_str = json.dumps(metadata, sort_keys=True)
        content_hash = hashlib.sha256(content_str.encode()).hexdigest()[:46]  # IPFS hash length
        
        # Create a mock IPFS hash that looks realistic
        mock_hash = f"Qm{content_hash}"
        
        logger.info(f"Mock IPFS upload: {mock_hash}")
        return f"ipfs://{mock_hash}"
    
    def get_http_url(self, ipfs_uri: str) -> str:
        """Convert IPFS URI to HTTP gateway URL"""
        if ipfs_uri.startswith("ipfs://"):
            hash_part = ipfs_uri.replace("ipfs://", "")
            return f"{self.gateway}{hash_part}"
        return ipfs_uri


# Enhanced metadata creation with better structure
async def create_enhanced_nft_metadata(
    analysis_data: Dict[str, Any],
    contributor_address: str
) -> Dict[str, Any]:
    """Create comprehensive NFT metadata following OpenSea standards"""
    
    quality_score = analysis_data.get("quality_score", {})
    gene_annotations = analysis_data.get("gene_annotations", {})
    analysis_metadata = analysis_data.get("analysis_metadata", {})
    
    # Determine rarity based on quality score
    overall_score = quality_score.get("overall_score", 0)
    if overall_score >= 90:
        rarity = "Legendary"
    elif overall_score >= 80:
        rarity = "Epic"
    elif overall_score >= 70:
        rarity = "Rare"
    elif overall_score >= 60:
        rarity = "Common"
    else:
        rarity = "Basic"
    
    # Create comprehensive metadata
    metadata = {
        "name": f"Genomic Analysis NFT - {analysis_metadata.get('gene_name', 'Unknown Gene')}",
        "description": f"AI-powered genomic sequence analysis with {overall_score:.1f}% quality score. "
                      f"Analyzed using Evo2 foundation model on BNB Smart Chain.",
        "image": f"https://api.placeholder.com/400x400?text=Genomic+Analysis+NFT",  # TODO: Generate actual image
        "external_url": f"https://your-platform.com/nft/{analysis_data.get('analysis_id')}",
        "attributes": [
            {
                "trait_type": "Gene Name",
                "value": analysis_metadata.get("gene_name", "Unknown")
            },
            {
                "trait_type": "Quality Score",
                "value": overall_score,
                "display_type": "number",
                "max_value": 100
            },
            {
                "trait_type": "Confidence",
                "value": quality_score.get("confidence", 0),
                "display_type": "boost_percentage"
            },
            {
                "trait_type": "Rarity",
                "value": rarity
            },
            {
                "trait_type": "Variant Impact",
                "value": quality_score.get("variant_impact", "unknown").title()
            },
            {
                "trait_type": "Functional Prediction", 
                "value": quality_score.get("functional_prediction", "unknown").replace("_", " ").title()
            },
            {
                "trait_type": "Sequence Length",
                "value": gene_annotations.get("length", 0),
                "display_type": "number"
            },
            {
                "trait_type": "GC Content",
                "value": round(gene_annotations.get("gc_content", 0) * 100, 1),
                "display_type": "boost_percentage"
            },
            {
                "trait_type": "Analysis Date",
                "value": datetime.now().strftime("%Y-%m-%d")
            },
            {
                "trait_type": "Platform",
                "value": "BNB Smart Chain"
            }
        ],
        "properties": {
            "analysis_id": analysis_data.get("analysis_id"),
            "contributor": contributor_address,
            "model": "Evo2",
            "platform": "BNB_Chain",
            "created_at": datetime.now().isoformat(),
            "quality_metrics": quality_score,
            "gene_data": gene_annotations
        },
        "compiler": "Evo2 AI Model v1.0",
        "background_color": "000000"
    }
    
    return metadata


# Update the existing process_nft_minting_with_blockchain to use enhanced metadata
async def process_nft_minting_with_enhanced_metadata(
    analysis_result: Dict[str, Any],
    contributor_address: str,
    blockchain_client: BlockchainIntegration
) -> Dict[str, Any]:
    """Enhanced NFT minting with comprehensive metadata and IPFS storage"""
    try:
        # Create enhanced metadata
        metadata = await create_enhanced_nft_metadata(
            analysis_result, 
            contributor_address
        )
        
        # Upload to IPFS
        ipfs_client = IPFSIntegration()
        ipfs_uri = await ipfs_client.upload_metadata(metadata)
        
        # Mint NFT on blockchain
        mint_result = await blockchain_client.mint_genomic_nft(
            contributor_address=contributor_address,
            token_uri=ipfs_uri,
            gene_name=analysis_result["analysis_metadata"].get("gene_name") or "Unknown Gene",
            description=metadata["description"],
            ipfs_hash=ipfs_uri.replace("ipfs://", ""),
            quality_score=int(analysis_result["quality_score"]["overall_score"])
        )
        
        return {
            "minting_successful": mint_result["success"],
            "transaction_hash": mint_result.get("transaction_hash"),
            "token_id": mint_result.get("token_id"),
            "gas_used": mint_result.get("gas_used"),
            "ipfs_uri": ipfs_uri,
            "metadata": metadata,
            "ipfs_gateway_url": ipfs_client.get_http_url(ipfs_uri)
        }
        
    except Exception as e:
        logger.error(f"Enhanced NFT minting failed: {e}")
        return {
            "minting_successful": False,
            "error": str(e)
        }
