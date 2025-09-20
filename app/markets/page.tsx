"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { TrendingUp, Hash, Clock, Users, Heart, CheckCircle } from "lucide-react"
import Header from "@/components/header"
import Link from "next/link"
import { useI18n } from "@/lib/i18n"
import { format } from "date-fns"
import { CoinGeckoAPI, TokenData } from "@/lib/coingecko"

const categories = ["Active", "Completed"] // Active and completed markets
const tokenFilters = ["All", "WIF", "SOL", "ETH", "BTC", "PEPE", "PUMP", "SHIBA", "TROLL"] // Token filters

// Interface for real market data
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
  multipleChoiceOptions?: string[]
  minValue?: string
  maxValue?: string
  unit?: string
  earliestDate?: string
  latestDate?: string
  totalYesBets?: number
  totalNoBets?: number
  totalVolume?: number
  resolution?: 'yes' | 'no' | 'disputed'
}

// Mock markets for demo (will be replaced by real data)
// No more mock markets - only real markets from database
const mockMarkets: any[] = []

export default function MarketsPage() {
  const { t } = useI18n()
  const [selectedCategory, setSelectedCategory] = useState("Active")
  const [selectedToken, setSelectedToken] = useState("All")
  const [realMarkets, setRealMarkets] = useState<MarketData[]>([])
  const [loading, setLoading] = useState(true)
  const [tokenImages, setTokenImages] = useState<Record<string, string>>({})

  // Fetch real markets from API
  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/markets')
        if (response.ok) {
          const markets = await response.json()
          setRealMarkets(markets)
          
          // Fetch token images for crypto markets
          const cryptoAssets = [...new Set(markets.map(m => m.asset).filter(Boolean))]
          if (cryptoAssets.length > 0) {
            const tokenData = await CoinGeckoAPI.getMultipleTokensData(cryptoAssets)
            const images: Record<string, string> = {}
            Object.entries(tokenData).forEach(([symbol, data]) => {
              if (data.image) {
                images[symbol] = data.image
              }
            })
            setTokenImages(images)
          }
        }
      } catch (error) {
        console.error('Error fetching markets:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMarkets()
  }, [])

  // Only show real markets from database
  const allMarkets = realMarkets.map((market, index) => {
    // Calculate real percentage from bet data
    const totalYes = market.totalYesBets || 0
    const totalNo = market.totalNoBets || 0
    const totalBets = totalYes + totalNo
    
    // Calculate percentage based on real bet data, fallback to 50% if no bets
    const realPercentage = totalBets > 0 ? Math.round((totalYes / totalBets) * 100) : 50
    
    // Format real volume
    const realVolume = market.totalVolume ? `$${(market.totalVolume / 1000).toFixed(1)}k` : "$0"

    return {
      id: market.id,
      question: market.question,
      category: "Crypto", // All user-created markets are crypto for now
      image: null,
      percentage: realPercentage,
      volume: realVolume,
      asset: market.asset,
      status: market.status,
      closingDate: market.closingDate,
      creator: market.creator,
      isReal: true,
      totalYesBets: totalYes,
      resolution: market.resolution,
      totalNoBets: totalNo,
      totalBets: totalBets
    }
  })

  const filteredMarkets = allMarkets.filter((market) => {
    // Filter by active/completed status
    const now = new Date()
    const closingDate = new Date(market.closingDate)
    const isActive = closingDate.getTime() > now.getTime()
    
    let matchesCategory = true
    if (selectedCategory === "Active") {
      matchesCategory = isActive
    } else if (selectedCategory === "Completed") {
      matchesCategory = !isActive
    }
    
    // Filter by token type
    const matchesToken = selectedToken === "All" || market.asset === selectedToken
    
    // If a specific token is selected, show both active and completed for that token
    if (selectedToken !== "All") {
      return matchesToken // Show all markets for the selected token
    }
    
    return matchesCategory && matchesToken
  })

  // Sort markets by closing date
  const sortedMarkets = filteredMarkets.sort((a, b) => {
    const now = new Date()
    const closingDateA = new Date(a.closingDate)
    const closingDateB = new Date(b.closingDate)
    
    // Check if markets are active or completed
    const isActiveA = closingDateA.getTime() > now.getTime()
    const isActiveB = closingDateB.getTime() > now.getTime()
    
    // If both are active, sort by closing date (soonest first)
    if (isActiveA && isActiveB) {
      return closingDateA.getTime() - closingDateB.getTime()
    }
    
    // If both are completed, sort by closing date (most recent first)
    if (!isActiveA && !isActiveB) {
      return closingDateB.getTime() - closingDateA.getTime()
    }
    
    // If one is active and one is completed, active comes first
    if (isActiveA && !isActiveB) return -1
    if (!isActiveA && isActiveB) return 1
    
    return 0
  })

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Markets Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-foreground">{t("markets_heading")}</h1>
          </div>

          {/* Category Navigation */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "ghost"}
                onClick={() => setSelectedCategory(category)}
                className="whitespace-nowrap"
              >
                {category === "Trending" && <TrendingUp className="w-4 h-4 mr-2" />}
                {category}
              </Button>
            ))}
          </div>

          {/* Token Filter Navigation */}
          <div className="flex gap-2 overflow-x-auto pb-2 mt-2">
            {tokenFilters.map((token) => (
              <Button
                key={token}
                variant={selectedToken === token ? "outline" : "ghost"}
                onClick={() => setSelectedToken(token)}
                className="whitespace-nowrap text-xs"
                size="sm"
              >
                {token}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Markets Grid */}
      <div className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading markets...</p>
            </div>
          </div>
        ) : sortedMarkets.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <Hash className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No markets found</h3>
            <p className="text-muted-foreground mb-4">
              Be the first to create a market!
            </p>
            <Link href="/create-market">
              <Button>Create Market</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedMarkets.map((market) => {
            const mainPercentage = market.percentage || (market.options ? market.options[0].percentage : 50)

            return (
              <Link key={market.id} href={`/markets/${market.id}`}>
                <Card className={`p-4 transition-all duration-300 cursor-pointer bg-card border-border group ${
                  market.status === 'active' 
                    ? 'hover:shadow-lg hover:shadow-green-500/20 hover:border-green-200' 
                    : 'hover:shadow-lg hover:shadow-gray-500/20 hover:border-gray-200 opacity-90'
                }`}>
                  {/* Header with image, question, and watchlist */}
                  <div className="flex items-start gap-3 mb-4">
                    {market.isReal ? (
                      // Real market - show token image if available, otherwise hash icon
                      tokenImages[market.asset] ? (
                        <img
                          src={tokenImages[market.asset]}
                          alt={market.asset}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          onError={(e) => {
                            // Fallback to hash icon if image fails to load
                            e.currentTarget.style.display = 'none'
                            e.currentTarget.nextElementSibling?.classList.remove('hidden')
                          }}
                        />
                      ) : null
                    ) : (
                      // Mock market - show image
                      <img
                        src={market.image || "/placeholder.svg"}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                    )}
                    {/* Fallback hash icon for real markets when no token image */}
                    {market.isReal && !tokenImages[market.asset] && (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <Hash className="h-5 w-5 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {market.isReal && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            {market.asset}
                          </span>
                        )}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          market.status === 'active' ? 'bg-green-100 text-green-800' :
                          market.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {market.status?.toUpperCase() || 'ACTIVE'}
                        </span>
                      </div>
                      <h3 className="font-semibold text-card-foreground text-sm leading-tight line-clamp-2">
                        {market.question}
                      </h3>
                    </div>
                    {/* Watchlist heart icon */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        // Toggle watchlist
                        const isWatched = localStorage.getItem(`watchlist-${market.id}`)
                        if (isWatched) {
                          localStorage.removeItem(`watchlist-${market.id}`)
                        } else {
                          localStorage.setItem(`watchlist-${market.id}`, JSON.stringify({
                            marketId: market.id,
                            title: market.question,
                            addedAt: new Date().toISOString()
                          }))
                        }
                      }}
                      title="Add to watchlist"
                    >
                      <Heart className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                    </Button>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold text-green-400">{mainPercentage}%</span>
                      <span className="text-xs text-muted-foreground">{t("chance")}</span>
                    </div>

                    {/* Visual progress bar */}
                    <div className="w-full bg-muted rounded-full h-2 mb-3">
                      <div
                        className="bg-green-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${mainPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Betting Buttons - Only show for active markets */}
                  {market.status === 'active' && (
                    <div className="flex gap-2 mb-3">
                      <Button
                        size="sm"
                        className="flex-1 bg-green-200 hover:bg-green-300 text-green-900 hover:shadow-lg hover:shadow-green-300/50 dark:bg-green-800/40 dark:hover:bg-green-700/50 dark:text-green-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {t("yes_cap")}
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-red-200 hover:bg-red-300 text-red-900 hover:shadow-lg hover:shadow-red-300/50 dark:bg-red-800/40 dark:hover:bg-red-700/50 dark:text-red-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {t("no_cap")}
                      </Button>
                    </div>
                  )}

                  {/* Completion Stamp - Only show for closed markets */}
                  {market.status === 'closed' && (
                    <div className="mb-3 flex justify-center">
                      <div className="relative transform rotate-[-2deg]">
                        {/* Color-coded document stamp */}
                        <div className={`text-white px-6 py-3 rounded-full border-4 font-bold text-lg tracking-wide shadow-lg ${
                          market.resolution === 'yes'
                            ? 'bg-green-600 border-green-800'
                            : market.resolution === 'no'
                            ? 'bg-red-600 border-red-800'
                            : market.resolution === 'disputed'
                            ? 'bg-gray-600 border-gray-800'
                            : 'bg-orange-600 border-orange-800'
                        }`}>
                          {market.resolution ? (
                            <div className="text-center">
                              {market.resolution === 'disputed' ? (
                                <>
                                  <div className="text-sm">WINNER</div>
                                  <div className="text-xl">DISPUTED</div>
                                </>
                              ) : (
                                <>
                                  <div className="text-sm">WINNER</div>
                                  <div className="text-xl">{market.resolution.toUpperCase()}</div>
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="text-center">
                              <div className="text-sm">PENDING</div>
                              <div className="text-xl">RESOLUTION</div>
                            </div>
                          )}
                        </div>
                        
                        {/* Stamp shadow */}
                        <div className={`absolute inset-0 transform translate-x-1 translate-y-1 rounded-full opacity-50 -z-10 ${
                          market.resolution === 'yes'
                            ? 'bg-green-900'
                            : market.resolution === 'no'
                            ? 'bg-red-900'
                            : market.resolution === 'disputed'
                            ? 'bg-gray-900'
                            : 'bg-orange-900'
                        }`}></div>
                      </div>
                    </div>
                  )}

                  {/* Enhanced Market Stats */}
                  <div className="space-y-2">
                    {/* First row: Volume and Bets */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        <span>{market.volume || "0"} {t("vol_abbrev")}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{(market.totalYesBets || 0) + (market.totalNoBets || 0)} bets</span>
                      </div>
                    </div>
                    
                    {/* Second row: Time remaining and Liquidity */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      {market.isReal ? (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {(() => {
                              const now = new Date()
                              const closing = new Date(market.closingDate)
                              const diffMs = closing.getTime() - now.getTime()
                              
                              if (diffMs <= 0) {
                                return market.status === 'closed' ? "Closed" : "Expired"
                              }
                              
                              const totalMinutes = Math.floor(diffMs / (1000 * 60))
                              const days = Math.floor(totalMinutes / (24 * 60))
                              const hours = Math.floor((totalMinutes % (24 * 60)) / 60)
                              const minutes = totalMinutes % 60
                              
                              // Format based on remaining time
                              if (days > 0) {
                                if (hours > 0) {
                                  return `${days}d ${hours}h left`
                                } else {
                                  return `${days}d left`
                                }
                              } else if (hours > 0) {
                                if (minutes > 0) {
                                  return `${hours}h ${minutes}m left`
                                } else {
                                  return `${hours}h left`
                                }
                              } else {
                                return `${minutes}m left`
                              }
                            })()}
                          </span>
                        </div>
                      ) : (
                        <span>Mock market</span>
                      )}
                      <div className="flex items-center gap-1">
                        <span className="text-green-600 font-medium">
                          {market.totalVolume ? `${(market.totalVolume / 1000).toFixed(1)}K ${market.asset}` : `0 ${market.asset}`}
                        </span>
                      </div>
                    </div>
                    
                    {/* Creator info for real markets */}
                    {market.isReal && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1 border-t border-border/50">
                        <span>by {market.creator.slice(0, 8)}...{market.creator.slice(-8)}</span>
                      </div>
                    )}
                  </div>
                </Card>
              </Link>
            )
          })}
          </div>
        )}
      </div>
    </div>
  )
}
