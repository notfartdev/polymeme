"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  Globe, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Users,
  Zap
} from "lucide-react"
import { Line, LineChart, XAxis, YAxis, ResponsiveContainer, Area, AreaChart } from "recharts"
import { CoinGeckoAPI, TokenData } from "@/lib/coingecko"
import { useToast } from "@/hooks/use-toast"

interface MarketDataTabProps {
  asset: string
  tokenMint?: string
}

interface PriceData {
  timestamp: number
  price: number
}

interface NewsItem {
  id: string
  title: string
  url: string
  published_at: string
  source: string
  summary?: string
}

export function MarketDataTab({ asset, tokenMint }: MarketDataTabProps) {
  const { toast } = useToast()
  const [tokenData, setTokenData] = useState<TokenData | null>(null)
  const [priceHistory, setPriceHistory] = useState<PriceData[]>([])
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTimeframe, setSelectedTimeframe] = useState("7d")

  // Fetch comprehensive token data
  useEffect(() => {
    const fetchTokenData = async () => {
      try {
        setLoading(true)
        
        // Fetch basic token data
        const basicData = await CoinGeckoAPI.getTokenData(asset)
        setTokenData(basicData)

        // Fetch price history (mock data for now)
        const mockPriceHistory = generateMockPriceHistory(selectedTimeframe)
        setPriceHistory(mockPriceHistory)

        // Fetch news (mock data for now)
        const mockNews = generateMockNews(asset)
        setNews(mockNews)

      } catch (error) {
        console.error('Error fetching token data:', error)
        toast({
          title: "Error",
          description: "Failed to load market data. Please try again.",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    if (asset) {
      fetchTokenData()
    }
  }, [asset, selectedTimeframe, toast])

  // Generate mock price history based on timeframe
  const generateMockPriceHistory = (timeframe: string): PriceData[] => {
    const now = Date.now()
    const intervals = {
      "1d": 24 * 60 * 60 * 1000, // 1 hour intervals
      "7d": 7 * 24 * 60 * 60 * 1000, // 1 day intervals
      "30d": 30 * 24 * 60 * 60 * 1000, // 1 day intervals
      "90d": 90 * 24 * 60 * 60 * 1000, // 3 day intervals
    }
    
    const interval = intervals[timeframe as keyof typeof intervals] || intervals["7d"]
    const dataPoints = timeframe === "1d" ? 24 : timeframe === "7d" ? 7 : timeframe === "30d" ? 30 : 30
    
    const basePrice = tokenData?.currentPrice || 0.000001
    const data: PriceData[] = []
    
    for (let i = dataPoints; i >= 0; i--) {
      const timestamp = now - (i * interval / dataPoints)
      const variation = (Math.random() - 0.5) * 0.1 // ±5% variation
      const price = basePrice * (1 + variation)
      data.push({ timestamp, price })
    }
    
    return data
  }

  // Generate mock news data
  const generateMockNews = (asset: string): NewsItem[] => {
    return [
      {
        id: "1",
        title: `${asset} Price Surges 15% Following Major Partnership Announcement`,
        url: "#",
        published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        source: "CryptoNews",
        summary: "The token has seen significant price movement following the announcement of a new strategic partnership."
      },
      {
        id: "2", 
        title: `Market Analysis: ${asset} Shows Strong Technical Indicators`,
        url: "#",
        published_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        source: "CoinDesk",
        summary: "Technical analysis suggests bullish momentum for the token in the coming weeks."
      },
      {
        id: "3",
        title: `${asset} Community Reaches 1M Holders Milestone`,
        url: "#",
        published_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        source: "CryptoSlate",
        summary: "The token's community has grown significantly, reaching a major milestone in holder count."
      }
    ]
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading market data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!tokenData) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="text-center">
            <p className="text-muted-foreground">No market data available for {asset}</p>
          </div>
        </Card>
      </div>
    )
  }

  const formatPrice = (price: number | undefined) => {
    if (!price || isNaN(price)) return "$0.00"
    if (price < 0.000001) return `$${price.toExponential(2)}`
    if (price < 0.01) return `$${price.toFixed(6)}`
    if (price < 1) return `$${price.toFixed(4)}`
    return `$${price.toFixed(2)}`
  }

  const formatMarketCap = (marketCap: number | undefined) => {
    if (!marketCap || isNaN(marketCap)) return "$0.00"
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`
    if (marketCap >= 1e3) return `$${(marketCap / 1e3).toFixed(2)}K`
    return `$${marketCap.toFixed(2)}`
  }

  const priceChange = priceHistory.length > 1 && priceHistory[0].price > 0
    ? ((priceHistory[priceHistory.length - 1].price - priceHistory[0].price) / priceHistory[0].price) * 100
    : 0

  return (
    <div className="space-y-6">
      {/* Price Overview */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold">{asset} Price</h3>
            <p className="text-muted-foreground">Real-time market data</p>
          </div>
          <div className="flex gap-2">
            {["1d", "7d", "30d", "90d"].map((timeframe) => (
              <Button
                key={timeframe}
                variant={selectedTimeframe === timeframe ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTimeframe(timeframe)}
              >
                {timeframe}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{formatPrice(tokenData?.currentPrice)}</div>
            <div className="text-sm text-muted-foreground">Current Price</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className={`text-2xl font-bold flex items-center justify-center gap-1 ${
              priceChange >= 0 ? "text-green-500" : "text-red-500"
            }`}>
              {priceChange >= 0 ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
              {Math.abs(priceChange).toFixed(2)}%
            </div>
            <div className="text-sm text-muted-foreground">{selectedTimeframe} Change</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{formatMarketCap(tokenData?.marketCap)}</div>
            <div className="text-sm text-muted-foreground">Market Cap</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{formatMarketCap(tokenData?.volume24h)}</div>
            <div className="text-sm text-muted-foreground">24h Volume</div>
          </div>
        </div>

        {/* Price Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={priceHistory}>
              <XAxis 
                dataKey="timestamp" 
                axisLine={false} 
                tickLine={false}
                tickFormatter={(timestamp) => new Date(timestamp).toLocaleDateString()}
              />
              <YAxis 
                domain={['dataMin * 0.95', 'dataMax * 1.05']} 
                axisLine={false} 
                tickLine={false}
                tickFormatter={(price) => formatPrice(price)}
              />
              <Area 
                type="monotone" 
                dataKey="price" 
                stroke="#4ade80" 
                fill="url(#colorGradient)"
                strokeWidth={2}
              />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Market Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Market Statistics
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">All-Time High</span>
              <span className="font-medium">{formatPrice(tokenData?.ath)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ATH Date</span>
              <span className="font-medium">
                {tokenData?.athDate ? new Date(tokenData.athDate).toLocaleDateString() : "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">From ATH</span>
              <span className="font-medium text-red-500">
                {tokenData?.ath && tokenData?.currentPrice && tokenData.ath > 0
                  ? `-${(((tokenData.ath - tokenData.currentPrice) / tokenData.ath) * 100).toFixed(2)}%`
                  : "N/A"
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Market Cap Rank</span>
              <span className="font-medium">#{tokenData?.marketCapRank || "N/A"}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Trading Activity
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">24h High</span>
              <span className="font-medium">
                {formatPrice(tokenData?.currentPrice ? tokenData.currentPrice * 1.05 : undefined)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">24h Low</span>
              <span className="font-medium">
                {formatPrice(tokenData?.currentPrice ? tokenData.currentPrice * 0.95 : undefined)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Volume/Market Cap</span>
              <span className="font-medium">
                {tokenData?.volume24h && tokenData?.marketCap && tokenData.marketCap > 0
                  ? `${((tokenData.volume24h / tokenData.marketCap) * 100).toFixed(2)}%`
                  : "N/A"
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Circulating Supply</span>
              <span className="font-medium">
                {tokenData?.circulatingSupply ? `${(tokenData.circulatingSupply / 1e9).toFixed(2)}B` : "N/A"}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* News Section */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Latest News
        </h4>
        <div className="space-y-4">
          {news.map((item) => (
            <div key={item.id} className="border-b border-border pb-4 last:border-b-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h5 className="font-medium mb-2 hover:text-primary cursor-pointer">
                    {item.title}
                  </h5>
                  {item.summary && (
                    <p className="text-sm text-muted-foreground mb-2">{item.summary}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{item.source}</span>
                    <span>•</span>
                    <span>{new Date(item.published_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
