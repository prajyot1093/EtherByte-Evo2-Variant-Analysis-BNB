"use client";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { WalletConnectionHeader } from "~/components/wallet-connection-header";
import { SequenceAnalysisComponent } from "~/components/sequence-analysis";
import { Coins, ArrowLeft, Dna, FileText, Database } from "lucide-react";
import Link from "next/link";

export default function BlockchainFeaturesPage() {
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
              <WalletConnectionHeader />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
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
                    <span className="font-semibold">+10 GENOME</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">NFT Minting:</span>
                    <span className="font-semibold">+5 GENOME</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Data Validation:</span>
                    <span className="font-semibold">+15 GENOME</span>
                  </div>
                </div>
                <Button className="w-full" variant="outline">
                  Claim Rewards
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
                    <span className="font-semibold">0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Market Value:</span>
                    <span className="font-semibold">0 BNB</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Available NFTs:</span>
                    <span className="font-semibold">127</span>
                  </div>
                </div>
                <Button className="w-full" variant="outline">
                  Browse Marketplace
                </Button>
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
                    <span className="font-semibold">0 votes</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Active Proposals:</span>
                    <span className="font-semibold">3</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Your Participation:</span>
                    <span className="font-semibold">0%</span>
                  </div>
                </div>
                <Button className="w-full" variant="outline">
                  View Proposals
                </Button>
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
