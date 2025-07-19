"""
Blockchain Integration Module
Connects the AI API with deployed BNB Chain smart contracts
"""
import os
import json
import logging
from typing import Dict, Any, Optional
from decimal import Decimal

from web3 import Web3
from web3.middleware import geth_poa_middleware
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

class BlockchainIntegration:
    def __init__(self, private_key: str = None):
        """Initialize blockchain connection"""
        self.w3 = Web3(Web3.HTTPProvider(BNB_TESTNET_RPC))
        
        # Add PoA middleware for BNB Chain
        self.w3.middleware_onion.inject(geth_poa_middleware, layer=0)
        
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
            
            # Send transaction
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            
            logger.info(f"NFT minting transaction sent: {tx_hash.hex()}")
            
            # Wait for confirmation (optional - can be done in background)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            
            if receipt.status == 1:
                logger.info(f"NFT minted successfully! Gas used: {receipt.gasUsed}")
                
                # Extract token ID from logs if needed
                token_id = None
                # You would parse the logs here to get the token ID
                
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
            gene_name=analysis_result["analysis_metadata"].get("gene_name", "Unknown"),
            description=analysis_result["analysis_metadata"].get("description", ""),
            ipfs_hash=ipfs_uri.replace("ipfs://", ""),
            quality_score=int(analysis_result["quality_score"]["overall_score"])
        )
        
        return {
            "minting_successful": mint_result["success"],
            "transaction_hash": mint_result.get("transaction_hash"),
            "token_id": mint_result.get("token_id"),
            "ipfs_uri": ipfs_uri,
            "metadata": metadata
        }
        
    except Exception as e:
        logger.error(f"Blockchain NFT minting failed: {e}")
        return {
            "minting_successful": False,
            "error": str(e)
        }
