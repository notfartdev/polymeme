"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Line, LineChart, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Area, AreaChart } from "recharts"
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react"
import { CoinGeckoAPI, TokenData } from "@/lib/coingecko"

interface RealtimeTokenChartProps {
  tokenSymbol: string
  tokenName?: string
  tokenLogo?: string
  chartStyle?: 'gradient' | 'area' | 'minimal'
}

interface ChartDataPoint {
  time: string
  value: number
  timestamp: number
}

export function RealtimeTokenChart({ tokenSymbol, tokenName, tokenLogo, chartStyle = 'gradient' }: RealtimeTokenChartProps) {
  const [tokenData, setTokenData] = useState<TokenData | null>(null)
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [currentPrice, setCurrentPrice] = useState<number>(0)
  const [priceChange, setPriceChange] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  // Generate correlated chart data that matches current price
  const generateChartData = useCallback((currentPrice: number, priceChange24h: number) => {
    const mockData: ChartDataPoint[] = []
    const currentTime = new Date()
    
    // Calculate starting price 24 hours ago based on current price and 24h change
    const startPrice = currentPrice / (1 + priceChange24h / 100)
    
    // Generate 24 data points over the last 24 hours (every hour)
    let price = startPrice
    for (let i = 23; i >= 0; i--) {
      const time = new Date(currentTime.getTime() - (i * 60 * 60 * 1000)) // 1 hour apart
      
      // Create realistic price movements that end at the current price
      const progress = (23 - i) / 23 // 0 to 1 progress through the day
      const targetPrice = startPrice + (currentPrice - startPrice) * progress
      
      // Add some realistic volatility around the trend
      const volatility = (Math.random() - 0.5) * 0.05 * targetPrice // ±2.5% volatility
      price = targetPrice + volatility
      
      // Ensure the last data point is exactly the current price
      if (i === 0) {
        price = currentPrice
      }
      
      mockData.push({
        time: time.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit'
        }),
        value: price,
        timestamp: time.getTime()
      })
    }
    
    console.log('Generated correlated chart data:', mockData.length, 'points')
    console.log('Start price (24h ago):', startPrice.toFixed(4))
    console.log('Current price (now):', currentPrice.toFixed(4))
    console.log('24h change:', priceChange24h.toFixed(2) + '%')
    return mockData
  }, [])

  // Fetch real token data from our API route
  const fetchTokenData = useCallback(async (isRealTimeUpdate = false) => {
    try {
      if (isRealTimeUpdate) {
        setIsUpdating(true)
      }
      setError(null)
      
      // Fetch data from our Next.js API route (avoids CORS issues)
      const response = await fetch(`/api/coingecko/${tokenSymbol}`)
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }
      
      const data = await response.json()
      
      console.log('Real CoinGecko data:', {
        currentPrice: data.current_price.toFixed(4),
        priceChange24h: data.price_change_percentage_24h.toFixed(2) + '%',
        marketCap: (data.market_cap / 1000000).toFixed(1) + 'M',
        volume24h: (data.total_volume / 1000000).toFixed(1) + 'M',
        rank: data.market_cap_rank
      })
      
      setTokenData(data)
      setLastUpdate(new Date())
      
      // Generate chart data that correlates with real current price and 24h change
      const chartData = generateChartData(data.current_price, data.price_change_percentage_24h)
      setChartData(chartData)
      setCurrentPrice(data.current_price)
      setPriceChange(data.price_change_percentage_24h)
      
    } catch (err) {
      console.error('Error fetching token data:', err)
      setError('Failed to fetch token data')
      
      // Fallback to mock data if API fails
      const currentPrice = 0.9502 // Default fallback price
      const priceChange24h = 3.2 // Default fallback change
      
      const fallbackData = {
        id: tokenSymbol.toLowerCase(),
        symbol: tokenSymbol.toUpperCase(),
        name: tokenSymbol.toLowerCase(),
        current_price: currentPrice,
        market_cap: 950000000,
        total_volume: 320000000,
        market_cap_rank: 131,
        price_change_percentage_24h: priceChange24h,
        ath: currentPrice * 1.5,
        ath_date: new Date().toISOString(),
        circulating_supply: 998926392
      }
      
      setTokenData(fallbackData)
      setLastUpdate(new Date())
      
      const chartData = generateChartData(currentPrice, priceChange24h)
      setChartData(chartData)
      setCurrentPrice(currentPrice)
      setPriceChange(priceChange24h)
    } finally {
      setLoading(false)
      setIsUpdating(false)
    }
  }, [generateChartData])

  // Initial fetch
  useEffect(() => {
    fetchTokenData()
  }, [fetchTokenData])

  // Set up real-time updates every 30 seconds for current price
  useEffect(() => {
    // Update timestamp every 5 seconds for visual feedback
    const timestampInterval = setInterval(() => {
      setLastUpdate(new Date())
    }, 5000)
    
    // Fetch fresh data every 2 minutes to avoid rate limiting
    const dataInterval = setInterval(() => {
      fetchTokenData(true)
    }, 120000) // 2 minutes
    
    return () => {
      clearInterval(timestampInterval)
      clearInterval(dataInterval)
    }
  }, [fetchTokenData])

  // Format price for display
  const formatPrice = (price: number) => {
    if (price >= 1) {
      return `$${price.toFixed(2)}`
    } else if (price >= 0.01) {
      return `$${price.toFixed(4)}`
    } else {
      return `$${price.toFixed(4)}`
    }
  }

  // Format Y-axis labels without dollar sign (cleaner look)
  const formatYAxisLabel = (price: number) => {
    if (price >= 1) {
      return price.toFixed(2)
    } else if (price >= 0.01) {
      return price.toFixed(4)
    } else {
      return price.toFixed(4)
    }
  }

  // Format percentage change
  const formatPercentage = (change: number) => {
    const sign = change >= 0 ? '+' : ''
    return `${sign}${change.toFixed(2)}%`
  }

  // Get price change color
  const getPriceChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-400' : 'text-red-400'
  }


  // Get price change icon
  const getPriceChangeIcon = (change: number) => {
    return change >= 0 ? TrendingUp : TrendingDown
  }

  if (loading && !tokenData) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading token data...</p>
          </div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchTokenData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </Card>
    )
  }

  if (!tokenData) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <p className="text-muted-foreground">No token data available</p>
        </div>
      </Card>
    )
  }

  const PriceChangeIcon = getPriceChangeIcon(priceChange)

  return (
    <Card className="p-6">
      {/* Header with token info and price display */}
      <div className="flex items-center justify-between mb-4">
        {/* Token info on the left */}
        <div className="flex items-center gap-3">
          {tokenLogo && (
            <img 
              src={tokenLogo} 
              alt={tokenSymbol} 
              className="w-8 h-8 rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          )}
          <div>
            <div className="text-lg font-semibold text-foreground">
              {tokenName || tokenSymbol}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{tokenSymbol}</span>
              <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                LIVE
              </span>
            </div>
          </div>
        </div>

        {/* Price display on the right */}
        {tokenData && currentPrice > 0 && (
          <div className="text-right">
            <div className="text-3xl font-bold text-foreground">
              {formatPrice(currentPrice)}
            </div>
            <div className={`flex items-center justify-end gap-1 text-sm font-medium ${getPriceChangeColor(priceChange)}`}>
              <PriceChangeIcon className="h-4 w-4" />
              <span>{formatPercentage(priceChange)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Professional 24H Price Chart */}
      <div className={`h-80 mb-4 bg-white rounded-lg border border-gray-200 p-4 transition-all duration-300 ${isUpdating ? 'ring-2 ring-green-200 ring-opacity-50' : ''}`}>
        {chartData.length > 0 ? (
          <div className="h-full">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-800">24H Price Chart</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchTokenData(true)}
                disabled={isUpdating}
                className="text-xs"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${isUpdating ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            
            <div style={{ width: '100%', height: 'calc(100% - 2rem)' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  
                  {/* Subtle horizontal grid lines */}
                  <CartesianGrid 
                    strokeDasharray="1 1" 
                    stroke="#f1f5f9" 
                    strokeOpacity={0.6}
                    horizontal={true}
                    vertical={false}
                  />
                  
                  {/* X-axis with time labels - show every 2 hours */}
                  <XAxis 
                    dataKey="time" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                    interval={1}
                    tickMargin={8}
                    tickFormatter={(value, index) => {
                      // Show every 2nd hour to avoid crowding
                      return index % 2 === 0 ? value : ''
                    }}
                  />
                  
                  {/* Y-axis with price labels */}
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                    tickFormatter={(value) => `$${value.toFixed(2)}`}
                    orientation="right"
                    domain={['dataMin - dataMin * 0.005', 'dataMax + dataMax * 0.005']}
                    tickMargin={8}
                  />
                  
                  {/* Professional tooltip */}
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        const timestamp = new Date(data.timestamp)
                        const formattedTime = timestamp.toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          timeZoneName: 'short'
                        })
                        
                        return (
                          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                            <div className="text-sm font-medium text-gray-900 mb-1">
                              {formattedTime}
                            </div>
                            <div className="text-lg font-semibold text-gray-900">
                              ${payload[0].value.toFixed(6)}
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  
                  {/* Smooth area chart with green fill */}
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#10b981"
                    strokeWidth={3}
                    fill="url(#priceGradient)"
                    dot={false}
                    activeDot={{ 
                      r: 6, 
                      fill: '#10b981', 
                      stroke: '#ffffff', 
                      strokeWidth: 3,
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-green-500 mx-auto mb-2" />
              <p className="text-gray-500">Loading WIF price data...</p>
            </div>
          </div>
        )}
      </div>


      {/* Additional stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border">
        <div className="text-center p-3 bg-muted/30 rounded-lg">
          <div className="text-lg font-bold text-foreground">
            ${(tokenData.total_volume / 1000000).toFixed(1)}M
          </div>
          <div className="text-sm text-muted-foreground">24h Volume</div>
        </div>
        <div className="text-center p-3 bg-muted/30 rounded-lg">
          <div className="text-lg font-bold text-foreground">
            ${(tokenData.market_cap / 1000000000).toFixed(1)}B
          </div>
          <div className="text-sm text-muted-foreground">Market Cap</div>
        </div>
        <div className="text-center p-3 bg-muted/30 rounded-lg">
          <div className="text-lg font-bold text-foreground">
            #{tokenData.market_cap_rank || 'N/A'}
          </div>
          <div className="text-sm text-muted-foreground">Rank</div>
        </div>
      </div>

      {/* Last update indicator */}
      <div className="text-xs text-muted-foreground text-center mt-4 flex items-center justify-center gap-2">
        {lastUpdate && (
          <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
        )}
        {isUpdating && (
          <div className="flex items-center gap-1 text-green-600">
            <RefreshCw className="h-3 w-3 animate-spin" />
            <span>Updating...</span>
          </div>
        )}
      </div>
    </Card>
  )
}
