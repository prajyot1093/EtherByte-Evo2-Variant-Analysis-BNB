'use client'

import { useState } from 'react'
import { useAccount, useDisconnect, useBalance } from 'wagmi'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Wallet, LogOut, ChevronDown } from 'lucide-react'
import { bscTestnetConfig } from '../lib/web3-config'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

export function WalletConnectionHeader() {
  const { address, isConnected, chain } = useAccount()
  const { disconnect } = useDisconnect()
  const { open } = useWeb3Modal()
  
  // Get BNB balance
  const { data: bnbBalance } = useBalance({
    address,
    chainId: bscTestnetConfig.id,
  })

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center gap-2">
        <Button
          onClick={() => open()}
          size="sm"
          className="flex items-center gap-2"
        >
          <Wallet className="h-4 w-4" />
          Connect Wallet
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      {/* Network Badge */}
      <Badge variant={chain?.id === bscTestnetConfig.id ? "default" : "destructive"}>
        {chain?.name || 'Unknown'}
      </Badge>

      {/* Wallet Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">
              {address ? formatAddress(address) : 'Wallet'}
            </span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-3 py-2 border-b">
            <div className="text-sm font-medium">Wallet</div>
            <div className="text-xs text-gray-500 font-mono">
              {address ? formatAddress(address) : 'Not connected'}
            </div>
          </div>
          <div className="px-3 py-2 border-b">
            <div className="text-xs text-gray-500 mb-1">Balance</div>
            <div className="text-sm font-medium">
              {bnbBalance ? `${parseFloat(bnbBalance.formatted).toFixed(4)} ${bnbBalance.symbol}` : '0.0000 BNB'}
            </div>
          </div>
          <DropdownMenuItem onClick={() => disconnect()} className="text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
