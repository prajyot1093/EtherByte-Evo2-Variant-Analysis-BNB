import { env } from '~/env';

const API_BASE_URL = env.NEXT_PUBLIC_API_URL;

export interface SequenceAnalysisRequest {
  sequence: string;
  sequence_type: 'DNA' | 'RNA' | 'PROTEIN';
  analysis_type: 'variant_analysis' | 'quality_check' | 'annotation';
  metadata?: {
    gene_name?: string;
    chromosome?: string;
    position?: number;
    organism?: string;
  };
}

export interface SequenceAnalysisResponse {
  analysis_id: string;
  sequence_info: {
    length: number;
    gc_content: number;
    sequence_type: string;
  };
  quality_score: number;
  predictions: {
    pathogenicity_score?: number;
    functional_impact?: string;
    conservation_score?: number;
  };
  annotations: {
    gene_name?: string;
    protein_function?: string;
    known_variants?: any[];
  };
  blockchain_data?: {
    ipfs_hash?: string;
    metadata_uri?: string;
    nft_mintable: boolean;
  };
  processing_time: number;
  status: 'completed' | 'processing' | 'error';
  error_message?: string;
}

export interface NFTMintRequest {
  analysis_id: string;
  wallet_address: string;
  sequence_data: {
    sequence: string;
    quality_score: number;
    analysis_results: any;
  };
  metadata: {
    title: string;
    description: string;
    gene_name?: string;
    organism?: string;
    researcher_name?: string;
  };
}

export interface NFTMintResponse {
  transaction_hash: string;
  token_id: number;
  ipfs_hash: string;
  metadata_uri: string;
  contract_address: string;
  gas_used: number;
  status: 'success' | 'pending' | 'failed';
  error_message?: string;
}

class GenomeAPIClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  async analyzeSequence(request: SequenceAnalysisRequest): Promise<SequenceAnalysisResponse> {
    const response = await fetch(`${this.baseURL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Analysis failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getAnalysisStatus(analysisId: string): Promise<SequenceAnalysisResponse> {
    const response = await fetch(`${this.baseURL}/api/analysis/${analysisId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get analysis status: ${response.statusText}`);
    }

    return response.json();
  }

  async mintNFT(request: NFTMintRequest): Promise<NFTMintResponse> {
    const response = await fetch(`${this.baseURL}/api/mint-nft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`NFT minting failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getHealthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await fetch(`${this.baseURL}/health`);
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getAnalysisHistory(walletAddress?: string): Promise<SequenceAnalysisResponse[]> {
    const url = walletAddress 
      ? `${this.baseURL}/api/analysis/history?wallet=${walletAddress}`
      : `${this.baseURL}/api/analysis/history`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to get analysis history: ${response.statusText}`);
    }

    return response.json();
  }

  async getPlatformStats(): Promise<{
    total_analyses: number;
    total_nfts_minted: number;
    active_users: number;
    total_tokens_distributed: number;
  }> {
    const response = await fetch(`${this.baseURL}/api/stats`);
    
    if (!response.ok) {
      throw new Error(`Failed to get platform stats: ${response.statusText}`);
    }

    return response.json();
  }
}

// Export singleton instance
export const genomeAPI = new GenomeAPIClient();

// Export helper functions
export const formatSequence = (sequence: string): string => {
  return sequence.toUpperCase().replace(/[^ATCGNU]/g, '');
};

export const validateDNASequence = (sequence: string): boolean => {
  const cleanSequence = formatSequence(sequence);
  return /^[ATCG]+$/.test(cleanSequence);
};

export const validateRNASequence = (sequence: string): boolean => {
  const cleanSequence = formatSequence(sequence);
  return /^[AUCG]+$/.test(cleanSequence);
};

export const getSequenceStats = (sequence: string) => {
  const cleanSequence = formatSequence(sequence);
  const length = cleanSequence.length;
  const gcCount = (cleanSequence.match(/[GC]/g) || []).length;
  const gcContent = (gcCount / length) * 100;
  
  return {
    length,
    gcContent: Math.round(gcContent * 100) / 100,
    atContent: Math.round((100 - gcContent) * 100) / 100,
  };
};
