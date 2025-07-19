/**
 * API Client for Evo2 Genomic Analysis Backend
 */

import { API_CONFIG } from './web3-config'
import { env } from '../env'

export interface SequenceAnalysisRequest {
  sequence: string
  gene_name?: string
  description?: string
  contributor_address?: string
}

// Modal.com Evo2 Direct Request
export interface Evo2AnalysisRequest {
  sequence: string
  model?: string
}

// Modal.com Evo2 Direct Response
export interface Evo2AnalysisResponse {
  embeddings?: number[]
  analysis?: {
    quality_score: number
    functional_prediction: string
    variant_impact: string
  }
  metadata?: {
    model_version: string
    processing_time: number
  }
}

export interface SequenceAnalysisResponse {
  analysis_id: string
  sequence_hash: string
  quality_score: {
    overall_score: number
    confidence: number
    variant_impact: string
    functional_prediction: string
  }
  gene_annotations: {
    sequence_length: number
    gc_content: number
    complexity: number
    gene_name: string | null
    analysis_method: string
  }
  analysis_metadata: {
    gene_name: string | null
    description: string | null
    contributor_address: string | null
    sequence_length: number
  }
  processing_time: number
  timestamp: string
  ready_for_minting: boolean
}

export interface MintNFTRequest {
  analysis_id: string
  contributor_address: string
  metadata?: {
    name?: string
    description?: string
    external_url?: string
    attributes?: Array<{
      trait_type: string
      value: string | number
    }>
  }
}

export interface MintNFTResponse {
  transaction_hash: string
  nft_token_id: string
  ipfs_hash: string
  metadata_url: string
  contract_address: string
  minter_address: string
  quality_score: number
  reward_amount: string
  timestamp: string
}

export interface HealthCheckResponse {
  status: string
  services: {
    modal_com: string
    evo2_model: string
  }
  timestamp: string
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_CONFIG.baseUrl) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    console.log('Making API request to:', url)
    console.log('Request body:', options.body)

    try {
      const response = await fetch(url, {
        ...options,
        headers: defaultHeaders,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('API Error Response:', errorData)
        throw new Error(
          `API Error ${response.status}: ${errorData.detail || response.statusText}`
        )
      }

      return await response.json()
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error)
      throw error
    }
  }

  async healthCheck(): Promise<HealthCheckResponse> {
    return this.request<HealthCheckResponse>(API_CONFIG.endpoints.health)
  }

  async analyzeSequence(
    request: SequenceAnalysisRequest
  ): Promise<SequenceAnalysisResponse> {
    return this.request<SequenceAnalysisResponse>(
      API_CONFIG.endpoints.analyze,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    )
  }

  async mintNFT(request: MintNFTRequest): Promise<MintNFTResponse> {
    return this.request<MintNFTResponse>(
      API_CONFIG.endpoints.mintNft,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    )
  }

  async uploadToIpfs(file: File): Promise<{ ipfs_hash: string; url: string }> {
    const formData = new FormData()
    formData.append('file', file)

    return this.request<{ ipfs_hash: string; url: string }>(
      API_CONFIG.endpoints.uploadToIpfs,
      {
        method: 'POST',
        body: formData,
        headers: {}, // Don't set Content-Type for FormData
      }
    )
  }

  // Direct Modal.com Evo2 Analysis
  async analyzeWithEvo2Direct(request: Evo2AnalysisRequest): Promise<Evo2AnalysisResponse> {
    const evo2Url = env.NEXT_PUBLIC_ANALYZE_SINGLE_VARIANT_BASE_URL
    
    if (!evo2Url) {
      throw new Error('Evo2 Modal.com URL not configured')
    }

    try {
      const response = await fetch(evo2Url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error(`Evo2 Analysis failed: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Direct Evo2 analysis failed:', error)
      throw error
    }
  }
}

export const apiClient = new ApiClient()

// React hooks for API operations
export function useApiHealthCheck() {
  return {
    checkHealth: () => apiClient.healthCheck(),
  }
}

export function useSequenceAnalysis() {
  return {
    analyzeSequence: (request: SequenceAnalysisRequest) =>
      apiClient.analyzeSequence(request),
  }
}

export function useNFTMinting() {
  return {
    mintNFT: (request: MintNFTRequest) => apiClient.mintNFT(request),
  }
}

// Utility functions
export function formatQualityScore(score: number): string {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Fair'
  return 'Poor'
}

export function getQualityScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-blue-600'
  if (score >= 40) return 'text-yellow-600'
  return 'text-red-600'
}
