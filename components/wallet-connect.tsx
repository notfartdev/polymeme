"use client"

import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Button } from '@/components/ui/button'
import { Copy, ChevronDown, LogOut, Wallet } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'

export function WalletConnect() {
  const { wallet, publicKey, connected, connecting, disconnect } = useWallet()
  const [mounted, setMounted] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const { toast } = useToast()

  // Fix hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  // Debug logging
  useEffect(() => {
    if (mounted) {
      console.log('Wallet state:', { connected, connecting, wallet: wallet?.adapter.name, publicKey: publicKey?.toString() })
    }
  }, [connected, connecting, wallet, publicKey, mounted])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showDropdown) {
        const target = e.target as Element
        if (!target.closest('[data-wallet-dropdown]')) {
          setShowDropdown(false)
        }
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showDropdown])

  const copyAddress = async () => {
    if (publicKey) {
      await navigator.clipboard.writeText(publicKey.toString())
      toast({
        title: "Address copied!",
        description: "Wallet address copied to clipboard",
      })
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }


  const handleDisconnect = async () => {
    try {
      await disconnect()
      // Clear any cached wallet state
      localStorage.removeItem('walletName')
      sessionStorage.clear()
      toast({
        title: "Wallet disconnected",
        description: "You'll need to sign again to reconnect",
      })
    } catch (error) {
      console.error('Error disconnecting wallet:', error)
    }
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <Button disabled className="gap-2">
        <Wallet className="h-4 w-4" />
        Loading...
      </Button>
    )
  }

  if (connecting) {
    return (
      <Button disabled className="gap-2">
        <Wallet className="h-4 w-4" />
        Connecting...
      </Button>
    )
  }

  if (!connected || !publicKey) {
    return (
      <WalletMultiButton className="!bg-primary !text-primary-foreground hover:!bg-primary/90 !rounded-md !h-9 !px-4 !py-2" />
    )
  }

  return (
    <>
      <div className="relative" style={{ zIndex: 9999 }} data-wallet-dropdown>
        <button 
          className="flex items-center gap-2 h-9 px-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer relative"
          style={{ zIndex: 9999, pointerEvents: 'auto' }}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            console.log('Wallet dropdown clicked')
            setShowDropdown(!showDropdown)
          }}
        >
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-500 rounded-sm flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-sm"></div>
            </div>
            <span className="text-sm font-medium">
              {formatAddress(publicKey.toString())}
            </span>
          </div>
          <ChevronDown className="h-4 w-4" />
        </button>

        {showDropdown && (
          <div 
            className="absolute right-0 top-full mt-1 w-56 bg-background border border-border rounded-md shadow-lg z-[10000]"
            style={{ zIndex: 10000 }}
          >
            <div className="px-3 py-2 border-b">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-purple-500 rounded-sm flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-sm"></div>
                </div>
                <div>
                  <p className="text-sm font-medium">{wallet?.adapter.name}</p>
                  <p className="text-xs text-muted-foreground">{formatAddress(publicKey.toString())}</p>
                </div>
              </div>
            </div>
            <div className="py-1">
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  copyAddress()
                  setShowDropdown(false)
                }}
              >
                <Copy className="h-4 w-4" />
                Copy address
              </button>
              <div className="border-t my-1"></div>
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleDisconnect()
                  setShowDropdown(false)
                }}
              >
                <LogOut className="h-4 w-4" />
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>

    </>
  )
}
