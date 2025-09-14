"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Wallet, AlertCircle, CheckCircle, ExternalLink, RefreshCw } from "lucide-react"
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletAssets } from '@/hooks/use-wallet-assets'
import { useToast } from '@/hooks/use-toast'

interface BettingInterfaceProps {
  marketId: string
  marketTitle: string
  requiredTokenMint: string
  requiredTokenSymbol: string
  isOpen: boolean
  onClose: () => void
  onBetPlaced: () => void
}

interface TokenBalance {
  mint: string
  symbol: string
  balance: number
  value: number
  logo?: string
}

export function BettingInterface({
  marketId,
  marketTitle,
  requiredTokenMint,
  requiredTokenSymbol,
  isOpen,
  onClose,
  onBetPlaced
}: BettingInterfaceProps) {
  const { connected, publicKey } = useWallet()
  const { assets, loading: assetsLoading } = useWalletAssets()
  const { toast } = useToast()
  
  const [selectedSide, setSelectedSide] = useState<'yes' | 'no' | null>(null)
  const [betAmount, setBetAmount] = useState('')
  const [isPlacingBet, setIsPlacingBet] = useState(false)
  const [tokenBalance, setTokenBalance] = useState<TokenBalance | null>(null)

  // Find the required token in user's wallet
  useEffect(() => {
    if (assets && requiredTokenMint) {
      const token = assets.find(asset => asset.mint === requiredTokenMint)
      if (token) {
        setTokenBalance({
          mint: token.mint,
          symbol: token.symbol,
          balance: token.balance,
          value: token.value || 0,
          logo: token.logo
        })
      } else {
        setTokenBalance(null)
      }
    }
  }, [assets, requiredTokenMint])

  const handleBetClick = (side: 'yes' | 'no') => {
    if (!connected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to place a bet.",
        variant: "destructive"
      })
      return
    }

    if (!tokenBalance) {
      toast({
        title: "Token Required",
        description: `You need ${requiredTokenSymbol} tokens to bet on this market.`,
        variant: "destructive"
      })
      return
    }

    setSelectedSide(side)
  }

  const handlePlaceBet = async () => {
    if (!selectedSide || !betAmount || !tokenBalance) return

    const amount = parseFloat(betAmount)
    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid bet amount.",
        variant: "destructive"
      })
      return
    }

    if (amount > tokenBalance.balance) {
      toast({
        title: "Insufficient Balance",
        description: `You only have ${tokenBalance.balance.toFixed(6)} ${tokenBalance.symbol}.`,
        variant: "destructive"
      })
      return
    }

    setIsPlacingBet(true)

    try {
      // TODO: Implement actual betting API call
      const response = await fetch('/api/bets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          marketId,
          betSide: selectedSide,
          amount: amount,
          tokenMint: requiredTokenMint,
          tokenAmount: amount,
          walletAddress: publicKey?.toString()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to place bet')
      }

      toast({
        title: "Bet Placed Successfully!",
        description: `Your ${selectedSide.toUpperCase()} bet of ${amount} ${tokenBalance.symbol} has been placed.`,
      })

      onBetPlaced()
      onClose()
      setSelectedSide(null)
      setBetAmount('')

    } catch (error) {
      console.error('Error placing bet:', error)
      toast({
        title: "Bet Failed",
        description: "There was an error placing your bet. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsPlacingBet(false)
    }
  }

  const getTokenAcquisitionLink = () => {
    // Return Jupiter or Raydium link for token acquisition
    return `https://jup.ag/swap/SOL-${requiredTokenSymbol}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Place Your Bet</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Market Info */}
          <div className="p-3 bg-muted rounded-lg">
            <h3 className="font-semibold text-sm mb-1">Market</h3>
            <p className="text-sm text-muted-foreground">{marketTitle}</p>
            <div className="mt-2 text-xs text-muted-foreground font-mono bg-background p-2 rounded border">
              Token: {requiredTokenMint}
            </div>
          </div>

          {/* Wallet Status */}
          {!connected ? (
            <Card className="p-4 border-dashed">
              <div className="text-center">
                <Wallet className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <h3 className="font-semibold mb-1">Wallet Required</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Connect your wallet to place a bet on this market.
                </p>
                <Button onClick={() => window.location.reload()} className="w-full">
                  <Wallet className="h-4 w-4 mr-2" />
                  Connect Wallet
                </Button>
              </div>
            </Card>
          ) : !tokenBalance ? (
            <Card className="p-4 border-dashed">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                <h3 className="font-semibold mb-1">Token Required</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  You need {requiredTokenSymbol} tokens to bet on this market.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => window.open(getTokenAcquisitionLink(), '_blank')}
                  className="w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Get {requiredTokenSymbol} Tokens
                </Button>
              </div>
            </Card>
          ) : (
            <>
              {/* Token Balance */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {tokenBalance.logo && (
                      <img src={tokenBalance.logo} alt={tokenBalance.symbol} className="w-6 h-6 rounded-full" />
                    )}
                    <span className="font-semibold">{tokenBalance.symbol} Balance</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    ${tokenBalance.value.toFixed(2)}
                  </span>
                </div>
                <div className="text-2xl font-bold">
                  {tokenBalance.balance.toFixed(6)} {tokenBalance.symbol}
                </div>
              </Card>

              {/* Bet Side Selection */}
              <div className="space-y-2">
                <Label>Choose Your Position</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={selectedSide === 'yes' ? 'default' : 'outline'}
                    onClick={() => handleBetClick('yes')}
                    className="h-12"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    YES
                  </Button>
                  <Button
                    variant={selectedSide === 'no' ? 'default' : 'outline'}
                    onClick={() => handleBetClick('no')}
                    className="h-12"
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    NO
                  </Button>
                </div>
              </div>

              {/* Bet Amount */}
              {selectedSide && (
                <div className="space-y-2">
                  <Label htmlFor="betAmount">Bet Amount ({tokenBalance.symbol})</Label>
                  <Input
                    id="betAmount"
                    type="number"
                    placeholder="0.00"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    min="0"
                    max={tokenBalance.balance}
                    step="0.000001"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBetAmount((tokenBalance.balance * 0.25).toString())}
                    >
                      25%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBetAmount((tokenBalance.balance * 0.5).toString())}
                    >
                      50%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBetAmount((tokenBalance.balance * 0.75).toString())}
                    >
                      75%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBetAmount(tokenBalance.balance.toString())}
                    >
                      MAX
                    </Button>
                  </div>
                </div>
              )}

              {/* Place Bet Button */}
              {selectedSide && betAmount && (
                <Button
                  onClick={handlePlaceBet}
                  disabled={isPlacingBet || parseFloat(betAmount) <= 0}
                  className="w-full"
                  size="lg"
                >
                  {isPlacingBet ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Placing Bet...
                    </>
                  ) : (
                    `Place ${selectedSide.toUpperCase()} Bet`
                  )}
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
