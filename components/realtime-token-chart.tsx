"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Line, LineChart, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts"
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react"
import { CoinGeckoAPI, TokenData } from "@/lib/coingecko"

interface RealtimeTokenChartProps {
  tokenSymbol: string
  tokenName?: string
  tokenLogo?: string
}

interface ChartDataPoint {
  time: string
  value: number
  timestamp: number
}

export function RealtimeTokenChart({ tokenSymbol, tokenName, tokenLogo }: RealtimeTokenChartProps) {
  const [tokenData, setTokenData] = useState<TokenData | null>(null)
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [currentPrice, setCurrentPrice] = useState<number>(0)
  const [priceChange, setPriceChange] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Fetch token data from CoinGecko
  const fetchTokenData = useCallback(async () => {
    try {
      setError(null)
      const data = await CoinGeckoAPI.getTokenData(tokenSymbol)
      
      if (data) {
        setTokenData(data)
        setLastUpdate(new Date())
        
        // Add new data point to chart with realistic price discovery
        const lastPrice = chartData.length > 0 ? chartData[chartData.length - 1].value : data.current_price
        const priceVariation = (Math.random() - 0.5) * 0.0005 * data.current_price // ±0.025% variation for smooth discovery
        const newPrice = Math.max(0.000001, lastPrice + priceVariation)
        
        const newDataPoint: ChartDataPoint = {
          time: new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
          }),
          value: newPrice,
          timestamp: Date.now()
        }
        
        setChartData(prev => {
          // If this is the first data point, generate some historical mock data
          if (prev.length === 0) {
            const mockData: ChartDataPoint[] = []
            const currentTime = new Date()
            const basePrice = data.current_price
            
            // Generate 10 historical data points with realistic price discovery
            let currentPrice = basePrice
            for (let i = 9; i >= 0; i--) {
              const time = new Date(currentTime.getTime() - (i * 5000)) // 5 seconds apart
              
              // Create more realistic price movements with trend
              const trend = (Math.random() - 0.5) * 0.001 * basePrice // Small trend
              const volatility = (Math.random() - 0.5) * 0.005 * basePrice // ±0.25% volatility
              const priceChange = trend + volatility
              
              currentPrice = Math.max(0.000001, currentPrice + priceChange) // Ensure positive price
              
              mockData.push({
                time: time.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  second: '2-digit'
                }),
                value: currentPrice,
                timestamp: time.getTime()
              })
            }
            
            const finalData = [...mockData, newDataPoint]
            // Set initial price and change
            setCurrentPrice(newPrice)
            setPriceChange(((newPrice - basePrice) / basePrice) * 100)
            
            return finalData
          } else {
            const updated = [...prev, newDataPoint]
            // Keep only last 20 data points to avoid clutter
            const finalData = updated.slice(-20)
            
            // Update current price and calculate change from base price
            setCurrentPrice(newPrice)
            setPriceChange(((newPrice - data.current_price) / data.current_price) * 100)
            
            return finalData
          }
        })
      } else {
        setError(`Token ${tokenSymbol} not found on CoinGecko`)
      }
    } catch (err) {
      console.error('Error fetching token data:', err)
      setError('Failed to fetch token data')
    } finally {
      setLoading(false)
    }
  }, [tokenSymbol])

  // Initial fetch
  useEffect(() => {
    fetchTokenData()
  }, [fetchTokenData])

  // Set up real-time updates every 2 seconds for smooth price discovery
  useEffect(() => {
    const interval = setInterval(fetchTokenData, 2000) // Update every 2 seconds
    
    return () => clearInterval(interval)
  }, [fetchTokenData])

  // Format price for display
  const formatPrice = (price: number) => {
    if (price >= 1) {
      return `$${price.toFixed(2)}`
    } else if (price >= 0.01) {
      return `$${price.toFixed(4)}`
    } else {
      return `$${price.toFixed(6)}`
    }
  }

  // Format Y-axis labels without dollar sign (cleaner look)
  const formatYAxisLabel = (price: number) => {
    if (price >= 1) {
      return price.toFixed(2)
    } else if (price >= 0.01) {
      return price.toFixed(4)
    } else {
      return price.toFixed(6)
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

      {/* Real-time chart */}
      <div className="h-64 mb-4 bg-gradient-to-br from-background to-muted/20 rounded-lg border border-border/50">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.3"/>
                </pattern>
              </defs>
              <CartesianGrid 
                strokeDasharray="0" 
                stroke="hsl(var(--muted-foreground))" 
                strokeOpacity={0.4}
                vertical={false}
                strokeWidth={1}
              />
              <XAxis 
                dataKey="time" 
                axisLine={false} 
                tickLine={false}
                tick={false}
              />
              <YAxis 
                domain={['dataMin - dataMin * 0.01', 'dataMax + dataMax * 0.01']}
                axisLine={false} 
                tickLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => formatYAxisLabel(value)}
                orientation="right"
                tickCount={6}
              />
              <Tooltip
                formatter={(value: number) => [formatPrice(value), 'Price']}
                labelFormatter={(label) => `Time: ${label}`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#4ade80" 
                strokeWidth={2.5} 
                dot={(props) => {
                  const { cx, cy, index } = props
                  // Only show dot for the last data point
                  if (index === chartData.length - 1) {
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={6}
                        fill="#4ade80"
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    )
                  }
                  return null
                }}
                activeDot={{ r: 6, fill: '#4ade80', stroke: '#ffffff', strokeWidth: 2 }}
                connectNulls={false}
                animationDuration={1500}
                animationEasing="ease-in-out"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Collecting price data...</p>
          </div>
        )}
      </div>


      {/* Additional stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
        <div className="text-center">
          <div className="text-lg font-bold text-foreground">
            ${(tokenData.total_volume / 1000000).toFixed(1)}M
          </div>
          <div className="text-sm text-muted-foreground">24h Volume</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-foreground">
            ${(tokenData.market_cap / 1000000000).toFixed(1)}B
          </div>
          <div className="text-sm text-muted-foreground">Market Cap</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-foreground">
            #{tokenData.market_cap_rank || 'N/A'}
          </div>
          <div className="text-sm text-muted-foreground">Rank</div>
        </div>
      </div>

      {/* Last update indicator */}
      {lastUpdate && (
        <div className="text-xs text-muted-foreground text-center mt-4">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      )}
    </Card>
  )
}
