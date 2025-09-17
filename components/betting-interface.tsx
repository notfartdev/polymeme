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
  const { connected, publicKey } = useWallet()
  const { assets, loading: assetsLoading } = useWalletAssets()
  const { toast } = useToast()
  
  const [selectedSide, setSelectedSide] = useState<'yes' | 'no' | null>(null)
  const [betAmount, setBetAmount] = useState('')
  const [usdAmount, setUsdAmount] = useState('')
  const [isPlacingBet, setIsPlacingBet] = useState(false)
  const [tokenBalance, setTokenBalance] = useState<TokenBalance | null>(null)
  const [isCheckingBalance, setIsCheckingBalance] = useState(false)
  const [balanceError, setBalanceError] = useState<string | null>(null)
  const [poolData, setPoolData] = useState<{
    yesPool: { totalTokens: number; totalBets: number }
    noPool: { totalTokens: number; totalBets: number }
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

  // Fetch pool data
  useEffect(() => {
    const fetchPoolData = async () => {
      try {
        const response = await fetch(`/api/markets/${marketId}/pool`)
        if (response.ok) {
          const data = await response.json()
          setPoolData({
            yesPool: data.yesPool,
            noPool: data.noPool
          })
        }
      } catch (error) {
        console.error('Error fetching pool data:', error)
      }
    }

    fetchPoolData()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchPoolData, 30000)
    return () => clearInterval(interval)
  }, [marketId])

  // Convert token amount to USD
  const convertToUSD = (tokenAmount: number) => {
    if (!tokenBalance || tokenBalance.balance === 0) return 0
    const tokenPrice = tokenBalance.value / tokenBalance.balance
    return tokenAmount * tokenPrice
  }

  // Convert USD amount to token amount
  const convertToToken = (usdAmount: number) => {
    if (!tokenBalance || tokenBalance.balance === 0) return 0
    const tokenPrice = tokenBalance.value / tokenBalance.balance
    return usdAmount / tokenPrice
  }

  // Calculate bet outcomes using pool-based system
  const calculateBetOutcome = () => {
    if (!selectedSide || !betAmount || !tokenBalance || !poolData) return null
    
    const betAmountNum = parseFloat(betAmount)
    const betUsdValue = parseFloat(usdAmount) || convertToUSD(betAmountNum)
    
    // Get current pool totals
    const totalPool = poolData.yesPool.totalTokens + poolData.noPool.totalTokens
    const currentOdds = poolData[selectedSide + 'Pool'].totalTokens / totalPool
    
    // Calculate your share of the winning pool
    const yourPoolSide = poolData[selectedSide + 'Pool']
    const yourShare = betAmountNum / (yourPoolSide.totalTokens + betAmountNum)
    
    // Calculate potential winnings (total pool * your share)
    const totalPayout = (totalPool + betAmountNum) * yourShare
    const profit = totalPayout - betUsdValue
    
    return {
      betAmount: betUsdValue,
      odds: currentOdds,
      oddsPercentage: (currentOdds * 100).toFixed(1),
      totalPayout,
      profit,
      totalCost: betUsdValue,
      poolInfo: {
        yesPool: poolData.yesPool.totalTokens,
        noPool: poolData.noPool.totalTokens,
        totalPool,
        yourShare: (yourShare * 100).toFixed(2)
      }
    }
  }

  // Handle token amount change
  const handleTokenAmountChange = (value: string) => {
    setBetAmount(value)
    const tokenAmount = parseFloat(value) || 0
    const usd = convertToUSD(tokenAmount)
    setUsdAmount(usd.toFixed(2))
  }

  // Handle USD amount change
  const handleUsdAmountChange = (value: string) => {
    setUsdAmount(value)
    const usd = parseFloat(value) || 0
    const tokenAmount = convertToToken(usd)
    setBetAmount(tokenAmount.toFixed(4))
  }

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

    // Check token balance before placing bet
    const hasSufficientBalance = await checkTokenBalance()
    if (!hasSufficientBalance) {
      return // Error message already set by checkTokenBalance
    }

    if (amount > tokenBalance.balance) {
      toast({
        title: "Insufficient Balance",
        description: `You only have ${tokenBalance.balance.toFixed(4)} ${tokenBalance.symbol}.`,
        variant: "destructive"
      })
      return
    }

    setIsPlacingBet(true)

    try {
      // Call the betting API
      const response = await fetch('/api/bets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          marketId,
          side: selectedSide,
          amount: amount,
          walletAddress: publicKey?.toString(),
          tokenMint: requiredTokenMint
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
            <div className="flex items-center gap-2 mt-2">
              {requiredTokenLogo && (
                <img src={requiredTokenLogo} alt={requiredTokenSymbol} className="w-4 h-4 rounded-full" />
              )}
              <span className="text-xs text-muted-foreground">
                {requiredTokenSymbol} {requiredTokenName && `(${requiredTokenName})`}
              </span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground font-mono bg-background p-2 rounded border">
              Contract:{" "}
              <a 
                href={`https://solscan.io/token/${requiredTokenMint}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                {requiredTokenMint.slice(0, 8)}...{requiredTokenMint.slice(-8)}
              </a>
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
                  {tokenBalance.balance.toFixed(4)} {tokenBalance.symbol}
                </div>
                <div className="text-sm text-muted-foreground">
                  Current price: ${(tokenBalance.value / tokenBalance.balance).toFixed(4)} per {tokenBalance.symbol}
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
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="betAmount">Bet Amount ({tokenBalance.symbol})</Label>
                    <Input
                      id="betAmount"
                      type="number"
                      placeholder="0.00"
                      value={betAmount}
                      onChange={(e) => handleTokenAmountChange(e.target.value)}
                      min="0"
                      max={tokenBalance.balance}
                      step="0.000001"
                    />
                  </div>

                  {/* USD Converter */}
                  <div className="space-y-1">
                    <Label htmlFor="usdAmount">USD Value</Label>
                    <Input
                      id="usdAmount"
                      type="number"
                      placeholder="0.00"
                      value={usdAmount}
                      onChange={(e) => handleUsdAmountChange(e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  <div className="text-xs text-muted-foreground">
                    {betAmount && usdAmount ? (
                      <span className="font-medium text-foreground">
                        {betAmount} {tokenBalance.symbol} = ${usdAmount}
                      </span>
                    ) : (
                      "Real-time conversion based on current token price"
                    )}
                  </div>
                  </div>

                  {/* Balance Error Display */}
                  {balanceError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <div className="flex items-center">
                        <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                        <span className="text-sm text-red-700">{balanceError}</span>
                      </div>
                    </div>
                  )}

                  {/* Percentage Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const amount = (tokenBalance.balance * 0.25).toString()
                        handleTokenAmountChange(amount)
                      }}
                    >
                      25%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const amount = (tokenBalance.balance * 0.5).toString()
                        handleTokenAmountChange(amount)
                      }}
                    >
                      50%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const amount = (tokenBalance.balance * 0.75).toString()
                        handleTokenAmountChange(amount)
                      }}
                    >
                      75%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const amount = tokenBalance.balance.toString()
                        handleTokenAmountChange(amount)
                      }}
                    >
                      MAX
                    </Button>
                  </div>

                  {/* Bet Outcome Calculations - Pool Based */}
                  {(() => {
                    const outcome = calculateBetOutcome()
                    if (!outcome) return null
                    
                    return (
                      <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Odds:</span>
                            <div className="font-semibold">{outcome.oddsPercentage}%</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Cost:</span>
                            <div className="font-semibold">${outcome.totalCost.toFixed(2)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Payout:</span>
                            <div className="font-semibold text-green-600">${outcome.totalPayout.toFixed(2)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Profit:</span>
                            <div className="font-semibold text-green-600">+${outcome.profit.toFixed(2)}</div>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-muted/50">
                          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <div>
                              <span>YES Pool:</span>
                              <div className="font-medium text-green-600">{outcome.poolInfo.yesPool.toFixed(1)} {poolData?.tokenSymbol || 'SOL'}</div>
                            </div>
                            <div>
                              <span>NO Pool:</span>
                              <div className="font-medium text-red-600">{outcome.poolInfo.noPool.toFixed(1)} {poolData?.tokenSymbol || 'SOL'}</div>
                            </div>
                            <div>
                              <span>Total Pool:</span>
                              <div className="font-medium">{outcome.poolInfo.totalPool.toFixed(1)} {poolData?.tokenSymbol || 'SOL'}</div>
                            </div>
                            <div>
                              <span>Your Share:</span>
                              <div className="font-medium">{outcome.poolInfo.yourShare}%</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
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
