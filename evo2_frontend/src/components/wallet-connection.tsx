'use client'

import { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { Wallet, LogOut, ExternalLink, Copy, Check } from 'lucide-react'
import { CONTRACT_ADDRESSES, bscTestnetConfig } from '../lib/web3-config'

export function WalletConnection() {
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const [copied, setCopied] = useState(false)
  
  // Get BNB balance
  const { data: bnbBalance } = useBalance({
    address,
    chainId: bscTestnetConfig.id,
  })
  
  // Get GENOME token balance
  const { data: genomeBalance } = useBalance({
    address,
    token: CONTRACT_ADDRESSES[bscTestnetConfig.id]?.genomeToken as `0x${string}`,
    chainId: bscTestnetConfig.id,
  })

  const handleCopyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const handleConnect = (connector: any) => {
    connect({ connector })
  }

  if (isConnected && address) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Connected
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Address:</span>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                  {formatAddress(address)}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyAddress}
                  className="h-8 w-8 p-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {chain && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Network:</span>
                  <Badge variant={chain.id === bscTestnetConfig.id ? "default" : "destructive"}>
                    {chain.name}
                  </Badge>
                </div>
              )}
            </div>
            <Button variant="outline" onClick={() => disconnect()}>
              <LogOut className="mr-2 h-4 w-4" />
              Disconnect
            </Button>
          </div>

          {/* Balance Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-1">
              <span className="text-sm font-medium">BNB Balance:</span>
              <div className="text-lg font-semibold">
                {bnbBalance ? `${parseFloat(bnbBalance.formatted).toFixed(4)} ${bnbBalance.symbol}` : '0.0000 BNB'}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-sm font-medium">GENOME Tokens:</span>
              <div className="text-lg font-semibold text-blue-600">
                {genomeBalance ? `${parseFloat(genomeBalance.formatted).toFixed(2)} GENOME` : '0.00 GENOME'}
              </div>
            </div>
          </div>

          {/* Network Warning */}
          {chain && chain.id !== bscTestnetConfig.id && (
            <Alert variant="destructive">
              <AlertDescription>
                Please switch to BNB Smart Chain Testnet to use all features.
              </AlertDescription>
            </Alert>
          )}

          {/* Quick Links */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://testnet.bscscan.com/address/${address}`, '_blank')}
            >
              <ExternalLink className="mr-1 h-3 w-3" />
              View on BscScan
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://testnet.bnbchain.org/faucet-smart', '_blank')}
            >
              <ExternalLink className="mr-1 h-3 w-3" />
              Get Testnet BNB
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Connect Wallet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          Connect your wallet to interact with genomic NFTs on BNB Smart Chain.
        </p>
        
        <div className="space-y-2">
          {connectors.map((connector) => (
            <Button
              key={connector.uid}
              variant="outline"
              onClick={() => handleConnect(connector)}
              disabled={isPending}
              className="w-full justify-start"
            >
              <Wallet className="mr-2 h-4 w-4" />
              {connector.name}
              {isPending && ' (Connecting...)'}
            </Button>
          ))}
        </div>

        <Alert>
          <AlertDescription className="text-xs">
            Make sure to switch to BNB Smart Chain Testnet after connecting.
            You can get testnet BNB from the official faucet.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
