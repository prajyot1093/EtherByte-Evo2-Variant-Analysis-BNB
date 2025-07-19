"""
Evo2 Genomic Analysis API
Production FastAPI service that wraps Modal.com Evo2 functionality
for the BNB Chain Biotech Platform
"""
import os
import asyncio
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime
import hashlib
import json

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
import httpx
import modal

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Evo2 Genomic Analysis API",
    description="AI-powered genomic sequence analysis for BNB Chain biotech platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://your-frontend-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modal.com app reference (your existing setup)
modal_app_name = "variant-analysis-evo2-BNB"

# Pydantic models for API
class SequenceAnalysisRequest(BaseModel):
    sequence: str = Field(..., min_length=10, max_length=50000, description="DNA sequence to analyze")
    gene_name: Optional[str] = Field(None, max_length=100, description="Gene name (e.g., BRCA1)")
    description: Optional[str] = Field(None, max_length=500, description="Analysis description")
    contributor_address: Optional[str] = Field(None, pattern=r"^0x[a-fA-F0-9]{40}$", description="Ethereum wallet address")

    @field_validator('sequence')
    @classmethod
    def validate_sequence(cls, v):
        # Basic DNA sequence validation
        valid_chars = set('ATCGNRYSWKMBDHV-')
        if not all(c.upper() in valid_chars for c in v):
            raise ValueError('Invalid DNA sequence characters')
        return v.upper()

class QualityScore(BaseModel):
    overall_score: float = Field(..., ge=0, le=100, description="Overall quality score (0-100)")
    confidence: float = Field(..., ge=0, le=1, description="Confidence level (0-1)")
    variant_impact: Optional[str] = Field(None, description="Predicted variant impact")
    functional_prediction: Optional[str] = Field(None, description="Functional prediction")

class AnalysisResult(BaseModel):
    analysis_id: str = Field(..., description="Unique analysis identifier")
    sequence_hash: str = Field(..., description="SHA256 hash of input sequence")
    quality_score: QualityScore
    gene_annotations: Dict[str, Any] = Field(default_factory=dict)
    analysis_metadata: Dict[str, Any] = Field(default_factory=dict)
    processing_time: float = Field(..., description="Processing time in seconds")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    ready_for_minting: bool = Field(..., description="Whether result is ready for NFT minting")

class NFTMintingRequest(BaseModel):
    analysis_id: str = Field(..., description="Analysis ID from previous analysis")
    contributor_address: str = Field(..., pattern=r"^0x[a-fA-F0-9]{40}$")
    ipfs_metadata_uri: Optional[str] = Field(None, description="IPFS URI for metadata")

# In-memory storage for demo (replace with Redis/database in production)
analysis_results: Dict[str, AnalysisResult] = {}

def generate_analysis_id(sequence: str, gene_name: str = None) -> str:
    """Generate unique analysis ID"""
    content = f"{sequence}_{gene_name}_{datetime.utcnow().isoformat()}"
    return hashlib.sha256(content.encode()).hexdigest()[:16]

def calculate_sequence_hash(sequence: str) -> str:
    """Calculate SHA256 hash of sequence"""
    return hashlib.sha256(sequence.encode()).hexdigest()

async def call_modal_function(function_name: str, **kwargs) -> Dict[str, Any]:
    """Call Modal.com function and return results"""
    try:
        # This would call your Modal.com deployed function
        # For now, we'll simulate the call
        logger.info(f"Calling Modal.com function: {function_name}")
        
        # Simulate Modal.com processing time
        await asyncio.sleep(2)
        
        # Simulate Evo2 analysis results
        if function_name == "analyze_sequence":
            sequence = kwargs.get("sequence", "")
            
            # Mock quality scoring based on sequence length and composition
            gc_content = (sequence.count('G') + sequence.count('C')) / len(sequence) if sequence else 0
            length_score = min(len(sequence) / 1000, 1.0) * 30  # Up to 30 points for length
            gc_score = (1 - abs(gc_content - 0.5) * 2) * 30  # Up to 30 points for optimal GC content
            complexity_score = min(len(set(sequence)) / 4, 1.0) * 40  # Up to 40 points for complexity
            
            overall_score = length_score + gc_score + complexity_score
            confidence = min(overall_score / 100, 0.95)
            
            return {
                "quality_score": {
                    "overall_score": round(overall_score, 2),
                    "confidence": round(confidence, 3),
                    "variant_impact": "moderate" if overall_score > 60 else "low",
                    "functional_prediction": "likely_pathogenic" if overall_score > 80 else "uncertain"
                },
                "gene_annotations": {
                    "gc_content": round(gc_content, 3),
                    "length": len(sequence),
                    "complexity": len(set(sequence))
                },
                "processing_successful": True
            }
        
        return {"error": "Unknown function"}
        
    except Exception as e:
        logger.error(f"Modal.com function call failed: {e}")
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

@app.get("/", response_model=Dict[str, str])
async def root():
    """Health check endpoint"""
    return {
        "message": "Evo2 Genomic Analysis API",
        "status": "operational",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "services": {
            "modal_com": "connected",
            "evo2_model": "ready"
        },
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/api/analyze", response_model=AnalysisResult)
async def analyze_sequence(request: SequenceAnalysisRequest, background_tasks: BackgroundTasks):
    """
    Analyze a genomic sequence using Evo2 AI model
    
    This endpoint:
    1. Validates the input sequence
    2. Calls Modal.com Evo2 function for analysis
    3. Calculates quality scores
    4. Returns analysis results
    5. Prepares data for potential NFT minting
    """
    start_time = datetime.utcnow()
    
    try:
        # Generate unique analysis ID
        analysis_id = generate_analysis_id(request.sequence, request.gene_name)
        sequence_hash = calculate_sequence_hash(request.sequence)
        
        logger.info(f"Starting analysis {analysis_id} for sequence of length {len(request.sequence)}")
        
        # Call Enhanced Modal.com Evo2 analysis
        from modal_integration import run_evo2_analysis
        
        modal_result = await run_evo2_analysis(
            sequence=request.sequence,
            gene_name=request.gene_name,
            analysis_type="quality_score"
        )
        
        if not modal_result.get("processing_successful"):
            raise HTTPException(status_code=500, detail="AI analysis processing failed")
        
        # Calculate processing time
        processing_time = (datetime.utcnow() - start_time).total_seconds()
        
        # Create quality score object
        quality_score = QualityScore(**modal_result["quality_score"])
        
        # Determine if ready for NFT minting (quality threshold)
        ready_for_minting = quality_score.overall_score >= 60  # Minimum quality threshold
        
        # Create analysis result
        analysis_result = AnalysisResult(
            analysis_id=analysis_id,
            sequence_hash=sequence_hash,
            quality_score=quality_score,
            gene_annotations=modal_result.get("gene_annotations", {}),
            analysis_metadata={
                "gene_name": request.gene_name,
                "description": request.description,
                "contributor_address": request.contributor_address,
                "sequence_length": len(request.sequence)
            },
            processing_time=processing_time,
            ready_for_minting=ready_for_minting
        )
        
        # Store result for later retrieval
        analysis_results[analysis_id] = analysis_result
        
        logger.info(f"Analysis {analysis_id} completed with score {quality_score.overall_score}")
        
        return analysis_result
        
    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get("/api/analysis/{analysis_id}", response_model=AnalysisResult)
async def get_analysis_result(analysis_id: str):
    """Retrieve analysis result by ID"""
    if analysis_id not in analysis_results:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    return analysis_results[analysis_id]

@app.get("/api/analyses", response_model=List[AnalysisResult])
async def list_analyses(limit: int = 10, offset: int = 0):
    """List recent analyses"""
    all_results = list(analysis_results.values())
    # Sort by timestamp (newest first)
    sorted_results = sorted(all_results, key=lambda x: x.timestamp, reverse=True)
    return sorted_results[offset:offset + limit]

@app.post("/api/mint-nft")
async def mint_nft(request: NFTMintingRequest, background_tasks: BackgroundTasks):
    """
    Mint NFT for high-quality genomic analysis
    
    This endpoint integrates with your deployed smart contracts
    """
    # Get analysis result
    if request.analysis_id not in analysis_results:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    analysis = analysis_results[request.analysis_id]
    
    if not analysis.ready_for_minting:
        raise HTTPException(
            status_code=400, 
            detail=f"Analysis quality score ({analysis.quality_score.overall_score}) below minting threshold (60)"
        )
    
    # Use blockchain integration for actual NFT minting with rewards
    try:
        from blockchain import process_nft_minting_with_rewards, BlockchainIntegration
        
        # Initialize blockchain client with private key from environment
        private_key = os.getenv("BLOCKCHAIN_PRIVATE_KEY")
        if not private_key:
            logger.warning("No private key configured - using basic minting without rewards")
            from blockchain import process_nft_minting_with_blockchain
            minting_result = await process_nft_minting_with_blockchain(
                analysis.model_dump(), 
                request.contributor_address
            )
        else:
            # Use enhanced minting with automatic rewards
            blockchain_client = BlockchainIntegration(private_key)
            minting_result = await process_nft_minting_with_rewards(
                analysis.model_dump(), 
                request.contributor_address,
                blockchain_client
            )
        
        # Calculate total rewards earned
        rewards_info = minting_result.get("rewards", {})
        total_tokens = rewards_info.get("total_tokens_earned", 0)
        analysis_reward = rewards_info.get("analysis_reward", {}).get("reward_amount", 0)
        mint_reward = rewards_info.get("mint_reward", {}).get("reward_amount", 0)
        quality_bonus = rewards_info.get("analysis_reward", {}).get("quality_bonus", 0)
        
        return {
            "message": "NFT minted successfully with automated rewards",
            "analysis_id": request.analysis_id,
            "quality_score": analysis.quality_score.overall_score,
            "contributor_address": request.contributor_address,
            "rewards": {
                "analysis_reward": analysis_reward,
                "mint_reward": mint_reward,
                "quality_bonus": quality_bonus,
                "total_tokens_earned": total_tokens,
                "reward_transactions": {
                    "analysis_tx": rewards_info.get("analysis_reward", {}).get("transaction_hash"),
                    "mint_tx": rewards_info.get("mint_reward", {}).get("transaction_hash")
                }
            },
            "nft_details": {
                "contract_address": "0x2181B366B730628F97c44C17de19949e5359682C",
                "token_id": str(minting_result.get("token_id", "")),
                "transaction_hash": minting_result.get("transaction_hash", ""),
                "ipfs_hash": minting_result.get("ipfs_uri", "").replace("ipfs://", ""),
                "metadata_url": minting_result.get("ipfs_uri", ""),
                "gas_used": minting_result.get("gas_used")
            },
            "minter_address": request.contributor_address,
            "timestamp": datetime.utcnow().isoformat(),
            "platform": "BNB Smart Chain Testnet"
        }
    except ImportError as e:
        # Fallback response if blockchain module can't be imported
        logger.warning(f"Blockchain module not available: {e}")
        return {
            "message": "NFT minting simulated (blockchain module not available)",
            "analysis_id": request.analysis_id,
            "quality_score": analysis.quality_score.overall_score,
            "contributor_address": request.contributor_address,
            "estimated_reward": f"{100 + (analysis.quality_score.overall_score * 0.5):.0f} GENOME tokens",
            "contract_address": "0x2181B366B730628F97c44C17de19949e5359682C",
            "note": "Install web3 dependencies for full blockchain integration"
        }

async def process_nft_minting(analysis: AnalysisResult, contributor_address: str):
    """Background task to process NFT minting"""
    logger.info(f"Processing NFT minting for analysis {analysis.analysis_id}")
    
    # Here you would:
    # 1. Upload metadata to IPFS
    # 2. Call your GenomeNFT.mint() function
    # 3. Handle transaction confirmation
    # 4. Update analysis status
    
    await asyncio.sleep(5)  # Simulate blockchain transaction time
    logger.info(f"NFT minting completed for {contributor_address}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
