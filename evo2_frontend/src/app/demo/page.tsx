"use client";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { ArrowLeft, Play, CheckCircle, ExternalLink, Code, Dna, Coins, Users, FileText } from "lucide-react";
import Link from "next/link";

export default function DemoPage() {
  const demoSteps = [
    {
      id: 1,
      title: "Connect Your Wallet",
      description: "Connect your MetaMask or compatible wallet to BNB Smart Chain Testnet",
      action: "Go to any page and click 'Connect Wallet'",
      icon: <Coins className="h-5 w-5" />,
      link: "/blockchain"
    },
    {
      id: 2,
      title: "Analyze Genomic Sequence", 
      description: "Input a DNA sequence (try BRCA1 gene) and get AI-powered variant analysis",
      action: "Use the sequence analysis component",
      icon: <Dna className="h-5 w-5" />,
      link: "/"
    },
    {
      id: 3,
      title: "Mint Analysis NFT",
      description: "Convert your genomic analysis results into a unique NFT on the blockchain",
      action: "Click 'Mint as NFT' after analysis",
      icon: <FileText className="h-5 w-5" />,
      link: "/blockchain"
    },
    {
      id: 4,
      title: "Browse Marketplace",
      description: "Explore available genomic analysis NFTs and see trading interface",
      action: "Visit the NFT marketplace",
      icon: <ExternalLink className="h-5 w-5" />,
      link: "/marketplace"
    },
    {
      id: 5,
      title: "Participate in DAO",
      description: "View governance proposals and participate in platform decisions",
      action: "Check out DAO governance features",
      icon: <Users className="h-5 w-5" />,
      link: "/dao"
    }
  ];

  const features = [
    {
      title: "AI-Powered Genomic Analysis",
      description: "Using Evo2 model for advanced DNA sequence analysis and variant calling",
      status: "✅ Implemented",
      tech: "Modal.com + Evo2 Model"
    },
    {
      title: "Blockchain NFT Minting",
      description: "Convert analysis results into permanent, ownable NFTs",
      status: "✅ Implemented", 
      tech: "BNB Smart Chain + ERC721"
    },
    {
      title: "Decentralized Marketplace",
      description: "Trade genomic analysis NFTs with other researchers",
      status: "✅ UI Complete",
      tech: "Smart Contracts + Web3"
    },
    {
      title: "DAO Governance",
      description: "Community-driven platform decisions and token rewards",
      status: "✅ UI Complete",
      tech: "Governance Tokens + Voting"
    },
    {
      title: "Token Economics",
      description: "GENOME tokens reward contributions and enable governance",
      status: "✅ Implemented",
      tech: "ERC20 + Reward System"
    },
    {
      title: "Web3 Integration",
      description: "Seamless wallet connection and blockchain interactions",
      status: "✅ Implemented",
      tech: "Wagmi + WalletConnect"
    }
  ];

  const contractAddresses = [
    { name: "GenomeNFT", address: "0x2181B366B730628F97c44C17de19949e5359682C" },
    { name: "GenomeToken", address: "0x0C5f98e281cB3562a2EEDF3EE63D3b623De98b15" },
    { name: "Marketplace", address: "0xd80bE0DDCA595fFf35bF44A7d2D4E312b05A1576" },
    { name: "DAO", address: "0x8FEbF8eA03E8e54846a7B82f7F6146bAE17bd3f4" }
  ];

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
                  Back to Home
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Play className="h-6 w-6 text-green-600" />
                  Platform Demo Guide
                </h1>
                <p className="text-sm text-gray-600">Complete walkthrough for hackathon judges and users</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Overview */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Evo2 Variant Analysis BNB</CardTitle>
            <p className="text-center text-gray-600 text-lg">
              A decentralized platform for AI-powered genomic analysis with blockchain-based NFT ownership
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Dna className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">AI Analysis</h3>
                <p className="text-sm text-gray-600">
                  Advanced genomic variant analysis using Evo2 foundation model
                </p>
              </div>
              <div>
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FileText className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">NFT Ownership</h3>
                <p className="text-sm text-gray-600">
                  Your analysis results become permanent, tradeable NFTs
                </p>
              </div>
              <div>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Community Governance</h3>
                <p className="text-sm text-gray-600">
                  Decentralized decision making and token rewards
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Steps */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-green-600" />
              Interactive Demo Steps
            </CardTitle>
            <p className="text-gray-600">Follow these steps to experience the full platform</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {demoSteps.map((step, index) => (
                <div key={step.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                    {step.id}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {step.icon}
                      <h3 className="font-semibold">{step.title}</h3>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{step.description}</p>
                    <p className="text-blue-600 text-sm font-medium">{step.action}</p>
                  </div>
                  <Link href={step.link}>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      Try Now
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Features Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Platform Features & Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{feature.title}</h3>
                    <Badge 
                      variant="outline" 
                      className="bg-green-50 text-green-700 border-green-200"
                    >
                      {feature.status}
                    </Badge>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{feature.description}</p>
                  <p className="text-blue-600 text-xs font-medium">{feature.tech}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Technical Details */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Smart Contracts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5 text-blue-600" />
                Smart Contracts (BNB Testnet)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {contractAddresses.map((contract, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{contract.name}</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigator.clipboard.writeText(contract.address)}
                      >
                        Copy
                      </Button>
                    </div>
                    <p className="text-xs font-mono text-gray-600 mt-1">{contract.address}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tech Stack */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5 text-purple-600" />
                Technology Stack
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium">Frontend</h4>
                  <p className="text-sm text-gray-600">Next.js 15, TypeScript, Tailwind CSS, Wagmi, WalletConnect</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium">Blockchain</h4>
                  <p className="text-sm text-gray-600">BNB Smart Chain, Solidity, Hardhat, OpenZeppelin</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium">AI/Backend</h4>
                  <p className="text-sm text-gray-600">Modal.com, Evo2 Model, Python FastAPI, Web3.py</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium">Infrastructure</h4>
                  <p className="text-sm text-gray-600">IPFS, BNB Testnet, Vercel Deployment</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Navigation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link href="/">
                <Button variant="outline" className="w-full flex items-center gap-2">
                  <Dna className="h-4 w-4" />
                  Analysis
                </Button>
              </Link>
              <Link href="/blockchain">
                <Button variant="outline" className="w-full flex items-center gap-2">
                  <Coins className="h-4 w-4" />
                  Blockchain
                </Button>
              </Link>
              <Link href="/marketplace">
                <Button variant="outline" className="w-full flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Marketplace
                </Button>
              </Link>
              <Link href="/dao">
                <Button variant="outline" className="w-full flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  DAO
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
