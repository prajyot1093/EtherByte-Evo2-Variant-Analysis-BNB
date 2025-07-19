'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { Loader2, CheckCircle, AlertCircle, Dna } from 'lucide-react'
import {
  type SequenceAnalysisRequest,
  type SequenceAnalysisResponse,
  useSequenceAnalysis,
  useNFTMinting,
  formatQualityScore,
  getQualityScoreColor,
} from '../lib/api-client'

export function SequenceAnalysisComponent() {
  const { address, isConnected } = useAccount()
  const { analyzeSequence } = useSequenceAnalysis()
  const { mintNFT } = useNFTMinting()
  
  const [formData, setFormData] = useState<Partial<SequenceAnalysisRequest>>({
    sequence: '',
    gene_name: '',
    description: '',
  })
  
  const [analysisResult, setAnalysisResult] = useState<SequenceAnalysisResponse | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isMinting, setIsMinting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mintResult, setMintResult] = useState<any>(null)

  const handleInputChange = (field: keyof SequenceAnalysisRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAnalyzeSequence = async () => {
    if (!formData.sequence || formData.sequence.length < 10) {
      setError('Please enter a valid sequence (minimum 10 characters)')
      return
    }

    console.log('Wallet connected:', isConnected)
    console.log('Wallet address:', address)

    setIsAnalyzing(true)
    setError(null)
    setAnalysisResult(null)

    try {
      const request: SequenceAnalysisRequest = {
        sequence: formData.sequence!,
        gene_name: formData.gene_name || undefined,
        description: formData.description || undefined,
        contributor_address: address || undefined,
      }

      // Remove undefined values to send clean request
      const cleanRequest = Object.fromEntries(
        Object.entries(request).filter(([_, value]) => value !== undefined)
      ) as SequenceAnalysisRequest

      console.log('Sending request:', JSON.stringify(cleanRequest, null, 2))
      const result = await analyzeSequence(cleanRequest)
      setAnalysisResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleMintNFT = async () => {
    if (!analysisResult || !address) return

    setIsMinting(true)
    setError(null)

    try {
      const mintRequest = {
        analysis_id: analysisResult.analysis_id,
        contributor_address: address,
        metadata: {
          name: formData.gene_name || `Genomic Analysis ${analysisResult.analysis_id.slice(0, 8)}`,
          description: formData.description || `AI-analyzed genomic sequence with quality score ${analysisResult.quality_score.overall_score.toFixed(1)}`,
          external_url: `https://evo2-genomics.com/analysis/${analysisResult.analysis_id}`,
          attributes: [
            { trait_type: 'Quality Score', value: analysisResult.quality_score.overall_score },
            { trait_type: 'Sequence Length', value: analysisResult.gene_annotations.sequence_length },
            { trait_type: 'GC Content', value: (analysisResult.gene_annotations.gc_content * 100).toFixed(1) },
            { trait_type: 'Analysis Method', value: analysisResult.gene_annotations.analysis_method },
            { trait_type: 'Variant Impact', value: analysisResult.quality_score.variant_impact },
          ]
        }
      }

      const result = await mintNFT(mintRequest)
      setMintResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'NFT minting failed')
    } finally {
      setIsMinting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Analysis Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dna className="h-5 w-5" />
            Genomic Sequence Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sequence">DNA Sequence</Label>
            <Textarea
              id="sequence"
              placeholder="Enter your DNA sequence (minimum 10 characters, e.g., ATCGATCGATCGATCGATCG...)"
              value={formData.sequence}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('sequence', e.target.value)}
              className="min-h-[100px] font-mono"
            />
            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFormData(prev => ({ 
                  ...prev, 
                  sequence: 'ATCGATCGATCGATCGATCGATCGATCGATCGATCG',
                  gene_name: 'BRCA1' 
                }))}
              >
                Insert BRCA1 Test Sequence
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFormData(prev => ({ 
                  ...prev, 
                  sequence: 'GCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGC',
                  gene_name: 'TP53' 
                }))}
              >
                Insert TP53 Test Sequence
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gene_name">Gene Name (Optional)</Label>
              <Input
                id="gene_name"
                placeholder="e.g., BRCA1"
                value={formData.gene_name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('gene_name', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                placeholder="Brief description of your analysis"
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('description', e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={handleAnalyzeSequence}
            disabled={isAnalyzing || !formData.sequence}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Sequence...
              </>
            ) : (
              'Analyze Sequence'
            )}
          </Button>

          {!isConnected && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Connect your wallet to enable NFT minting after analysis.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Analysis Results */}
      {analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Quality Score</Label>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${getQualityScoreColor(analysisResult.quality_score.overall_score)}`}>
                    {analysisResult.quality_score.overall_score.toFixed(1)}
                  </span>
                  <Badge variant="secondary">
                    {formatQualityScore(analysisResult.quality_score.overall_score)}
                  </Badge>
                </div>
              </div>

              <div>
                <Label>Confidence</Label>
                <div className="text-lg font-semibold">
                  {(analysisResult.quality_score.confidence * 100).toFixed(1)}%
                </div>
              </div>

              <div>
                <Label>Variant Impact</Label>
                <Badge variant="outline">
                  {analysisResult.quality_score.variant_impact}
                </Badge>
              </div>

              <div>
                <Label>Functional Prediction</Label>
                <Badge variant="outline">
                  {analysisResult.quality_score.functional_prediction}
                </Badge>
              </div>

              <div>
                <Label>Sequence Length</Label>
                <div className="text-lg">{analysisResult.gene_annotations.sequence_length} bp</div>
              </div>

              <div>
                <Label>GC Content</Label>
                <div className="text-lg">{(analysisResult.gene_annotations.gc_content * 100).toFixed(1)}%</div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Analysis ID</Label>
              <div className="font-mono text-sm bg-gray-100 p-2 rounded">
                {analysisResult.analysis_id}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Processing Time</Label>
              <div className="text-sm text-gray-600">
                {analysisResult.processing_time.toFixed(2)} seconds
              </div>
            </div>

            {analysisResult.ready_for_minting && isConnected && (
              <Button
                onClick={handleMintNFT}
                disabled={isMinting}
                className="w-full"
                variant="default"
              >
                {isMinting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Minting NFT...
                  </>
                ) : (
                  'Mint as NFT'
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mint Results */}
      {mintResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              NFT Minted Successfully!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Token ID</Label>
                <div className="font-mono text-sm bg-gray-100 p-2 rounded">
                  {mintResult.nft_details?.token_id || 'N/A'}
                </div>
              </div>

              <div>
                <Label>Transaction Hash</Label>
                <div className="font-mono text-sm bg-gray-100 p-2 rounded truncate">
                  {mintResult.nft_details?.transaction_hash || 'N/A'}
                </div>
              </div>

              <div>
                <Label>IPFS Hash</Label>
                <div className="font-mono text-sm bg-gray-100 p-2 rounded truncate">
                  {mintResult.nft_details?.ipfs_hash || 'N/A'}
                </div>
              </div>

              <div>
                <Label>Reward Amount</Label>
                <div className="text-lg font-semibold text-green-600">
                  {mintResult.rewards?.total_rewards || '0'} GENOME
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  // Ensure transaction hash has 0x prefix
                  const txHash = mintResult.nft_details?.transaction_hash && mintResult.nft_details.transaction_hash.startsWith('0x') 
                    ? mintResult.nft_details.transaction_hash 
                    : `0x${mintResult.nft_details?.transaction_hash || ''}`;
                  const url = `https://testnet.bscscan.com/tx/${txHash}`;
                  console.log('Opening BscScan URL:', url);
                  // Use a more reliable method to open the URL
                  const link = document.createElement('a');
                  link.href = url;
                  link.target = '_blank';
                  link.rel = 'noopener noreferrer';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                variant="outline"
                className="flex-1"
              >
                View on BscScan
              </Button>
              
              <Button
                onClick={async () => {
                  // Ensure transaction hash has 0x prefix
                  const txHash = mintResult.nft_details?.transaction_hash && mintResult.nft_details.transaction_hash.startsWith('0x') 
                    ? mintResult.nft_details.transaction_hash 
                    : `0x${mintResult.nft_details?.transaction_hash || ''}`;
                  const url = `https://testnet.bscscan.com/tx/${txHash}`;
                  try {
                    await navigator.clipboard.writeText(url);
                    alert('BscScan link copied to clipboard!');
                  } catch (err) {
                    console.error('Failed to copy link:', err);
                  }
                }}
                variant="outline"
                size="sm"
              >
                📋
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
