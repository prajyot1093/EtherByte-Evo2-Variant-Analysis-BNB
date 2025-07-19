"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { WalletConnectionHeader } from "~/components/wallet-connection-header";
import { SequenceAnalysisComponent } from "~/components/sequence-analysis";
import { ClientOnly } from "~/components/client-only";
import { Coins, ArrowLeft, Dna, FileText, Database, Trophy, Users, Activity } from "lucide-react";
import Link from "next/link";
import { useAccount, useBalance } from "wagmi";
import { formatEther } from "viem";

export default function BlockchainFeaturesPage() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const [userStats, setUserStats] = useState({
    nftsOwned: 0,
    genomeTokens: 0,
    contributions: 0,
    votingPower: 0
  });

  // Load real blockchain data
  useEffect(() => {
    if (isConnected && address) {
      loadUserBlockchainData();
    }
  }, [isConnected, address]);

  const loadUserBlockchainData = async () => {
    try {
      // Import the blockchain utilities we created
      const { getUserNFTBalance, getUserTokenBalance, getVotingPower } = await import('~/lib/blockchain');
      
      const [nftBalance, tokenBalance, votingPower] = await Promise.all([
        getUserNFTBalance(address!),
        getUserTokenBalance(address!),
        getVotingPower(address!)
      ]);
      
      setUserStats({
        nftsOwned: nftBalance,
        genomeTokens: Math.floor(tokenBalance),
        contributions: nftBalance * 2, // Estimate based on NFTs
        votingPower: votingPower
      });
    } catch (error) {
      console.error('Error loading blockchain data:', error);
      // Fallback to mock data if contracts aren't accessible
      setUserStats({
        nftsOwned: 0,
        genomeTokens: 0,
        contributions: 0,
        votingPower: 0
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Analysis
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Coins className="h-6 w-6 text-blue-600" />
                  Blockchain Features
                </h1>
                <p className="text-sm text-gray-600">Mint NFTs and earn rewards for your genomic analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ClientOnly>
                <WalletConnectionHeader />
              </ClientOnly>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* User Dashboard - only show if wallet connected */}
          {isConnected && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">BNB Balance</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {balance ? parseFloat(formatEther(balance.value)).toFixed(4) : '0.0000'}
                      </p>
                    </div>
                    <Coins className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-green-50 to-green-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 font-medium">GENOME Tokens</p>
                      <p className="text-2xl font-bold text-green-900">{userStats.genomeTokens}</p>
                    </div>
                    <Trophy className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600 font-medium">NFTs Owned</p>
                      <p className="text-2xl font-bold text-purple-900">{userStats.nftsOwned}</p>
                    </div>
                    <Database className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-orange-50 to-orange-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-600 font-medium">Contributions</p>
                      <p className="text-2xl font-bold text-orange-900">{userStats.contributions}</p>
                    </div>
                    <Activity className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Connection Prompt */}
          {!isConnected && (
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 mb-8">
              <CardContent className="p-6 text-center">
                <Coins className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
                <p className="text-gray-600 mb-4">
                  Connect your wallet to access blockchain features, view your NFTs, and participate in governance.
                </p>
                <ClientOnly>
                  <WalletConnectionHeader />
                </ClientOnly>
              </CardContent>
            </Card>
          )}

          {/* Sequence Analysis and NFT Minting */}
          <Card className="bg-white border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Dna className="h-5 w-5" />
                Sequence Analysis & NFT Minting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SequenceAnalysisComponent />
            </CardContent>
          </Card>

          {/* Additional Blockchain Features */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Token Rewards */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <Coins className="h-5 w-5" />
                  Token Rewards
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">
                  Earn GENOME tokens for contributing to the genomic analysis ecosystem.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Analysis Contribution:</span>
                    <Badge variant="secondary">+10 GENOME</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">NFT Minting:</span>
                    <Badge variant="secondary">+5 GENOME</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Data Validation:</span>
                    <Badge variant="secondary">+15 GENOME</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Current Balance:</span>
                    <Badge variant="default">{userStats.genomeTokens} GENOME</Badge>
                  </div>
                </div>
                <Button className="w-full" variant="outline" disabled={!isConnected}>
                  {isConnected ? "Claim Available Rewards" : "Connect Wallet to Claim"}
                </Button>
              </CardContent>
            </Card>

            {/* Marketplace */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  <Database className="h-5 w-5" />
                  NFT Marketplace
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">
                  Trade genomic analysis NFTs and discover unique genetic insights.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Your NFTs:</span>
                    <Badge variant="outline">{userStats.nftsOwned}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Market Value:</span>
                    <Badge variant="outline">{(userStats.nftsOwned * 0.1).toFixed(1)} BNB</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Available NFTs:</span>
                    <Badge variant="outline">127</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" disabled={!isConnected}>
                    List NFT
                  </Button>
                  <Link href="/marketplace">
                    <Button variant="outline" size="sm" className="w-full">
                      Browse Market
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* DAO Governance */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <FileText className="h-5 w-5" />
                  DAO Governance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">
                  Participate in platform governance and shape the future of genomic analysis.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Voting Power:</span>
                    <Badge variant="outline">{userStats.votingPower} votes</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Active Proposals:</span>
                    <Badge variant="outline">3</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Your Participation:</span>
                    <Badge variant="outline">{userStats.contributions > 0 ? '75%' : '0%'}</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" disabled={!isConnected}>
                    Create Proposal
                  </Button>
                  <Link href="/dao">
                    <Button variant="outline" size="sm" className="w-full">
                      Vote on Proposals
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Analytics */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-indigo-700">
                  <Database className="h-5 w-5" />
                  Platform Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">
                  Monitor platform usage and your contributions to the ecosystem.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Analyses:</span>
                    <span className="font-semibold">1,247</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">NFTs Minted:</span>
                    <span className="font-semibold">856</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Active Users:</span>
                    <span className="font-semibold">342</span>
                  </div>
                </div>
                <Button className="w-full" variant="outline">
                  View Details
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Platform Benefits */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="text-center text-lg">
                Why Use Blockchain Features?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Dna className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Ownership</h3>
                  <p className="text-sm text-gray-600">
                    Your genomic analysis results are permanently yours as NFTs
                  </p>
                </div>
                <div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Coins className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Rewards</h3>
                  <p className="text-sm text-gray-600">
                    Earn tokens for contributing valuable genetic insights
                  </p>
                </div>
                <div>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FileText className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Governance</h3>
                  <p className="text-sm text-gray-600">
                    Shape the platform's future through decentralized governance
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
