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
import { Line, LineChart, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { format } from "date-fns"
import { useI18n } from "@/lib/i18n"
import { useToast } from "@/hooks/use-toast"
import { MarketDataTab } from "@/components/market-data-tab"
import { BettingInterface } from "@/components/betting-interface"
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
  multipleChoiceOptions?: string[]
  minValue?: string
  maxValue?: string
  unit?: string
  earliestDate?: string
  latestDate?: string
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
  const [selectedTab, setSelectedTab] = useState("1D")
  const [tradingMode, setTradingMode] = useState<"buy" | "sell">("buy")
  const [orderType, setOrderType] = useState<"market" | "limit">("market")
  const [selectedOutcome, setSelectedOutcome] = useState<"yes" | "no">("yes")
  const [limitPrice, setLimitPrice] = useState("")
  const [shares, setShares] = useState(0)
  const [activeTab, setActiveTab] = useState<"market" | "data">("market")
  const [isBettingOpen, setIsBettingOpen] = useState(false)
  const [selectedBetSide, setSelectedBetSide] = useState<'yes' | 'no' | null>(null)

  // Fetch market data
  useEffect(() => {
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

    if (marketId) {
      fetchMarket()
    }
  }, [marketId, toast])

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

  // For Yes/No markets, we'll use mock percentages for now
  // In a real app, these would come from betting data
  const mainPercentage = 65 // Mock: 65% chance of "Yes"
  const oppositePercentage = 100 - mainPercentage

  const currentPrice = selectedOutcome === "yes" ? mainPercentage : oppositePercentage
  const amountValue = Number.parseFloat(amount) || 0
  const limitPriceValue = Number.parseFloat(limitPrice) || currentPrice
  const totalCost = orderType === "market" ? (amountValue * currentPrice) / 100 : (shares * limitPriceValue) / 100
  const potentialWin = orderType === "market" ? amountValue - totalCost : shares - (shares * limitPriceValue) / 100

  // Format closing date
  const closingDate = new Date(market.closingDate)
  const formattedClosingDate = format(closingDate, "MMM dd, yyyy 'at' p 'UTC'")
  
  // Mock chart data for now
  const chartData = [
    { time: "Today", value: mainPercentage },
    { time: "1D", value: mainPercentage + 2 },
    { time: "1W", value: mainPercentage - 1 },
    { time: "1M", value: mainPercentage + 1 },
    { time: "ALL", value: mainPercentage },
  ]

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Market Header */}
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Hash className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    {market.asset}
                  </span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    {market.status.toUpperCase()}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">{market.question}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Closes {formattedClosingDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    Created by {market.creator}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Bookmark className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-border">
              <button
                onClick={() => setActiveTab("market")}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "market"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Market Details
              </button>
              <button
                onClick={() => setActiveTab("data")}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "data"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Market Data
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === "market" ? (
              <>
                {/* Chart */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold text-green-400">{mainPercentage}%</span>
                  <div className="flex items-center gap-1 text-green-400">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm">+2%</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  {["1D", "1W", "1M", "ALL"].map((tab) => (
                    <Button
                      key={tab}
                      variant={selectedTab === tab ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setSelectedTab(tab)}
                    >
                      {tab}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="time" axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} />
                    <Line type="monotone" dataKey="value" stroke="#4ade80" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Betting Options */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Chance</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">Yes</span>
                    <span className="text-2xl font-bold">{mainPercentage}%</span>
                    <div className="flex items-center gap-1 text-green-400">
                      <TrendingUp className="h-3 w-3" />
                      <span className="text-xs">+2%</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      Yes {mainPercentage}¢
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50 bg-transparent"
                    >
                      No {oppositePercentage}¢
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Rules Summary */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  Market Details
                  <Info className="h-4 w-4 text-muted-foreground" />
                </h3>
              </div>

              <div className="mb-4">
                <Button
                  variant="outline"
                  className="text-green-600 border-green-200 hover:bg-green-50 flex items-center gap-2 bg-transparent"
                >
                  Yes/No Market <ChevronDown className="h-4 w-4" />
                </Button>
              </div>

              <p className="text-muted-foreground leading-relaxed mb-4">{market.description}</p>

              <div className="space-y-2 text-sm text-muted-foreground mb-4">
                <div><strong>Asset:</strong> {market.asset}</div>
                <div><strong>Type:</strong> {market.questionType}</div>
                <div><strong>Created:</strong> {format(new Date(market.createdAt), "MMM dd, yyyy 'at' p 'UTC'")}</div>
              </div>

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
                    {market.token_logo && (
                      <img src={market.token_logo} alt={market.token_symbol} className="w-6 h-6 rounded-full" />
                    )}
                    <span className="font-medium">{market.token_symbol || "SOL"}</span>
                    <span className="text-muted-foreground">({market.token_name || "Solana"})</span>
                  </div>
                  {market.token_mint && (
                    <div className="text-xs text-muted-foreground font-mono bg-white p-2 rounded border">
                      Contract: {market.token_mint}
                    </div>
                  )}
                </div>
              </Card>

              <div className="flex gap-3">
                <Button variant="outline" className="text-green-600 border-green-200 hover:bg-green-50 bg-transparent">
                  View full rules
                </Button>
                <Button variant="outline" className="text-green-600 border-green-200 hover:bg-green-50 bg-transparent">
                  Help center
                </Button>
              </div>
            </Card>

            {/* Timeline and payout section */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Calendar className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Timeline and payout</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Market open</div>
                    <div className="text-sm text-muted-foreground">Jul 29, 2025 · 1:10am EDT</div>
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
                  If this event occurs, the market will close the following 10am ET. Otherwise, it closes by{" "}
                  {market.deadline} at 11:59pm EST.
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>
                    <strong>Series</strong> KXBTCMAXY
                  </span>
                  <span>
                    <strong>Event</strong> KXBTCMAXY-25
                  </span>
                  <span>
                    <strong>Market</strong> KXBTCMAXY-25-DEC31-139999.99
                  </span>
                </div>
              </div>
            </Card>
              </>
            ) : (
              <MarketDataTab asset={market.asset} tokenMint={market.tokenMint} />
            )}
          </div>

          {/* Trading Panel */}
          <div className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Hash className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="font-medium text-sm">{market.asset}</div>
                  <div className="text-xs text-muted-foreground">
                    {tradingMode === "buy" ? "Buy" : "Sell"} {selectedOutcome === "yes" ? "Yes" : "No"} •{" "}
                    Yes/No Market
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mb-4">
                <Button
                  className={`flex-1 ${tradingMode === "buy" ? "bg-blue-600 hover:bg-blue-700" : "bg-transparent border"}`}
                  variant={tradingMode === "buy" ? "default" : "outline"}
                  onClick={() => setTradingMode("buy")}
                >
                  Buy
                </Button>
                <Button
                  variant={tradingMode === "sell" ? "default" : "outline"}
                  className={`flex-1 ${tradingMode === "sell" ? "bg-red-600 hover:bg-red-700" : "bg-transparent"}`}
                  onClick={() => setTradingMode("sell")}
                >
                  Sell
                </Button>
                <select
                  className="px-3 py-2 border rounded-md bg-background text-sm"
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value as "market" | "limit")}
                >
                  <option value="market">Market</option>
                  <option value="limit">Limit</option>
                </select>
              </div>

              <div className="flex gap-2 mb-4">
                <Button
                  size="lg"
                  className={`flex-1 text-lg font-semibold ${
                    selectedOutcome === "yes"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-blue-100 hover:bg-blue-200 text-blue-700"
                  }`}
                  onClick={() => {
                    setSelectedOutcome("yes")
                    handleBetClick("yes")
                  }}
                >
                  Yes {mainPercentage}¢
                </Button>
                <Button
                  size="lg"
                  className={`flex-1 text-lg font-semibold ${
                    selectedOutcome === "no"
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-red-100 hover:bg-red-200 text-red-700"
                  }`}
                  onClick={() => {
                    setSelectedOutcome("no")
                    handleBetClick("no")
                  }}
                >
                  No {oppositePercentage}¢
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
                        placeholder={`${currentPrice}¢`}
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
                ) : (
                  <div>
                    <label className="text-sm font-medium">Amount</label>
                    <div className="text-xs text-muted-foreground mb-2">Earn 4% Interest</div>
                    <Input
                      placeholder="$0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="text-2xl font-bold text-center"
                    />
                  </div>
                )}

                <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Odds</span>
                    <span className="font-semibold">{currentPrice}% chance</span>
                  </div>
                  {orderType === "market" && amountValue > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Payout if {selectedOutcome === "yes" ? "Yes" : "No"}</span>
                      <span className="font-semibold text-green-600">${amountValue.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>Total</span>
                    <span className="font-semibold">${totalCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>To Win</span>
                    <span className="font-semibold text-green-600">${Math.max(0, potentialWin).toFixed(2)}</span>
                  </div>
                </div>

                <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3">
                  {totalCost > 0 ? `Trade $${totalCost.toFixed(2)}` : "Sign up to trade"}
                </Button>

                {totalCost > 0 && (
                  <p className="text-xs text-muted-foreground text-center">By trading, you agree to the Terms of Use</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Betting Interface Modal */}
      {market && (
        <BettingInterface
          marketId={market.id}
          marketTitle={market.question}
          requiredTokenMint={market.token_mint || "So11111111111111111111111111111111111111112"} // Default to SOL
          requiredTokenSymbol={market.token_symbol || "SOL"}
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
