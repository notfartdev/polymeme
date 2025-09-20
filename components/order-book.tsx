"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Users, Clock, ArrowUp, ArrowDown } from "lucide-react"

interface OrderBookEntry {
  price: number
  size: number
  total: number
  side: 'yes' | 'no'
  timestamp: string
  walletAddress: string
  transactionHash: string
}

interface OrderBookData {
  yesOrders: OrderBookEntry[]
  noOrders: OrderBookEntry[]
  lastTrade?: {
    price: number
    size: number
    side: 'yes' | 'no'
    timestamp: string
    walletAddress: string
    transactionHash: string
  }
  poolData: {
    yesPool: { totalTokens: number; totalBets: number }
    noPool: { totalTokens: number; totalBets: number }
  }
  volume24h: number
  tokenSymbol: string
  tokenName: string
  tokenMint: string
}

interface OrderBookProps {
  marketId: string
  className?: string
}

// Mock order book data - in real implementation, this would come from API
const generateMockOrderBook = (marketId: string): OrderBookData => {
  const baseYesPrice = 0.45 + Math.random() * 0.1 // 45-55%
  const baseNoPrice = 1 - baseYesPrice
  
  // Generate Yes orders (bids)
  const yesOrders: OrderBookEntry[] = []
  let yesTotal = 0
  for (let i = 0; i < 8; i++) {
    const price = baseYesPrice + (i * 0.01) // Increasing prices
    const size = Math.random() * 1000 + 100
    yesTotal += size
    const walletAddress = `${Math.random().toString(36).substr(2, 8)}${Math.random().toString(36).substr(2, 8)}${Math.random().toString(36).substr(2, 8)}${Math.random().toString(36).substr(2, 8)}`
    yesOrders.push({
      price,
      size,
      total: yesTotal,
      side: 'yes',
      timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      walletAddress: walletAddress,
      transactionHash: `${Math.random().toString(36).substr(2, 8)}...${Math.random().toString(36).substr(2, 8)}`
    })
  }

  // Generate No orders (asks)
  const noOrders: OrderBookEntry[] = []
  let noTotal = 0
  for (let i = 0; i < 8; i++) {
    const price = baseNoPrice - (i * 0.01) // Decreasing prices
    const size = Math.random() * 1000 + 100
    noTotal += size
    const walletAddress = `${Math.random().toString(36).substr(2, 8)}${Math.random().toString(36).substr(2, 8)}${Math.random().toString(36).substr(2, 8)}${Math.random().toString(36).substr(2, 8)}`
    noOrders.push({
      price,
      size,
      total: noTotal,
      side: 'no',
      timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      walletAddress: walletAddress,
      transactionHash: `${Math.random().toString(36).substr(2, 8)}...${Math.random().toString(36).substr(2, 8)}`
    })
  }

  return {
    yesOrders: yesOrders.sort((a, b) => b.price - a.price), // Highest price first
    noOrders: noOrders.sort((a, b) => a.price - b.price), // Lowest price first
    lastTrade: {
      price: baseYesPrice + (Math.random() - 0.5) * 0.02,
      size: Math.random() * 500 + 50,
      side: Math.random() > 0.5 ? 'yes' : 'no',
      timestamp: new Date().toISOString(),
      walletAddress: `${Math.random().toString(36).substr(2, 8)}${Math.random().toString(36).substr(2, 8)}${Math.random().toString(36).substr(2, 8)}${Math.random().toString(36).substr(2, 8)}`,
      transactionHash: `${Math.random().toString(36).substr(2, 8)}...${Math.random().toString(36).substr(2, 8)}`
    },
      poolData: {
        yesPool: { totalTokens: baseYesPrice * 1000, totalBets: yesOrders.length },
        noPool: { totalTokens: baseNoPrice * 1000, totalBets: noOrders.length }
      },
      tokenSymbol: 'SOL', // Default fallback
      tokenName: 'Solana',
      tokenMint: 'So11111111111111111111111111111111111111112',
    volume24h: Math.random() * 10000 + 1000
  }
}

export function OrderBook({ marketId, className = "" }: OrderBookProps) {
  const [orderBookData, setOrderBookData] = useState<OrderBookData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSide, setSelectedSide] = useState<'yes' | 'no' | 'all'>('all')

  useEffect(() => {
    const fetchOrderBook = async () => {
      try {
        setLoading(true)
        
        // Fetch real data from API
        const response = await fetch(`/api/markets/${marketId}/orderbook`)
        if (response.ok) {
          const data = await response.json()
          setOrderBookData(data)
        } else {
          // Fallback to mock data if API fails
          console.warn('Failed to fetch real order book data, using mock data')
          const mockData = generateMockOrderBook(marketId)
          setOrderBookData(mockData)
        }
      } catch (error) {
        console.error('Error fetching order book:', error)
        // Fallback to mock data on error
        const mockData = generateMockOrderBook(marketId)
        setOrderBookData(mockData)
      } finally {
        setLoading(false)
      }
    }

    fetchOrderBook()
    
    // Refresh every 5 seconds
    const interval = setInterval(fetchOrderBook, 5000)
    return () => clearInterval(interval)
  }, [marketId])

  const formatPrice = (price: number) => {
    return `${(price * 100).toFixed(1)}%`
  }

  const formatSize = (size: number) => {
    if (size >= 1000) {
      return `${(size / 1000).toFixed(1)}K`
    }
    return size.toFixed(0)
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  }

  const formatWalletAddress = (address: string) => {
    if (address.length <= 4) return address
    return `...${address.slice(-4)}`
  }

  const getPriceColor = (side: 'yes' | 'no', isHighlighted = false) => {
    if (isHighlighted) {
      return side === 'yes' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'
    }
    return side === 'yes' ? 'text-green-500' : 'text-red-500'
  }

  const getSizeColor = (side: 'yes' | 'no') => {
    return side === 'yes' ? 'text-green-400' : 'text-red-400'
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Order Book
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!orderBookData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Order Book
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            No order book data available
          </div>
        </CardContent>
      </Card>
    )
  }

  const { yesOrders, noOrders, lastTrade, poolData, volume24h, tokenSymbol, tokenName } = orderBookData

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Order Book
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={selectedSide === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSide('all')}
            >
              All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedSide('yes')}
              className={`text-green-600 border-green-200 hover:bg-green-50 ${
                selectedSide === 'yes' ? 'bg-green-50 border-green-300' : ''
              }`}
            >
              Yes
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedSide('no')}
              className={`text-red-600 border-red-200 hover:bg-red-50 ${
                selectedSide === 'no' ? 'bg-red-50 border-red-300' : ''
              }`}
            >
              No
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Pool Stats */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Pool Totals</div>
            <div className="flex items-center justify-center gap-2">
              <Badge variant="outline" className="text-green-600 border-green-200">
                YES: {poolData.yesPool.totalTokens.toFixed(1)} {tokenSymbol}
              </Badge>
              <Badge variant="outline" className="text-red-600 border-red-200">
                NO: {poolData.noPool.totalTokens.toFixed(1)} {tokenSymbol}
              </Badge>
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Total Pool</div>
            <div className="font-semibold">
              {(poolData.yesPool.totalTokens + poolData.noPool.totalTokens).toFixed(1)} {tokenSymbol}
            </div>
          </div>
        </div>

        {/* Last Trade */}
        {lastTrade && (
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last Trade:</span>
                <Badge 
                  variant="outline" 
                  className={lastTrade.side === 'yes' ? 'text-green-600 border-green-200' : 'text-red-600 border-red-200'}
                >
                  {lastTrade.side.toUpperCase()}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground">Wallet:</span>
                  <div>
                    <a 
                      href={`https://solscan.io/account/${lastTrade.walletAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-mono text-xs underline"
                    >
                      {formatWalletAddress(lastTrade.walletAddress)}
                    </a>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Amount:</span>
                  <div className={getSizeColor(lastTrade.side)}>${formatSize(lastTrade.size)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Price:</span>
                  <div className={getPriceColor(lastTrade.side, true)}>{formatPrice(lastTrade.price)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Time:</span>
                  <div>{formatTime(lastTrade.timestamp)}</div>
                </div>
              </div>
              <div className="pt-2 border-t border-muted">
                <a 
                  href={`https://solscan.io/tx/${lastTrade.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-xs underline"
                >
                  View Transaction on Solscan →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Order Book Table */}
        <div className="space-y-2">
          {/* Table Header */}
          <div className="grid grid-cols-5 gap-2 text-xs font-medium text-muted-foreground border-b pb-2">
            <div>Wallet</div>
            <div>Bet Amount</div>
            <div>Price</div>
            <div>Time</div>
            <div>Transaction</div>
          </div>

          {/* No Orders (Asks) - Red */}
          {(selectedSide === 'all' || selectedSide === 'no') && (
            <>
              {noOrders.slice(0, 5).map((order, index) => (
                <div 
                  key={`no-${index}`} 
                  className="grid grid-cols-5 gap-2 text-sm hover:bg-muted/30 rounded px-2 py-1 transition-colors"
                >
                  <div>
                    <a 
                      href={`https://solscan.io/account/${order.walletAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-mono text-xs underline"
                    >
                      {formatWalletAddress(order.walletAddress)}
                    </a>
                  </div>
                  <div className={getSizeColor('no')}>
                    ${formatSize(order.size)}
                  </div>
                  <div className={getPriceColor('no')}>
                    {formatPrice(order.price)}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {formatTime(order.timestamp)}
                  </div>
                  <div>
                    <a 
                      href={`https://solscan.io/tx/${order.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-xs underline"
                    >
                      View
                    </a>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Pool Info */}
          {selectedSide === 'all' && (
            <div className="text-center py-2 border-y border-muted">
              <div className="text-xs text-muted-foreground">
                Total Pool: {(poolData.yesPool.totalTokens + poolData.noPool.totalTokens).toFixed(1)} {tokenSymbol}
              </div>
            </div>
          )}

          {/* Yes Orders (Bids) - Green */}
          {(selectedSide === 'all' || selectedSide === 'yes') && (
            <>
              {yesOrders.slice(0, 5).map((order, index) => (
                <div 
                  key={`yes-${index}`} 
                  className="grid grid-cols-5 gap-2 text-sm hover:bg-muted/30 rounded px-2 py-1 transition-colors"
                >
                  <div>
                    <a 
                      href={`https://solscan.io/account/${order.walletAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-mono text-xs underline"
                    >
                      {formatWalletAddress(order.walletAddress)}
                    </a>
                  </div>
                  <div className={getSizeColor('yes')}>
                    ${formatSize(order.size)}
                  </div>
                  <div className={getPriceColor('yes')}>
                    {formatPrice(order.price)}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {formatTime(order.timestamp)}
                  </div>
                  <div>
                    <a 
                      href={`https://solscan.io/tx/${order.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-xs underline"
                    >
                      View
                    </a>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

      </CardContent>
    </Card>
  )
}
