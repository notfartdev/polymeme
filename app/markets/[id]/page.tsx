"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  ArrowLeft,
  Calendar,
  Share2,
  Bookmark,
  TrendingUp,
  Minus,
  Plus,
  Info,
  CheckCircle,
  ChevronDown,
  Clock,
  Users,
  Hash,
} from "lucide-react"
import Link from "next/link"
import Header from "@/components/header"
import { format } from "date-fns"
import { useI18n } from "@/lib/i18n"
import { useToast } from "@/hooks/use-toast"
import { BettingInterface } from "@/components/betting-interface"
import { RealtimeTokenChart } from "@/components/realtime-token-chart"
import { TokenNews } from "@/components/token-news"
import { OrderBook } from "@/components/order-book"
import { MarketRules } from "@/components/market-rules"
import { useWallet } from '@solana/wallet-adapter-react'

// Market data interface
interface MarketData {
  id: string
  asset: string
  questionType: string
  question: string
  description: string
  closingDate: string
  createdAt: string
  status: 'active' | 'pending' | 'closed'
  creator: string
  tokenMint?: string
  tokenSymbol?: string
  tokenName?: string
  tokenLogo?: string
  multipleChoiceOptions?: string[]
  minValue?: string
  maxValue?: string
  unit?: string
  earliestDate?: string
  latestDate?: string
  totalYesBets?: number
  totalNoBets?: number
  totalVolume?: number
  // Comprehensive market rules
  resolutionCriteria?: string
  dataSources?: string
  edgeCases?: string
  disputeResolution?: string
  marketContext?: string
  tokenContext?: string
  historicalContext?: string
  liquidityContext?: string
  confidenceScore?: number
  questionTypeDetailed?: string
  // Resolution fields
  resolution?: 'yes' | 'no' | 'disputed'
  resolutionData?: any
  resolvedAt?: string
  disputeReason?: string
}

export default function MarketDetailPage() {
  const { t } = useI18n()
  const { toast } = useToast()
  const { connected } = useWallet()
  const params = useParams()
  const marketId = params.id as string
  
  const [market, setMarket] = useState<MarketData | null>(null)
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState("")
  const [tradingMode, setTradingMode] = useState<"buy" | "sell">("buy")
  const [orderType, setOrderType] = useState<"market" | "limit">("market")
  const [selectedOutcome, setSelectedOutcome] = useState<"yes" | "no">("yes")
  const [limitPrice, setLimitPrice] = useState("")
  const [shares, setShares] = useState(0)
  const [isBettingOpen, setIsBettingOpen] = useState(false)
  const [selectedBetSide, setSelectedBetSide] = useState<'yes' | 'no' | null>(null)
  const [isBookmarked, setIsBookmarked] = useState(false)

  // Fetch market data function
  const fetchMarket = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/markets/${marketId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: "Market not found",
            description: "The market you're looking for doesn't exist.",
            variant: "destructive"
          })
        } else {
          throw new Error('Failed to fetch market')
        }
        return
      }
      
      const marketData = await response.json()
      setMarket(marketData)
    } catch (error) {
      console.error('Error fetching market:', error)
      toast({
        title: "Error",
        description: "Failed to load market data. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch market data on component mount
  useEffect(() => {
    if (marketId) {
      fetchMarket()
    }
  }, [marketId, toast])

  // Check bookmark state on load
  useEffect(() => {
    if (market?.id) {
      const bookmarkData = localStorage.getItem(`bookmark-${market.id}`)
      setIsBookmarked(!!bookmarkData)
    }
  }, [market?.id])

  // Handle bet button clicks
  const handleBetClick = (side: 'yes' | 'no') => {
    if (!connected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to place a bet.",
        variant: "destructive"
      })
      return
    }

    setSelectedBetSide(side)
    setIsBettingOpen(true)
  }

  // Handle bet placement completion
  const handleBetPlaced = () => {
    // Refresh market data to show updated betting stats
    fetchMarket()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading market...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!market) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Market not found</h1>
            <p className="text-muted-foreground mb-6">The market you're looking for doesn't exist or has been removed.</p>
            <Link href="/markets">
              <Button>Back to Markets</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Calculate percentages for betting interface
  const totalBets = (market?.totalYesBets || 0) + (market?.totalNoBets || 0)
  let mainPercentage = 50 // Default 50/50
  if (totalBets > 0) {
    mainPercentage = Math.round(((market?.totalYesBets || 0) / totalBets) * 100)
  }
  const oppositePercentage = 100 - mainPercentage

  const currentPrice = selectedOutcome === "yes" ? mainPercentage : oppositePercentage
  const amountValue = Number.parseFloat(amount) || 0
  const limitPriceValue = Number.parseFloat(limitPrice) || currentPrice
  const totalCost = orderType === "market" ? (amountValue * currentPrice) / 100 : (shares * limitPriceValue) / 100
  const potentialWin = orderType === "market" ? amountValue - totalCost : shares - (shares * limitPriceValue) / 100

  // Format closing date
  const closingDate = new Date(market.closingDate)
  const formattedClosingDate = format(closingDate, "MMM dd, yyyy 'at' p 'UTC'")
  

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-6">
        {/* Back button */}
        <Link
          href="/markets"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Markets
        </Link>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="xl:col-span-2 space-y-6">
            {/* Market Header */}
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="flex items-start gap-4 flex-1">
                {market.tokenLogo ? (
                  <img 
                    src={market.tokenLogo} 
                    alt={market.tokenSymbol || market.asset} 
                    className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                    onError={(e) => {
                      // Fallback to gradient if image fails to load
                      e.currentTarget.style.display = 'none'
                      e.currentTarget.nextElementSibling?.classList.remove('hidden')
                    }}
                  />
                ) : null}
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 ${market.tokenLogo ? 'hidden' : ''}`}>
                  <Hash className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      {market.asset}
                    </span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      {market.status.toUpperCase()}
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2 break-words">{market.question}</h1>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span className="break-words">Closes {formattedClosingDate}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4 flex-shrink-0" />
                      <span>Created by{" "}</span>
                      <a 
                        href={`https://solscan.io/account/${market.creator}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline font-mono text-xs break-all"
                      >
                        {market.creator.slice(0, 8)}...{market.creator.slice(-8)}
                      </a>
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    const marketUrl = window.location.href
                    const shareText = `Check out this prediction market: "${market.question}"`
                    
                    // Try to open X (Twitter) share dialog
                    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(marketUrl)}`
                    window.open(twitterUrl, '_blank', 'width=550,height=420')
                    
                    // Also copy to clipboard as fallback
                    navigator.clipboard.writeText(marketUrl)
                    console.log('Market shared on X and URL copied to clipboard:', marketUrl)
                  }}
                  title="Share on X (Twitter)"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    // Toggle bookmark state
                    if (isBookmarked) {
                      localStorage.removeItem(`bookmark-${market.id}`)
                      setIsBookmarked(false)
                      console.log('Market removed from bookmarks')
                    } else {
                      localStorage.setItem(`bookmark-${market.id}`, JSON.stringify({
                        marketId: market.id,
                        title: market.question,
                        createdAt: new Date().toISOString()
                      }))
                      setIsBookmarked(true)
                      console.log('Market added to bookmarks')
                    }
                  }}
                  title={isBookmarked ? "Remove bookmark" : "Bookmark market"}
                >
                  <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
                </Button>
              </div>
            </div>


            {/* Real-time Token Price Chart */}
            <RealtimeTokenChart 
              tokenSymbol={market.tokenSymbol || "SOL"}
              tokenName={market.tokenName}
              tokenLogo={market.tokenLogo}
            />



            {/* Comprehensive Market Details */}
            <Card className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  Market Details
                  <Info className="h-4 w-4 text-muted-foreground" />
                </h3>
              </div>

              <p className="text-muted-foreground leading-relaxed mb-6">{market.description}</p>

              {/* Market Insights Summary */}
              {(market.marketContext || market.tokenContext || market.historicalContext || market.liquidityContext) && (
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Market Insights Summary
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {market.marketContext && (
                      <div>
                        <span className="font-medium text-blue-700">Market Conditions:</span>
                        <p className="text-blue-600 mt-1">{market.marketContext}</p>
                      </div>
                    )}
                    {market.tokenContext && (
                      <div>
                        <span className="font-medium text-green-700">Token Profile:</span>
                        <p className="text-green-600 mt-1">{market.tokenContext}</p>
                      </div>
                    )}
                    {market.historicalContext && (
                      <div>
                        <span className="font-medium text-purple-700">Recent Performance:</span>
                        <p className="text-purple-600 mt-1">{market.historicalContext}</p>
                      </div>
                    )}
                    {market.liquidityContext && (
                      <div>
                        <span className="font-medium text-orange-700">Liquidity Analysis:</span>
                        <p className="text-orange-600 mt-1">{market.liquidityContext}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Comprehensive Market Rules */}
              {market.resolutionCriteria && (
                <div className="space-y-6">
                  {/* Market Context - Show this prominently first */}
                  {market.marketContext && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Market Context
                      </h4>
                      <p className="text-sm text-blue-800 leading-relaxed">{market.marketContext}</p>
                    </div>
                  )}

                  {/* Token Analysis */}
                  {market.tokenContext && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        Token Analysis
                      </h4>
                      <p className="text-sm text-green-800 leading-relaxed">{market.tokenContext}</p>
                    </div>
                  )}

                  {/* Historical Performance */}
                  {market.historicalContext && (
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Historical Performance
                      </h4>
                      <p className="text-sm text-purple-800 leading-relaxed">{market.historicalContext}</p>
                    </div>
                  )}

                  {/* Liquidity Impact */}
                  {market.liquidityContext && (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Liquidity Impact
                      </h4>
                      <p className="text-sm text-orange-800 leading-relaxed">{market.liquidityContext}</p>
                    </div>
                  )}

                  {/* Resolution Criteria */}
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Resolution Criteria
                    </h4>
                    <p className="text-sm text-gray-800 leading-relaxed">{market.resolutionCriteria}</p>
                  </div>

                  {/* Data Sources */}
                  {market.dataSources && (
                    <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                      <h4 className="font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Data Sources
                      </h4>
                      <p className="text-sm text-indigo-800 leading-relaxed">{market.dataSources}</p>
                    </div>
                  )}

                  {/* Edge Cases */}
                  {market.edgeCases && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Edge Cases & Exceptions
                      </h4>
                      <p className="text-sm text-yellow-800 leading-relaxed">{market.edgeCases}</p>
                    </div>
                  )}

                  {/* Dispute Resolution */}
                  {market.disputeResolution && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Dispute Resolution
                      </h4>
                      <p className="text-sm text-red-800 leading-relaxed">{market.disputeResolution}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Market Resolution Status */}
              {market.status === 'closed' && market.resolution && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h4 className="font-semibold text-green-900">Market Resolved</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Resolution:</strong> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                        market.resolution === 'yes' 
                          ? 'bg-green-100 text-green-800' 
                          : market.resolution === 'no'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {market.resolution.toUpperCase()}
                      </span>
                    </div>
                    {market.resolvedAt && (
                      <div><strong>Resolved:</strong> {format(new Date(market.resolvedAt), "MMM dd, yyyy 'at' p 'UTC'")}</div>
                    )}
                    {market.disputeReason && (
                      <div className="text-yellow-700"><strong>Note:</strong> {market.disputeReason}</div>
                    )}
                  </div>
                </div>
              )}


              {/* Token Requirements */}
              <Card className="p-4 bg-blue-50 border-blue-200 mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Hash className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900">Betting Token Required</h3>
                    <p className="text-sm text-blue-700">You need this token to place bets on this market</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {market.tokenLogo && (
                      <img src={market.tokenLogo} alt={market.tokenSymbol} className="w-6 h-6 rounded-full" />
                    )}
                    <span className="font-medium">{market.tokenSymbol || "SOL"}</span>
                    <span className="text-muted-foreground">({market.tokenName || "Solana"})</span>
                  </div>
                  {market.tokenMint && (
                    <div className="text-xs text-muted-foreground font-mono bg-white p-2 rounded border">
                      Contract:{" "}
                      <a 
                        href={`https://solscan.io/token/${market.tokenMint}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {market.tokenMint.slice(0, 8)}...{market.tokenMint.slice(-8)}
                      </a>
                    </div>
                  )}
                </div>
              </Card>

            {/* Detailed Market Rules */}
            <div id="market-rules">
              <MarketRules
                question={market.question}
                tokenSymbol={market.tokenSymbol || "SOL"}
                timeframe={market.question.includes('1H') ? '1H' :
                          market.question.includes('3H') ? '3H' :
                          market.question.includes('6H') ? '6H' :
                          market.question.includes('12H') ? '12H' :
                          market.question.includes('24H') ? '24H' : undefined}
                tokenData={null} // TODO: Add real token data
              />
            </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="outline" 
                  className="text-green-600 border-green-200 hover:bg-green-50 bg-transparent"
                  onClick={() => {
                    // Scroll to market rules section
                    const rulesSection = document.getElementById('market-rules')
                    if (rulesSection) {
                      rulesSection.scrollIntoView({ behavior: 'smooth' })
                    }
                  }}
                >
                  View full rules
                </Button>
                <Button 
                  variant="outline" 
                  className="text-green-600 border-green-200 hover:bg-green-50 bg-transparent"
                  onClick={() => {
                    // Open help center modal or redirect
                    window.open('https://docs.predictionmarket.com/help', '_blank')
                  }}
                >
                  Help center
                </Button>
              </div>
            </Card>

            {/* Timeline and payout section */}
            <Card className="p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-6">
                <Calendar className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Timeline and payout</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Market open</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(market.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        timeZoneName: 'short'
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full border-2 border-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">Market closes</div>
                    <div className="text-sm text-muted-foreground">{formattedClosingDate}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full border-2 border-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">Projected payout</div>
                    <div className="text-sm text-muted-foreground">1 hour after closing</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Market will close at the specified closing time. Resolution occurs within 1 hour of market close.
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="break-all">
                    <strong>Market ID:</strong> {market.id}
                  </span>
                  <span>
                    <strong>Created:</strong> {new Date(market.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Trading Panel */}
          <div className="space-y-4">
            <Card className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                {market.tokenLogo ? (
                  <img 
                    src={market.tokenLogo} 
                    alt={market.tokenSymbol || market.asset} 
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      e.currentTarget.nextElementSibling?.classList.remove('hidden')
                    }}
                  />
                ) : null}
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 ${market.tokenLogo ? 'hidden' : ''}`}>
                  <Hash className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">{market.asset}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {market.questionTypeDetailed ? market.questionTypeDetailed.replace('_', ' ') : 'Prediction Market'}
                  </div>
                </div>
              </div>


              <div className="grid grid-cols-2 gap-3 mb-4">
                <Button
                  size="lg"
                  className={`h-12 sm:h-14 text-base sm:text-lg font-semibold ${
                    selectedOutcome === "yes"
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-green-100 hover:bg-green-200 text-green-700 border-green-200"
                  }`}
                  onClick={() => {
                    setSelectedOutcome("yes")
                    handleBetClick("yes")
                  }}
                >
                  Yes
                </Button>
                <Button
                  size="lg"
                  className={`h-12 sm:h-14 text-base sm:text-lg font-semibold ${
                    selectedOutcome === "no"
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-red-100 hover:bg-red-200 text-red-700 border-red-200"
                  }`}
                  onClick={() => {
                    setSelectedOutcome("no")
                    handleBetClick("no")
                  }}
                >
                  No
                </Button>
              </div>

              <div className="space-y-4">
                {orderType === "limit" && (
                  <div>
                    <label className="text-sm font-medium">Limit Price</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setLimitPrice(Math.max(0, (Number.parseFloat(limitPrice) || currentPrice) - 1).toString())
                        }
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        placeholder={`${currentPrice}%`}
                        value={limitPrice}
                        onChange={(e) => setLimitPrice(e.target.value)}
                        className="text-center font-semibold"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setLimitPrice(Math.min(100, (Number.parseFloat(limitPrice) || currentPrice) + 1).toString())
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}

                {orderType === "limit" ? (
                  <div>
                    <label className="text-sm font-medium">Shares</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Button size="sm" variant="outline" onClick={() => setShares(Math.max(0, shares - 10))}>
                        -10
                      </Button>
                      <Input
                        placeholder="0"
                        value={shares}
                        onChange={(e) => setShares(Number.parseInt(e.target.value) || 0)}
                        className="text-2xl font-bold text-center"
                        type="number"
                      />
                      <Button size="sm" variant="outline" onClick={() => setShares(shares + 10)}>
                        +10
                      </Button>
                    </div>
                  </div>
                ) : null}

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    How to Place a Bet
                  </h4>
                  <div className="space-y-2 text-sm text-blue-800">
                    <div className="flex items-start gap-2">
                      <span className="font-medium">1.</span>
                      <span>Click <strong>Yes</strong> or <strong>No</strong> to choose your position</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium">2.</span>
                      <span>Enter your bet amount in the input field</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium">3.</span>
                      <span>Review your bet details in the popup modal</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium">4.</span>
                      <span>Click <strong>Place Bet</strong> to confirm your position</span>
                    </div>
                  </div>
                  <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-700">
                    <strong>Note:</strong> You need {market.tokenSymbol || "SOL"} tokens in your wallet to place bets. 
                    The modal will show detailed calculations including odds, potential winnings, and pool information.
                  </div>
                </div>

              </div>
            </Card>

            {/* Order Book */}
            <OrderBook marketId={market.id} />

            {/* News Section */}
            {(() => {
              const newsTokenSymbol = market.tokenSymbol || market.asset || "SOL"
              const newsTokenName = market.tokenName || market.asset || "Solana"
              console.log('🔍 Market Data Debug:', {
                tokenSymbol: market.tokenSymbol,
                tokenName: market.tokenName,
                asset: market.asset,
                finalTokenSymbol: newsTokenSymbol,
                finalTokenName: newsTokenName
              })
              return (
                <TokenNews 
                  tokenSymbol={newsTokenSymbol} 
                  tokenName={newsTokenName} 
                />
              )
            })()}
          </div>
        </div>
      </div>

      {/* Betting Interface Modal */}
      {market && (
        <BettingInterface
          marketId={market.id}
          marketTitle={market.question}
          requiredTokenMint={market.tokenMint || "So11111111111111111111111111111111111111112"} // Default to SOL
          requiredTokenSymbol={market.tokenSymbol || "SOL"}
          requiredTokenName={market.tokenName}
          requiredTokenLogo={market.tokenLogo}
          isOpen={isBettingOpen}
          onClose={() => {
            setIsBettingOpen(false)
            setSelectedBetSide(null)
          }}
          onBetPlaced={handleBetPlaced}
        />
      )}
    </div>
  )
}
