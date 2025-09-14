"use client"

import { useWallet } from '@solana/wallet-adapter-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Wallet, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface WalletGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
  showBackButton?: boolean
}

export function WalletGuard({ 
  children, 
  fallback, 
  redirectTo = '/',
  showBackButton = true 
}: WalletGuardProps) {
  const { connected, connecting } = useWallet()
  const router = useRouter()

  // Show loading state while connecting
  if (connecting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Connecting Wallet...</h2>
            <p className="text-muted-foreground">Please wait while we connect your wallet.</p>
          </div>
        </Card>
      </div>
    )
  }

  // Show wallet connection prompt if not connected
  if (!connected) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Wallet className="h-8 w-8 text-primary" />
            </div>
            
            <h2 className="text-2xl font-bold mb-2">Wallet Required</h2>
            <p className="text-muted-foreground mb-6">
              You need to connect your wallet to access this page. Connect your Solana wallet to continue.
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={() => router.push('/')} 
                className="w-full"
                size="lg"
              >
                <Wallet className="h-4 w-4 mr-2" />
                Connect Wallet
              </Button>
              
              {showBackButton && (
                <Button 
                  variant="outline" 
                  onClick={() => router.back()}
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // Show protected content if wallet is connected
  return <>{children}</>
}

// Hook for checking wallet connection
export function useWalletGuard() {
  const { connected, connecting } = useWallet()
  
  return {
    isConnected: connected,
    isConnecting: connecting,
    requiresWallet: !connected && !connecting
  }
}
