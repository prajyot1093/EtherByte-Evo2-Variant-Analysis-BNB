export interface SequenceAnalysisRequest {
  sequence: string
  sequence_type: 'DNA' | 'RNA' | 'protein'
  analysis_type: 'basic' | 'evo2' | 'full'
  gene_name?: string
  description?: string
}

export interface SequenceAnalysisResponse {
  sequence_id: string
  analysis_type: string
  results: {
    basic_info?: {
      length: number
      gc_content?: number
      composition: Record<string, number>
    }
    evo2_predictions?: {
      variant_effects: Array<{
        position: number
        variant: string
        effect_score: number
        pathogenicity: 'benign' | 'pathogenic' | 'uncertain'
        confidence: number
      }>
      summary: {
        total_variants: number
        pathogenic_count: number
        benign_count: number
        uncertain_count: number
      }
    }
    conservation_scores?: number[]
    functional_annotations?: string[]
  }
  timestamp: string
  metadata?: {
    gene_name?: string
    description?: string
    analysis_duration: number
  }
}

export interface MintNFTRequest {
  sequence_id: string
  recipient_address: string
  metadata: {
    name: string
    description: string
    image?: string
    attributes: Array<{
      trait_type: string
      value: string | number
    }>
  }
}

export interface MintNFTResponse {
  transaction_hash: string
  token_id: string
  contract_address: string
  gas_used: string
  block_number: number
}

export interface ApiError {
  error: string
  message: string
  details?: any
}
