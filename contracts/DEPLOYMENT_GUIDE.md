# Smart Contract Deployment Guide

## 🔧 Setup Instructions

### 1. Environment Configuration
You need to set up your `.env` file with:
- **BNB_TESTNET_RPC_URL**: Already configured with public testnet RPC
- **PRIVATE_KEY**: Your wallet's private key (keep this secret!)

### 2. Get Your Private Key
1. Open MetaMask or your wallet
2. Go to Account Details → Export Private Key
3. Copy the private key (starts with 0x...)
4. Replace `your_private_key_here` in `.env` file

### 3. Get BNB Testnet Tokens
1. Add BNB Testnet to MetaMask:
   - Network: BNB Smart Chain Testnet
   - RPC URL: https://data-seed-prebsc-1-s1.binance.org:8545
   - Chain ID: 97
   - Symbol: tBNB
   - Explorer: https://testnet.bscscan.com

2. Get free testnet BNB from faucet:
   - Visit: https://testnet.binance.org/faucet-smart
   - Enter your wallet address
   - Request tBNB tokens

### 4. Test Deployment Locally First
```bash
# Start local hardhat node
npm run node

# Deploy to local network (in another terminal)
npm run deploy:local
```

### 5. Deploy to BNB Testnet
```bash
# Make sure you have testnet BNB and private key set
npm run deploy:testnet
```

## 🚨 Security Notes
- Never commit `.env` file to git
- Keep your private key secure
- Use a separate wallet for development
- The `.env` file is already in `.gitignore`

## 📝 After Deployment
The script will create `deployed-contracts.json` with all contract addresses for integration with frontend/backend.
