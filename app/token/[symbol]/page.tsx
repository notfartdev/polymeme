"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  Users, 
  Clock, 
  Plus,
  ArrowLeft,
  ExternalLink,
  Share2,
  Bookmark
} from "lucide-react"
import Link from "next/link"
import Header from "@/components/header"
import { useI18n } from "@/lib/i18n"
import { CoinGeckoAPI, TokenData } from "@/lib/coingecko"
import { RealtimeTokenChart } from "@/components/realtime-token-chart"
import { TokenNews } from "@/components/token-news"
import { useToast } from "@/hooks/use-toast"

interface MarketData {
  id: string
  question: string
  description: string
  closingDate: string
  status: 'active' | 'pending' | 'closed'
  creator: string
  totalYesBets?: number
  totalNoBets?: number
  totalVolume?: number
  asset: string
}

export default function TokenDetailPage() {
  const { t } = useI18n()
  const { toast } = useToast()
  const params = useParams()
  const symbol = (params.symbol as string).toUpperCase()
  
  const [tokenData, setTokenData] = useState<TokenData | null>(null)
  const [relatedMarkets, setRelatedMarkets] = useState<MarketData[]>([])
  const [loading, setLoading] = useState(true)
  const [marketsLoading, setMarketsLoading] = useState(true)
  const [isBookmarked, setIsBookmarked] = useState(false)

  // Fetch token data
  useEffect(() => {
    const fetchTokenData = async () => {
      try {
        setLoading(true)
        const data = await CoinGeckoAPI.getTokenDataBySymbol(symbol)
        setTokenData(data)
      } catch (error) {
        console.error('Error fetching token data:', error)
        toast({
          title: "Error",
          description: "Failed to load token data",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTokenData()
  }, [symbol, toast])

  // Fetch related markets
  useEffect(() => {
    const fetchRelatedMarkets = async () => {
      try {
        setMarketsLoading(true)
        const response = await fetch('/api/markets')
        if (response.ok) {
          const markets = await response.json()
          // Filter markets related to this token
          const related = markets.filter((market: MarketData) => 
            market.asset?.toUpperCase() === symbol
          )
          setRelatedMarkets(related.slice(0, 6)) // Show top 6 related markets
        }
      } catch (error) {
        console.error('Error fetching related markets:', error)
      } finally {
        setMarketsLoading(false)
      }
    }

    fetchRelatedMarkets()
  }, [symbol])

  const formatPrice = (price: number) => {
    if (price < 0.01) {
      return `$${price.toFixed(8)}`
    } else if (price < 1) {
      return `$${price.toFixed(4)}`
    } else {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
  }

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e12) {
      return `$${(marketCap / 1e12).toFixed(2)}T`
    } else if (marketCap >= 1e9) {
      return `$${(marketCap / 1e9).toFixed(2)}B`
    } else if (marketCap >= 1e6) {
      return `$${(marketCap / 1e6).toFixed(2)}M`
    } else {
      return `$${marketCap.toLocaleString()}`
    }
  }

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) {
      return `$${(volume / 1e9).toFixed(2)}B`
    } else if (volume >= 1e6) {
      return `$${(volume / 1e6).toFixed(2)}M`
    } else if (volume >= 1e3) {
      return `$${(volume / 1e3).toFixed(2)}K`
    } else {
      return `$${volume.toLocaleString()}`
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading {symbol} data...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!tokenData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Token Not Found</h1>
            <p className="text-muted-foreground mb-4">
              We couldn't find data for {symbol}
            </p>
            <Link href="/markets">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Markets
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        {/* Header Section */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/markets">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {tokenData.image && (
                <img 
                  src={tokenData.image} 
                  alt={tokenData.name}
                  className="w-12 h-12 rounded-full"
                />
              )}
              <div>
                <h1 className="text-3xl font-bold">{tokenData.name}</h1>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono">
                    {tokenData.symbol}
                  </Badge>
                  {tokenData.market_cap_rank && (
                    <Badge variant="outline">
                      Rank #{tokenData.market_cap_rank}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsBookmarked(!isBookmarked)}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4" />
            </Button>
            <Link href={`/create-market?token=${symbol}&name=${encodeURIComponent(tokenData.name)}`}>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Market
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Price & Chart */}
          <div className="lg:col-span-2 space-y-6">
            {/* Price Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-3xl font-bold">
                      {formatPrice(tokenData.current_price)}
                    </div>
                    <div className={`flex items-center gap-2 ${
                      tokenData.price_change_percentage_24h >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tokenData.price_change_percentage_24h >= 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      <span className="font-medium">
                        {tokenData.price_change_percentage_24h >= 0 ? '+' : ''}
                        {tokenData.price_change_percentage_24h.toFixed(2)}%
                      </span>
                      <span className="text-muted-foreground">24h</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Market Cap</div>
                    <div className="text-lg font-semibold">
                      {formatMarketCap(tokenData.market_cap)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Price Chart
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RealtimeTokenChart 
                  tokenSymbol={symbol}
                  tokenName={tokenData.name}
                />
              </CardContent>
            </Card>

            {/* News */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="w-5 h-5" />
                  Latest News
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TokenNews tokenSymbol={symbol} />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Stats & Related Markets */}
          <div className="space-y-6">
            {/* Market Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Market Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">24h Volume</span>
                  </div>
                  <span className="font-medium">
                    {formatVolume(tokenData.total_volume)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">All Time High</span>
                  </div>
                  <span className="font-medium">
                    {formatPrice(tokenData.ath)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">All Time Low</span>
                  </div>
                  <span className="font-medium">
                    {formatPrice(tokenData.atl)}
                  </span>
                </div>

                {tokenData.circulating_supply && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Circulating Supply</span>
                    </div>
                    <span className="font-medium">
                      {tokenData.circulating_supply.toLocaleString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Related Markets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Active Markets for {symbol}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {marketsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : relatedMarkets.length > 0 ? (
                  <div className="space-y-3">
                    {relatedMarkets.map((market) => (
                      <Link key={market.id} href={`/markets/${market.id}`}>
                        <div className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                          <h4 className="font-medium text-sm line-clamp-2 mb-2">
                            {market.question}
                          </h4>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>
                                {new Date(market.closingDate).toLocaleDateString()}
                              </span>
                            </div>
                            <Badge 
                              variant={market.status === 'active' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {market.status}
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    ))}
                    <Link href={`/markets?asset=${symbol}`}>
                      <Button variant="outline" size="sm" className="w-full mt-3">
                        View All {symbol} Markets
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground text-sm mb-3">
                      No active markets for {symbol} yet
                    </p>
                    <Link href={`/create-market?token=${symbol}&name=${encodeURIComponent(tokenData.name)}`}>
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Market
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
