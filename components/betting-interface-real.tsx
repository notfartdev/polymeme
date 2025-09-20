"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Wallet, AlertCircle, CheckCircle, ExternalLink, RefreshCw, Loader2 } from "lucide-react"
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletAssets } from '@/hooks/use-wallet-assets'
import { useToast } from '@/hooks/use-toast'
import { smartContractService, SMART_CONTRACT_CONFIG } from '@/lib/smart-contract-real'
import { PublicKey } from '@solana/web3.js'

interface BettingInterfaceProps {
  marketId: string
  marketTitle: string
  requiredTokenMint: string
  requiredTokenSymbol: string
  requiredTokenName?: string
  requiredTokenLogo?: string
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

interface PoolData {
  yesPool: { totalTokens: number; totalBets: number }
  noPool: { totalTokens: number; totalBets: number }
}

export function BettingInterface({
  marketId,
  marketTitle,
  requiredTokenMint,
  requiredTokenSymbol,
  requiredTokenName,
  requiredTokenLogo,
  isOpen,
  onClose,
  onBetPlaced
}: BettingInterfaceProps) {
  const { connected, publicKey, signTransaction, signAllTransactions } = useWallet()
  const { assets, loading: assetsLoading } = useWalletAssets()
  const { toast } = useToast()
  
  const [selectedSide, setSelectedSide] = useState<'yes' | 'no' | null>(null)
  const [betAmount, setBetAmount] = useState('')
  const [usdAmount, setUsdAmount] = useState('')
  const [isPlacingBet, setIsPlacingBet] = useState(false)
  const [tokenBalance, setTokenBalance] = useState<TokenBalance | null>(null)
  const [isCheckingBalance, setIsCheckingBalance] = useState(false)
  const [balanceError, setBalanceError] = useState<string | null>(null)
  const [poolData, setPoolData] = useState<PoolData | null>(null)
  const [marketState, setMarketState] = useState<'OPEN' | 'CLOSED' | 'RESOLVED' | 'INVALID'>('OPEN')
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  } | null>(null)
  const [userPosition, setUserPosition] = useState<{
    yesAmount: number
    noAmount: number
  } | null>(null)

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

  // Fetch market data and pool data with real-time updates
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        // Fetch market data for closing time
        const marketResponse = await fetch(`/api/markets/${marketId}`)
        if (marketResponse.ok) {
          const marketData = await marketResponse.json()
          const closingTime = new Date(marketData.closingDate).getTime()
          const now = Date.now()
          
          // Update market state based on time
          if (now >= closingTime) {
            setMarketState('CLOSED')
          } else {
            setMarketState('OPEN')
          }
        }

        // Fetch pool data from smart contract
        if (publicKey) {
          const poolData = await smartContractService.fetchPoolData(parseInt(marketId), requiredTokenSymbol)
          setPoolData({
            yesPool: poolData.yesPool,
            noPool: poolData.noPool
          })

          // Fetch user position
          const position = await smartContractService.fetchUserPosition(parseInt(marketId), publicKey)
          if (position) {
            setUserPosition({
              yesAmount: position.yesAmount,
              noAmount: position.noAmount
            })
          }
        }
      } catch (error) {
        console.error('Error fetching market data:', error)
      }
    }

    // Initial fetch
    fetchMarketData()
    
    // Real-time updates every 5 seconds
    const interval = setInterval(fetchMarketData, 5000)
    return () => clearInterval(interval)
  }, [marketId, publicKey, requiredTokenSymbol])

  // Countdown timer
  useEffect(() => {
    const updateCountdown = async () => {
      try {
        const response = await fetch(`/api/markets/${marketId}`)
        if (response.ok) {
          const marketData = await response.json()
          const closingTime = new Date(marketData.closingDate).getTime()
          const now = Date.now()
          const diff = closingTime - now

          if (diff > 0) {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24))
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
            const seconds = Math.floor((diff % (1000 * 60)) / 1000)

            setTimeRemaining({ days, hours, minutes, seconds })
          } else {
            setTimeRemaining(null)
          }
        }
      } catch (error) {
        console.error('Error updating countdown:', error)
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [marketId])

  // Check token balance before betting
  const checkTokenBalance = async () => {
    if (!publicKey || !requiredTokenMint) return false

    setIsCheckingBalance(true)
    setBalanceError(null)

    try {
      const response = await fetch('/api/tokens/balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          tokenMint: requiredTokenMint
        })
      })

      if (!response.ok) {
        throw new Error('Failed to check token balance')
      }

      const data = await response.json()
      
      if (!data.hasBalance) {
        setBalanceError(`You don't have any ${requiredTokenSymbol} tokens in your wallet`)
        return false
      }

      if (!data.sufficientForBet) {
        setBalanceError(`Insufficient ${requiredTokenSymbol} balance. Please ensure you have enough tokens for your bet.`)
        return false
      }

      return true
    } catch (error) {
      console.error('Error checking token balance:', error)
      setBalanceError('Failed to verify token balance')
      return false
    } finally {
      setIsCheckingBalance(false)
    }
  }

  // Place bet using smart contract
  const placeBet = async () => {
    if (!connected || !publicKey || !selectedSide || !betAmount) {
      toast({
        title: "Missing Information",
        description: "Please connect your wallet and select a bet amount and side.",
        variant: "destructive"
      })
      return
    }

    if (!tokenBalance) {
      toast({
        title: "Token Not Found",
        description: `You don't have any ${requiredTokenSymbol} tokens in your wallet.`,
        variant: "destructive"
      })
      return
    }

    const amount = parseFloat(betAmount)
    if (amount <= 0 || amount > tokenBalance.balance) {
      toast({
        title: "Invalid Amount",
        description: `Please enter a valid amount between 0 and ${tokenBalance.balance} ${requiredTokenSymbol}.`,
        variant: "destructive"
      })
      return
    }

    setIsPlacingBet(true)

    try {
      // Create wallet adapter for smart contract
      const wallet = {
        publicKey,
        signTransaction: signTransaction!,
        signAllTransactions: signAllTransactions!
      }

      // Convert amount to token decimals (assuming 6 decimals for most SPL tokens)
      const tokenAmount = Math.floor(amount * Math.pow(10, 6))

      // Place bet using smart contract
      const result = await smartContractService.placeBet(
        wallet,
        parseInt(marketId),
        tokenAmount,
        selectedSide
      )

      if (result.success) {
        toast({
          title: "Bet Placed Successfully!",
          description: `Your ${amount} ${requiredTokenSymbol} bet on ${selectedSide.toUpperCase()} has been placed.`,
        })

        // Clear form
        setBetAmount('')
        setUsdAmount('')
        setSelectedSide(null)
        
        // Refresh data
        onBetPlaced()
        
        // Close dialog
        onClose()
      } else {
        throw new Error('Bet placement failed')
      }
    } catch (error) {
      console.error('Error placing bet:', error)
      toast({
        title: "Bet Failed",
        description: error instanceof Error ? error.message : "Failed to place bet. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsPlacingBet(false)
    }
  }

  // Calculate current odds
  const calculateOdds = () => {
    if (!poolData) return { yes: 0.5, no: 0.5 }
    
    const totalPool = poolData.yesPool.totalTokens + poolData.noPool.totalTokens
    if (totalPool === 0) return { yes: 0.5, no: 0.5 }
    
    return {
      yes: poolData.yesPool.totalTokens / totalPool,
      no: poolData.noPool.totalTokens / totalPool
    }
  }

  const odds = calculateOdds()

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            Place Your Bet
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Market Info */}
          <div className="text-center">
            <h3 className="font-semibold text-lg mb-2">{marketTitle}</h3>
            <p className="text-sm text-muted-foreground">
              Required Token: {requiredTokenSymbol} ({requiredTokenName})
            </p>
          </div>

          {/* Wallet Connection Status */}
          {!connected ? (
            <div className="flex items-center justify-center p-4 border-2 border-dashed border-muted rounded-lg">
              <div className="text-center">
                <Wallet className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Connect your wallet to place bets</p>
              </div>
            </div>
          ) : (
            <>
              {/* Token Balance */}
              {tokenBalance ? (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    {requiredTokenLogo && (
                      <img src={requiredTokenLogo} alt={requiredTokenSymbol} className="w-6 h-6 rounded-full" />
                    )}
                    <span className="font-medium">{requiredTokenSymbol}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{tokenBalance.balance.toFixed(4)}</div>
                    <div className="text-xs text-muted-foreground">
                      ${tokenBalance.value.toFixed(2)} USD
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center p-4 border-2 border-dashed border-red-200 rounded-lg">
                  <div className="text-center">
                    <AlertCircle className="w-6 h-6 mx-auto mb-2 text-red-500" />
                    <p className="text-sm text-red-600">
                      You don't have any {requiredTokenSymbol} tokens
                    </p>
                  </div>
                </div>
              )}

              {/* Current Odds */}
              {poolData && (
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {(odds.yes * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">YES</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {poolData.yesPool.totalTokens.toFixed(2)} {requiredTokenSymbol}
                    </div>
                  </Card>
                  <Card className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {(odds.no * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">NO</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {poolData.noPool.totalTokens.toFixed(2)} {requiredTokenSymbol}
                    </div>
                  </Card>
                </div>
              )}

              {/* User Position */}
              {userPosition && (userPosition.yesAmount > 0 || userPosition.noAmount > 0) && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Your Position</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">YES:</span> {userPosition.yesAmount.toFixed(4)} {requiredTokenSymbol}
                    </div>
                    <div>
                      <span className="text-blue-700">NO:</span> {userPosition.noAmount.toFixed(4)} {requiredTokenSymbol}
                    </div>
                  </div>
                </div>
              )}

              {/* Bet Side Selection */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Choose Your Side</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={selectedSide === 'yes' ? 'default' : 'outline'}
                    className={`h-12 ${selectedSide === 'yes' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                    onClick={() => setSelectedSide('yes')}
                  >
                    YES
                    <div className="text-xs opacity-75 ml-1">
                      {(odds.yes * 100).toFixed(1)}%
                    </div>
                  </Button>
                  <Button
                    variant={selectedSide === 'no' ? 'default' : 'outline'}
                    className={`h-12 ${selectedSide === 'no' ? 'bg-red-600 hover:bg-red-700' : ''}`}
                    onClick={() => setSelectedSide('no')}
                  >
                    NO
                    <div className="text-xs opacity-75 ml-1">
                      {(odds.no * 100).toFixed(1)}%
                    </div>
                  </Button>
                </div>
              </div>

              {/* Bet Amount */}
              <div className="space-y-3">
                <Label htmlFor="betAmount" className="text-base font-medium">
                  Bet Amount ({requiredTokenSymbol})
                </Label>
                <Input
                  id="betAmount"
                  type="number"
                  placeholder="0.00"
                  value={betAmount}
                  onChange={(e) => {
                    setBetAmount(e.target.value)
                    // Calculate USD value (simplified)
                    const amount = parseFloat(e.target.value) || 0
                    setUsdAmount((amount * (tokenBalance?.value || 0) / (tokenBalance?.balance || 1)).toFixed(2))
                  }}
                  min="0"
                  max={tokenBalance?.balance || 0}
                  step="0.0001"
                />
                {usdAmount && (
                  <p className="text-sm text-muted-foreground">
                    ≈ ${usdAmount} USD
                  </p>
                )}
              </div>

              {/* Market Status */}
              <div className="text-center">
                {marketState === 'OPEN' && timeRemaining ? (
                  <div className="text-sm text-muted-foreground">
                    Market closes in: {timeRemaining.days}d {timeRemaining.hours}h {timeRemaining.minutes}m
                  </div>
                ) : marketState === 'CLOSED' ? (
                  <div className="text-sm text-red-600 font-medium">
                    Market is closed
                  </div>
                ) : null}
              </div>

              {/* Place Bet Button */}
              <Button
                onClick={placeBet}
                disabled={!selectedSide || !betAmount || isPlacingBet || marketState !== 'OPEN' || !tokenBalance}
                className="w-full h-12 text-lg"
              >
                {isPlacingBet ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Placing Bet...
                  </>
                ) : (
                  `Place ${selectedSide?.toUpperCase()} Bet`
                )}
              </Button>

              {/* Balance Error */}
              {balanceError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <p className="text-sm text-red-600">{balanceError}</p>
                </div>
              )}

              {/* Smart Contract Status */}
              <div className="text-center text-xs text-muted-foreground">
                <div className="flex items-center justify-center gap-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  Smart Contract: {SMART_CONTRACT_CONFIG.PROGRAM_ID.toString().slice(0, 8)}...
                </div>
                <div>Network: {SMART_CONTRACT_CONFIG.RPC_URL.includes('devnet') ? 'Devnet' : 'Localnet'}</div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
