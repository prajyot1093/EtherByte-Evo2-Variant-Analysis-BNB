import { http, createConfig } from 'wagmi'
import { bscTestnet, bsc } from 'wagmi/chains'
import { createWeb3Modal } from '@web3modal/wagmi/react'
import { QueryClient } from '@tanstack/react-query'
import { defineChain } from 'viem'

// Define custom BNB Smart Chain configurations using defineChain
export const bscMainnet = defineChain({
  id: 56,
  name: 'BNB Smart Chain',
  nativeCurrency: {
    decimals: 18,
    name: 'BNB',
    symbol: 'BNB',
  },
  rpcUrls: {
    default: { http: ['https://bsc-dataseed.binance.org/'] },
    public: { http: ['https://bsc-dataseed.binance.org/'] },
  },
  blockExplorers: {
    default: { name: 'BscScan', url: 'https://bscscan.com' },
  },
  testnet: false,
})

export const bscTestnetConfig = defineChain({
  id: 97,
  name: 'BNB Smart Chain Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'tBNB',
    symbol: 'tBNB',
  },
  rpcUrls: {
    default: { http: ['https://data-seed-prebsc-1-s1.binance.org:8545/'] },
    public: { http: ['https://data-seed-prebsc-1-s1.binance.org:8545/'] },
  },
  blockExplorers: {
    default: { name: 'BscScan', url: 'https://testnet.bscscan.com' },
  },
  testnet: true,
})

// 1. Get projectId from https://cloud.walletconnect.com
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id'

// 2. Create wagmiConfig
export const config = createConfig({
  chains: [bscTestnetConfig, bscMainnet],
  transports: {
    [bscTestnetConfig.id]: http('https://data-seed-prebsc-1-s1.binance.org:8545/'),
    [bscMainnet.id]: http('https://bsc-dataseed.binance.org/'),
  },
})

// 3. Create modal
export const web3Modal = createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: true, // Optional - defaults to your Cloud configuration
  enableOnramp: true, // Optional - false as default
  themeMode: 'light',
  featuredWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
  ],
  tokens: {
    [bscTestnetConfig.id]: {
      address: '0x0C5f98e281cB3562a2EEDF3EE63D3b623De98b15', // Our GenomeToken
      image: '/genome-token-logo.png' // Add this logo to public folder
    }
  }
})

// 4. Create query client for React Query
export const queryClient = new QueryClient()

// Contract addresses from our deployment
export const CONTRACT_ADDRESSES = {
  [bscTestnetConfig.id]: {
    genomeNFT: '0x2181B366B730628F97c44C17de19949e5359682C',
    genomeToken: '0x0C5f98e281cB3562a2EEDF3EE63D3b623De98b15',
    marketplace: '0xd80bE0DDCA595fFf35bF44A7d2D4E312b05A1576',
    dao: '0x8FEbF8eA03E8e54846a7B82f7F6146bAE17bd3f4'
  },
  [bscMainnet.id]: {
    // Add mainnet addresses when deployed
    genomeNFT: '0x0000000000000000000000000000000000000000',
    genomeToken: '0x0000000000000000000000000000000000000000',
    marketplace: '0x0000000000000000000000000000000000000000',
    dao: '0x0000000000000000000000000000000000000000'
  }
} as const

// API Configuration
export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  endpoints: {
    health: '/health',
    analyze: '/api/analyze',
    mintNft: '/api/mint-nft',
    uploadToIpfs: '/api/upload-ipfs'
  }
} as const
