"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { WalletConnection } from "~/components/wallet-connection";
import { SequenceAnalysisComponent } from "~/components/sequence-analysis";
import { Dna, Microscope, BarChart3 } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Dna className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Evo2 Genomic Analysis
                </h1>
                <p className="text-gray-600">
                  AI-powered genomic analysis with NFT minting on BNB Smart Chain
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Wallet & Quick Stats */}
          <div className="space-y-6">
            <WalletConnection />
            
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Platform Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Analyses</span>
                  <span className="font-semibold">1,247</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">NFTs Minted</span>
                  <span className="font-semibold">892</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Rewards</span>
                  <span className="font-semibold">45,230 GENOME</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Users</span>
                  <span className="font-semibold">156</span>
                </div>
              </CardContent>
            </Card>

            {/* How It Works */}
            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    1
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">Upload Sequence</div>
                    <div className="text-gray-600">Submit your DNA, RNA, or protein sequence</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    2
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">AI Analysis</div>
                    <div className="text-gray-600">Evo2 AI analyzes variants and quality</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    3
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">Mint NFT</div>
                    <div className="text-gray-600">Create unique NFT on BNB Chain</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    4
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">Earn Rewards</div>
                    <div className="text-gray-600">Receive GENOME tokens for contributions</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Main Application */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="analysis" className="space-y-6">
              <TabsList className="grid w-full grid-cols-1">
                <TabsTrigger value="analysis" className="flex items-center gap-2">
                  <Microscope className="h-4 w-4" />
                  AI Analysis & NFT Minting
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="analysis" className="space-y-6">
                <SequenceAnalysisComponent />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>© 2025 Evo2 Genomic Analysis Platform. Powered by AI and BNB Smart Chain.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
