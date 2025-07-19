"""
Enhanced Modal.com Integration for Evo2 Analysis
Connects FastAPI with your existing Modal.com Evo2 setup
"""
import os
import logging
import asyncio
import requests
from typing import Dict, Any, Optional
import json

try:
    import modal
except ImportError:
    print("Modal not installed. Run: pip install modal")
    modal = None

logger = logging.getLogger(__name__)

# Your existing Modal app name
MODAL_APP_NAME = "variant-analysis-evo2-BNB"

# Modal.com deployed URL (if using web endpoints)
MODAL_EVO2_URL = "https://pratikrai0101--variant-analysis-evo2-bnb-evo2model-analy-620a32.modal.run/"

class ModalEvo2Client:
    """Client for interacting with Modal.com Evo2 functions"""
    
    def __init__(self):
        self.modal_available = modal is not None
        self.app = None  # Skip Modal app connection for now, use HTTP endpoint directly
        
        if self.modal_available:
            logger.info("✅ Modal package available, using HTTP endpoint for AI calls")
        else:
            logger.warning("⚠️ Modal package not available")
    
    async def analyze_sequence(
        self, 
        sequence: str, 
        gene_name: Optional[str] = None,
        analysis_type: str = "quality_score"
    ) -> Dict[str, Any]:
        """
        Analyze genomic sequence using your REAL Modal.com Evo2 setup
        """
        try:
            # Force HTTP endpoint usage for now (skip Modal app connection issues)
            logger.info(f"🌐 Calling REAL Evo2 model via HTTP endpoint for {gene_name or 'unknown gene'}")
            return await self._call_modal_http_endpoint(sequence, gene_name, analysis_type)
            
        except Exception as e:
            logger.error(f"❌ Modal analysis failed: {e}")
            logger.info("🔄 Falling back to local analysis")
            return await self._local_analysis_fallback(sequence, gene_name)
    
    async def _call_modal_app_function(self, sequence: str, gene_name: Optional[str], analysis_type: str) -> Dict[str, Any]:
        """Call your real Modal.com app function"""
        try:
            # Get the Evo2Model class from your Modal app
            evo2_model = self.app.cls.Evo2Model()
            
            # For now, use a mock position for single variant analysis
            # In production, you'd determine the position based on the sequence
            mock_position = 43119628  # BRCA1 example position
            alternative = sequence[-1] if len(sequence) > 0 else "G"  # Use last char as variant
            
            # Call your real analyze_single_variant function
            result = await evo2_model.analyze_single_variant.aio(
                variant_position=mock_position,
                alternative=alternative,
                genome="hg38",
                chromosome="chr17"
            )
            
            # Convert Modal result to our expected format
            return self._convert_modal_result_to_api_format(result, sequence, gene_name)
            
        except Exception as e:
            logger.error(f"Modal app function call failed: {e}")
            raise
    
    async def _call_modal_http_endpoint(self, sequence: str, gene_name: Optional[str], analysis_type: str) -> Dict[str, Any]:
        """Call your Modal.com HTTP endpoint"""
        try:
            # Prepare request for your NEW Modal sequence analysis endpoint
            # Modal FastAPI endpoints expect query parameters
            params = {
                "sequence": sequence,
                "gene_name": gene_name or ""
            }
            
            # Make HTTP request to the new analyze_sequence endpoint
            endpoint_url = MODAL_EVO2_URL.rstrip('/')  # The endpoint itself is the analyze_sequence function
            
            import aiohttp
            async with aiohttp.ClientSession() as session:
                async with session.post(endpoint_url, params=params, timeout=60) as response:
                    if response.status == 200:
                        modal_result = await response.json()
                        logger.info(f"✅ Successfully called REAL Evo2 AI model via Modal.com!")
                        logger.info(f"🎯 Analysis method: {modal_result.get('gene_annotations', {}).get('analysis_method', 'unknown')}")
                        return modal_result  # The new endpoint returns data in our format already
                    else:
                        error_text = await response.text()
                        logger.error(f"❌ Modal HTTP endpoint failed: {response.status} - {error_text}")
                        raise Exception(f"Modal HTTP endpoint failed: {response.status} - {error_text}")
                        
        except Exception as e:
            logger.error(f"❌ Modal HTTP endpoint call failed: {e}")
            raise
            logger.error(f"Modal HTTP endpoint call failed: {e}")
            raise
    
    def _convert_modal_result_to_api_format(self, modal_result: Dict, sequence: str, gene_name: Optional[str]) -> Dict[str, Any]:
        """Convert Modal.com result to our API format"""
        try:
            # Extract real AI predictions from Modal result
            delta_score = modal_result.get("delta_score", 0.0)
            prediction = modal_result.get("prediction", "Unknown")
            confidence = modal_result.get("classification_confidence", 0.5)
            
            # Convert prediction to our format
            if "pathogenic" in prediction.lower():
                variant_impact = "high"
                functional_prediction = "likely_pathogenic"
                # Higher delta score (more negative) = higher quality score
                overall_score = max(0, min(100, 85 + (delta_score * 1000)))
            elif "benign" in prediction.lower():
                variant_impact = "low"
                functional_prediction = "likely_benign"
                overall_score = max(0, min(100, 70 + abs(delta_score * 1000)))
            else:
                variant_impact = "moderate"
                functional_prediction = "uncertain_significance"
                overall_score = 60
            
            # Calculate sequence properties for additional context
            length = len(sequence)
            gc_content = (sequence.count('G') + sequence.count('C')) / length if length > 0 else 0
            complexity = len(set(sequence)) / 4
            
            return {
                "quality_score": {
                    "overall_score": round(overall_score, 2),
                    "confidence": round(confidence, 3),
                    "variant_impact": variant_impact,
                    "functional_prediction": functional_prediction
                },
                "gene_annotations": {
                    "sequence_length": length,
                    "gc_content": round(gc_content, 3),
                    "complexity": round(complexity, 3),
                    "gene_name": gene_name,
                    "analysis_method": "evo2_ai_model"  # Indicates real AI was used!
                },
                "analysis_metrics": {
                    "delta_score": delta_score,
                    "ai_prediction": prediction,
                    "ai_confidence": confidence,
                    "modal_used": True
                },
                "processing_successful": True
            }
            
        except Exception as e:
            logger.error(f"Failed to convert Modal result: {e}")
            # Fall back to local analysis if conversion fails
            return self._create_local_fallback_result(sequence, gene_name)
            
    
    def _create_local_fallback_result(self, sequence: str, gene_name: Optional[str]) -> Dict[str, Any]:
        """Create a local fallback result when Modal is unavailable"""
        length = len(sequence)
        gc_content = (sequence.count('G') + sequence.count('C')) / length if length > 0 else 0
        complexity = len(set(sequence)) / 4
        
        # Basic scoring
        length_score = min(length / 2000, 1.0) * 35
        gc_score = (1 - abs(gc_content - 0.5) * 2) * 30
        complexity_score = complexity * 35
        overall_score = length_score + gc_score + complexity_score
        
        if gene_name and gene_name.upper() in ['BRCA1', 'BRCA2', 'TP53', 'EGFR']:
            overall_score += 5
        
        confidence = min(overall_score / 100, 0.95)
        
        if overall_score > 85:
            variant_impact = "high"
            functional_prediction = "likely_pathogenic"
        elif overall_score > 65:
            variant_impact = "moderate" 
            functional_prediction = "uncertain_significance"
        else:
            variant_impact = "low"
            functional_prediction = "likely_benign"
        
        return {
            "quality_score": {
                "overall_score": round(min(overall_score, 100), 2),
                "confidence": round(min(confidence, 1.0), 3),
                "variant_impact": variant_impact,
                "functional_prediction": functional_prediction
            },
            "gene_annotations": {
                "sequence_length": length,
                "gc_content": round(gc_content, 3),
                "complexity": round(complexity, 3),
                "gene_name": gene_name,
                "analysis_method": "local_fallback"  # Indicates fallback was used
            },
            "analysis_metrics": {
                "length_score": round(length_score, 2),
                "gc_score": round(gc_score, 2),
                "complexity_score": round(complexity_score, 2),
                "modal_used": False
            },
            "processing_successful": True
        }

    async def _local_analysis_fallback(self, sequence: str, gene_name: Optional[str]) -> Dict[str, Any]:
        """
        Fallback analysis when Modal.com is not available
        """
        logger.warning("🔄 Using local analysis fallback - Modal.com not available")
        await asyncio.sleep(0.5)  # Simulate some processing time
        return self._create_local_fallback_result(sequence, gene_name)

# Global client instance
_modal_client = None

def get_modal_client() -> ModalEvo2Client:
    """Get Modal client instance"""
    global _modal_client
    if _modal_client is None:
        _modal_client = ModalEvo2Client()
    return _modal_client

# Integration function for the FastAPI app
async def run_evo2_analysis(
    sequence: str,
    gene_name: Optional[str] = None,
    analysis_type: str = "quality_score"
) -> Dict[str, Any]:
    """
    Main function to run Evo2 analysis
    This replaces the Modal function call in your FastAPI app
    """
    client = get_modal_client()
    return await client.analyze_sequence(sequence, gene_name, analysis_type)

# Batch analysis support
async def run_batch_analysis(sequences: list, gene_names: list = None) -> list:
    """Run analysis on multiple sequences"""
    client = get_modal_client()
    results = []
    
    for i, sequence in enumerate(sequences):
        gene_name = gene_names[i] if gene_names and i < len(gene_names) else None
        result = await client.analyze_sequence(sequence, gene_name)
        results.append(result)
    
    return results

# Specialized analysis functions
async def analyze_brca_variant(sequence: str) -> Dict[str, Any]:
    """Specialized BRCA gene analysis"""
    return await run_evo2_analysis(sequence, "BRCA1", "variant_analysis")

async def analyze_cancer_gene(sequence: str, gene_name: str) -> Dict[str, Any]:
    """Specialized cancer gene analysis"""
    cancer_genes = ['BRCA1', 'BRCA2', 'TP53', 'EGFR', 'KRAS', 'PIK3CA']
    analysis_type = "variant_analysis" if gene_name.upper() in cancer_genes else "quality_score"
    return await run_evo2_analysis(sequence, gene_name, analysis_type)
