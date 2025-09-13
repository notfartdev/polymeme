"use client"

import { useState } from "react"
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
} from "lucide-react"
import Header from "@/components/header"
import { useI18n } from "@/lib/i18n"

// Mock wallet data
const walletData = {
  address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkv",
  balance: 2847.32,
  connected: true,
  assets: [
    { symbol: "SOL", name: "Solana", amount: 12.45, value: 1847.32, change: 5.2, logo: "/solana-logo.png" },
    { symbol: "BONK", name: "Bonk", amount: 1000000, value: 450.0, change: -2.1, logo: "/bonk-logo.png" },
    { symbol: "WIF", name: "dogwifhat", amount: 2500, value: 350.0, change: 12.5, logo: "/wif-logo.png" },
    { symbol: "PEPE", name: "Pepe", amount: 50000, value: 200.0, change: -8.3, logo: "/pepe-logo.png" },
  ],
}

// Mock trading activity
const tradingActivity = [
  {
    id: 1,
    market: "Fed decision in September?",
    position: "Yes - 25 bps decrease",
    amount: 500,
    outcome: "won",
    pnl: 125.5,
    date: "2025-09-12",
    status: "settled",
  },
  {
    id: 2,
    market: "New York City Mayoral Election",
    position: "Yes - Zohran Mamdani",
    amount: 300,
    outcome: "pending",
    pnl: 0,
    date: "2025-09-10",
    status: "active",
  },
  {
    id: 3,
    market: "Will Russia invade a NATO country?",
    position: "No",
    amount: 200,
    outcome: "lost",
    pnl: -200,
    date: "2025-09-08",
    status: "settled",
  },
  {
    id: 4,
    market: "Boxing: Canelo vs Crawford",
    position: "Yes - Canelo",
    amount: 150,
    outcome: "won",
    pnl: 87.3,
    date: "2025-09-05",
    status: "settled",
  },
]

// Mock performance stats
const performanceStats = {
  totalPnL: 312.8,
  winRate: 67,
  totalTrades: 24,
  activePositions: 3,
  totalVolume: 4850.0,
  bestTrade: 225.5,
  worstTrade: -200.0,
  avgTrade: 13.03,
}

export default function PortfolioPage() {
  const { t } = useI18n()
  const [selectedTab, setSelectedTab] = useState("overview")
  const [twitterConnected, setTwitterConnected] = useState(false)

  const copyAddress = () => {
    navigator.clipboard.writeText(walletData.address)
  }

  return (
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
              onClick={() => setTwitterConnected(!twitterConnected)}
            >
              <Twitter className="h-4 w-4" />
              {twitterConnected ? t("connected") : t("connect_twitter")}
            </Button>
            <Button className="gap-2">
              <Wallet className="h-4 w-4" />
              {walletData.connected ? t("connected") : t("connect_wallet")}
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
            <div className="text-2xl font-bold">${walletData.balance.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-green-600 text-sm">
              <TrendingUp className="h-3 w-3" />
              +5.2% (24h)
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{t("total_pnl_label")}</span>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className={`text-2xl font-bold ${performanceStats.totalPnL >= 0 ? "text-green-600" : "text-red-600"}`}>
              {performanceStats.totalPnL >= 0 ? "+" : ""}${performanceStats.totalPnL.toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">{t("all_time")}</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{t("win_rate")}</span>
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{performanceStats.winRate}%</div>
            <div className="text-sm text-muted-foreground">{performanceStats.totalTrades} {t("trades_suffix")}</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{t("active_positions")}</span>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{performanceStats.activePositions}</div>
            <div className="text-sm text-muted-foreground">{t("markets_suffix")}</div>
          </Card>
        </div>

        {/* Wallet Address */}
        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wallet className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">{t("wallet_address")}</div>
                <div className="font-mono text-sm">{walletData.address}</div>
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
                {tradingActivity.slice(0, 3).map((trade) => (
                  <div key={trade.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div>
                      <div className="font-medium text-sm">{trade.market}</div>
                      <div className="text-xs text-muted-foreground">{trade.position}</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${trade.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">{trade.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Top Assets */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">{t("top_assets")}</h3>
              <div className="space-y-3">
                {walletData.assets.slice(0, 3).map((asset) => (
                  <div key={asset.symbol} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold">{asset.symbol.slice(0, 2)}</span>
                      </div>
                      <div>
                        <div className="font-medium text-sm">{asset.symbol}</div>
                        <div className="text-xs text-muted-foreground">{asset.amount.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">${asset.value.toFixed(2)}</div>
                      <div className={`text-xs ${asset.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {asset.change >= 0 ? "+" : ""}
                        {asset.change}%
                      </div>
                    </div>
                  </div>
                ))}
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
            <div className="space-y-3">
              {walletData.assets.map((asset) => (
                <div
                  key={asset.symbol}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                      <span className="font-bold">{asset.symbol.slice(0, 2)}</span>
                    </div>
                    <div>
                      <div className="font-semibold">{asset.symbol}</div>
                      <div className="text-sm text-muted-foreground">{asset.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${asset.value.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">
                      {asset.amount.toLocaleString()} {asset.symbol}
                    </div>
                    <div className={`text-sm ${asset.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {asset.change >= 0 ? "+" : ""}
                      {asset.change}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {selectedTab === "activity" && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">{t("trading_activity")}</h3>
            <div className="space-y-3">
              {tradingActivity.map((trade) => (
                <div key={trade.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{trade.market}</div>
                    <div className="text-sm text-muted-foreground">{trade.position}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          trade.status === "active"
                            ? "bg-blue-100 text-blue-700"
                            : trade.outcome === "won"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {trade.status === "active" ? t("active") : trade.outcome === "won" ? t("won") : t("lost")}
                      </span>
                      <span className="text-xs text-muted-foreground">{trade.date}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${trade.amount}</div>
                    <div className={`font-semibold ${trade.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {trade.status === "active" ? t("pending") : `${trade.pnl >= 0 ? "+" : ""}$${trade.pnl.toFixed(2)}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {selectedTab === "performance" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="text-sm text-muted-foreground mb-2">Total Volume</div>
              <div className="text-2xl font-bold">${performanceStats.totalVolume.toLocaleString()}</div>
            </Card>
            <Card className="p-6">
              <div className="text-sm text-muted-foreground mb-2">Best Trade</div>
              <div className="text-2xl font-bold text-green-600">+${performanceStats.bestTrade}</div>
            </Card>
            <Card className="p-6">
              <div className="text-sm text-muted-foreground mb-2">Worst Trade</div>
              <div className="text-2xl font-bold text-red-600">${performanceStats.worstTrade}</div>
            </Card>
            <Card className="p-6">
              <div className="text-sm text-muted-foreground mb-2">Avg Trade</div>
              <div className="text-2xl font-bold">${performanceStats.avgTrade}</div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
