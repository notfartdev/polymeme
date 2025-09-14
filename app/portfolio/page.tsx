"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Wallet,
  TrendingUp,
  Twitter,
  Copy,
  ExternalLink,
  Trophy,
  Target,
  DollarSign,
  Activity,
  Filter,
  RefreshCw,
} from "lucide-react"
import Header from "@/components/header"
import { useI18n } from "@/lib/i18n"
import { useWalletAssets } from "@/hooks/use-wallet-assets"
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletGuard } from '@/components/wallet-guard'

// Types for real data
interface UserStats {
  userId: string
  walletAddress: string
  totalMarketsCreated: number
  totalBets: number
  totalVolume: number
  totalPnL: number
  winRate: number
  activePositions: number
  bestTrade: number
  worstTrade: number
  avgTrade: number
  totalTrades: number
  isActiveTrader: boolean
  hasWinningRecord: boolean
}

interface TradingActivity {
  id: string
  marketId: string
  marketTitle: string
  marketDescription: string
  betSide: string
  amount: number
  tokenMint: string
  tokenAmount: number
  outcome: string
  pnl: number
  status: string
  createdAt: string
  settledAt: string | null
  isWinning: boolean
  isLosing: boolean
  isPending: boolean
  isActive: boolean
  isSettled: boolean
  createdDate: string
  settledDate: string | null
}

interface PerformanceData {
  totalVolume: number
  totalPnL: number
  winRate: number
  totalTrades: number
  activePositions: number
  bestTrade: number
  worstTrade: number
  avgTrade: number
  monthlyPnL: number
  monthlyTrades: number
  monthlyWinRate: number
  weeklyPnL: number
  weeklyTrades: number
  profitMargin: number
  riskRewardRatio: number
  isProfitable: boolean
  isConsistent: boolean
  isActive: boolean
  totalMarketsCreated: number
  performanceGrade: string
  riskLevel: string
}

export default function PortfolioPage() {
  const { t } = useI18n()
  const { publicKey, connected } = useWallet()
  const { assets, loading, error, totalValue, totalChange, refetch } = useWalletAssets()
  const [selectedTab, setSelectedTab] = useState("overview")
  const [twitterConnected, setTwitterConnected] = useState(false)
  
  // Real data state
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [tradingActivity, setTradingActivity] = useState<TradingActivity[]>([])
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [activityLoading, setActivityLoading] = useState(false)
  const [performanceLoading, setPerformanceLoading] = useState(false)

  // Fetch user stats
  const fetchUserStats = async () => {
    if (!publicKey) return
    
    setStatsLoading(true)
    try {
      const response = await fetch(`/api/users/${publicKey.toString()}/stats`)
      if (response.ok) {
        const data = await response.json()
        setUserStats(data)
      } else {
        console.error('Failed to fetch user stats')
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  // Fetch trading activity
  const fetchTradingActivity = async () => {
    if (!publicKey) return
    
    setActivityLoading(true)
    try {
      const response = await fetch(`/api/users/${publicKey.toString()}/activity`)
      if (response.ok) {
        const data = await response.json()
        setTradingActivity(data.activity || [])
      } else {
        console.error('Failed to fetch trading activity')
      }
    } catch (error) {
      console.error('Error fetching trading activity:', error)
    } finally {
      setActivityLoading(false)
    }
  }

  // Fetch performance data
  const fetchPerformanceData = async () => {
    if (!publicKey) return
    
    setPerformanceLoading(true)
    try {
      const response = await fetch(`/api/users/${publicKey.toString()}/performance`)
      if (response.ok) {
        const data = await response.json()
        setPerformanceData(data)
      } else {
        console.error('Failed to fetch performance data')
      }
    } catch (error) {
      console.error('Error fetching performance data:', error)
    } finally {
      setPerformanceLoading(false)
    }
  }

  // Fetch all data when wallet connects
  useEffect(() => {
    if (publicKey && connected) {
      fetchUserStats()
      fetchTradingActivity()
      fetchPerformanceData()
    }
  }, [publicKey, connected])

  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toString())
    }
  }

  return (
    <WalletGuard>
      <div className="min-h-screen bg-background">
        <Header />

        <div className="container mx-auto px-4 py-6">
        {/* Portfolio Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-foreground">{t("portfolio_heading")}</h1>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="gap-2 bg-transparent"
              onClick={refetch}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              variant="outline"
              className="gap-2 bg-transparent"
              onClick={() => setTwitterConnected(!twitterConnected)}
            >
              <Twitter className="h-4 w-4" />
              {twitterConnected ? t("connected") : t("connect_twitter")}
            </Button>
            <Button className="gap-2">
              <Wallet className="h-4 w-4" />
              {connected ? t("connected") : t("connect_wallet")}
            </Button>
          </div>
        </div>

        {/* Wallet Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{t("total_balance")}</span>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">
              {loading ? 'Loading...' : `$${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
            </div>
            <div className={`flex items-center gap-1 text-sm ${totalChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className="h-3 w-3" />
              {loading ? '...' : `${totalChange >= 0 ? '+' : ''}${totalChange.toFixed(2)}%`} (24h)
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{t("total_pnl_label")}</span>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className={`text-2xl font-bold ${(userStats?.totalPnL || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
              {statsLoading ? 'Loading...' : `${(userStats?.totalPnL || 0) >= 0 ? "+" : ""}$${(userStats?.totalPnL || 0).toFixed(2)}`}
            </div>
            <div className="text-sm text-muted-foreground">{t("all_time")}</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{t("win_rate")}</span>
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{statsLoading ? 'Loading...' : `${(userStats?.winRate || 0).toFixed(1)}%`}</div>
            <div className="text-sm text-muted-foreground">{userStats?.totalTrades || 0} {t("trades_suffix")}</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{t("active_positions")}</span>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{statsLoading ? 'Loading...' : (userStats?.activePositions || 0)}</div>
            <div className="text-sm text-muted-foreground">{t("markets_suffix")}</div>
          </Card>
        </div>

        {/* Wallet Address */}
        {connected && publicKey && (
          <Card className="p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">{t("wallet_address")}</div>
                  <div className="font-mono text-sm">
                    {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={copyAddress}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 border-b">
          {[
            { id: "overview", label: t("overview") },
            { id: "assets", label: t("assets") },
            { id: "activity", label: t("trading_activity") },
            { id: "performance", label: t("performance") },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={selectedTab === tab.id ? "default" : "ghost"}
              onClick={() => setSelectedTab(tab.id)}
              className="rounded-b-none"
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Tab Content */}
        {selectedTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">{t("recent_activity")}</h3>
              <div className="space-y-3">
                {activityLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="ml-2 text-sm">Loading activity...</span>
                  </div>
                ) : tradingActivity.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <p className="text-sm">No trading activity yet</p>
                    <p className="text-xs">Start betting to see your activity here</p>
                  </div>
                ) : (
                  tradingActivity.slice(0, 3).map((trade) => (
                    <div key={trade.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div>
                        <div className="font-medium text-sm">{trade.marketTitle}</div>
                        <div className="text-xs text-muted-foreground">
                          {trade.betSide === 'yes' ? 'Yes' : 'No'} - ${trade.amount.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${trade.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">{trade.createdDate}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Top Assets */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">{t("top_assets")}</h3>
              <div className="space-y-3">
                {loading ? (
                  <div className="flex items-center justify-center py-4">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="ml-2 text-sm">Loading assets...</span>
                  </div>
                ) : assets.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <p className="text-sm">No assets found</p>
                  </div>
                ) : (
                  assets.slice(0, 3).map((asset) => (
                    <div key={asset.mint} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                          {asset.logo ? (
                            <img src={asset.logo} alt={asset.symbol} className="w-6 h-6 rounded-full" />
                          ) : (
                            <span className="text-xs font-bold">{asset.symbol.slice(0, 2)}</span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{asset.symbol}</div>
                          <div className="text-xs text-muted-foreground">
                            {asset.balance.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {asset.value && asset.value > 0 ? `$${asset.value.toFixed(2)}` : '$0.00'}
                        </div>
                        {asset.change24h !== undefined && asset.change24h !== 0 && (
                          <div className={`text-xs ${asset.change24h >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {asset.change24h >= 0 ? "+" : ""}
                            {asset.change24h.toFixed(2)}%
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        )}

        {selectedTab === "assets" && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{t("assets")}</h3>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Filter className="h-4 w-4" />
                {t("filter")}
              </Button>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading assets...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">
                <p>Error loading assets: {error}</p>
                <Button onClick={refetch} className="mt-2">Retry</Button>
              </div>
            ) : assets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No assets found in your wallet</p>
                <p className="text-sm">Connect your wallet to see your tokens</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assets.map((asset) => (
                  <div
                    key={asset.mint}
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                        {asset.logo ? (
                          <img src={asset.logo} alt={asset.symbol} className="w-8 h-8 rounded-full" />
                        ) : (
                          <span className="font-bold">{asset.symbol.slice(0, 2)}</span>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold">{asset.symbol}</div>
                        <div className="text-sm text-muted-foreground">{asset.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {asset.value && asset.value > 0 ? `$${asset.value.toFixed(2)}` : '$0.00'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {asset.balance.toLocaleString(undefined, { maximumFractionDigits: 6 })} {asset.symbol}
                      </div>
                      {asset.change24h !== undefined && asset.change24h !== 0 && (
                        <div className={`text-sm ${asset.change24h >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {asset.change24h >= 0 ? "+" : ""}
                          {asset.change24h.toFixed(2)}%
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {selectedTab === "activity" && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">{t("trading_activity")}</h3>
            {activityLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading trading activity...</span>
              </div>
            ) : tradingActivity.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-lg">No trading activity yet</p>
                <p className="text-sm">Start betting on markets to see your activity here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tradingActivity.map((trade) => (
                  <div key={trade.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{trade.marketTitle}</div>
                      <div className="text-sm text-muted-foreground">
                        {trade.betSide === 'yes' ? 'Yes' : 'No'} - ${trade.amount.toFixed(2)}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            trade.isActive
                              ? "bg-blue-100 text-blue-700"
                              : trade.isWinning
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {trade.isActive ? t("active") : trade.isWinning ? t("won") : t("lost")}
                        </span>
                        <span className="text-xs text-muted-foreground">{trade.createdDate}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">${trade.amount.toFixed(2)}</div>
                      <div className={`font-semibold ${trade.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {trade.isActive ? t("pending") : `${trade.pnl >= 0 ? "+" : ""}$${trade.pnl.toFixed(2)}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {selectedTab === "performance" && (
          <div className="space-y-6">
            {performanceLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading performance data...</span>
              </div>
            ) : (
              <>
                {/* Main Performance Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="p-6">
                    <div className="text-sm text-muted-foreground mb-2">Total Volume</div>
                    <div className="text-2xl font-bold">${(performanceData?.totalVolume || 0).toLocaleString()}</div>
                  </Card>
                  <Card className="p-6">
                    <div className="text-sm text-muted-foreground mb-2">Best Trade</div>
                    <div className="text-2xl font-bold text-green-600">+${(performanceData?.bestTrade || 0).toFixed(2)}</div>
                  </Card>
                  <Card className="p-6">
                    <div className="text-sm text-muted-foreground mb-2">Worst Trade</div>
                    <div className="text-2xl font-bold text-red-600">${(performanceData?.worstTrade || 0).toFixed(2)}</div>
                  </Card>
                  <Card className="p-6">
                    <div className="text-sm text-muted-foreground mb-2">Avg Trade</div>
                    <div className="text-2xl font-bold">${(performanceData?.avgTrade || 0).toFixed(2)}</div>
                  </Card>
                </div>

                {/* Additional Performance Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="p-6">
                    <div className="text-sm text-muted-foreground mb-2">Monthly P&L</div>
                    <div className={`text-2xl font-bold ${(performanceData?.monthlyPnL || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${(performanceData?.monthlyPnL || 0).toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">Last 30 days</div>
                  </Card>
                  <Card className="p-6">
                    <div className="text-sm text-muted-foreground mb-2">Weekly P&L</div>
                    <div className={`text-2xl font-bold ${(performanceData?.weeklyPnL || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${(performanceData?.weeklyPnL || 0).toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">Last 7 days</div>
                  </Card>
                  <Card className="p-6">
                    <div className="text-sm text-muted-foreground mb-2">Performance Grade</div>
                    <div className="text-2xl font-bold">{performanceData?.performanceGrade || 'N/A'}</div>
                    <div className="text-xs text-muted-foreground">Risk Level: {performanceData?.riskLevel || 'Unknown'}</div>
                  </Card>
                </div>

                {/* Performance Summary */}
                {performanceData && (
                  <Card className="p-6">
                    <h4 className="text-lg font-semibold mb-4">Performance Summary</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Profit Margin</div>
                        <div className="text-xl font-bold">{performanceData.profitMargin.toFixed(2)}%</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Risk/Reward Ratio</div>
                        <div className="text-xl font-bold">{performanceData.riskRewardRatio.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Consistency</div>
                        <div className="text-xl font-bold">{performanceData.isConsistent ? 'Consistent' : 'Volatile'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Status</div>
                        <div className="text-xl font-bold">{performanceData.isProfitable ? 'Profitable' : 'Learning'}</div>
                      </div>
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>
        )}
        </div>
      </div>
    </WalletGuard>
  )
}
