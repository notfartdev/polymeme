"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Trophy, TrendingUp, TrendingDown, Activity, Medal, Crown, Target } from "lucide-react"
import Header from "@/components/header"
import { useI18n } from "@/lib/i18n"

// Mock leaderboard data
const leaderboardData = {
  pnl: [
    {
      rank: 1,
      username: "CryptoKing",
      address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkv",
      pnl: 15420.5,
      winRate: 78,
      trades: 156,
      volume: 89500,
    },
    {
      rank: 2,
      username: "PredictorPro",
      address: "9yMNvg3DX98f45TXJSDpbD5jBkheTqA83TZRuJosgHkv",
      pnl: 12850.25,
      winRate: 72,
      trades: 134,
      volume: 76200,
    },
    {
      rank: 3,
      username: "MarketMaster",
      address: "5zLKtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkv",
      pnl: 9675.8,
      winRate: 69,
      trades: 98,
      volume: 54300,
    },
    {
      rank: 4,
      username: "TradingGuru",
      address: "3wJXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkv",
      pnl: 8234.15,
      winRate: 65,
      trades: 87,
      volume: 45600,
    },
    {
      rank: 5,
      username: "BetMaster",
      address: "8vKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkv",
      pnl: 7456.9,
      winRate: 71,
      trades: 76,
      volume: 38900,
    },
    {
      rank: 6,
      username: "ProfitHunter",
      address: "4uMXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkv",
      pnl: 6789.45,
      winRate: 63,
      trades: 92,
      volume: 42100,
    },
    {
      rank: 7,
      username: "SmartTrader",
      address: "6tNXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkv",
      pnl: 5432.1,
      winRate: 68,
      trades: 65,
      volume: 31200,
    },
    {
      rank: 8,
      username: "WinStreak",
      address: "2rLXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkv",
      pnl: 4567.85,
      winRate: 74,
      trades: 58,
      volume: 28700,
    },
    {
      rank: 9,
      username: "AlphaTrader",
      address: "1qKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkv",
      pnl: 3890.25,
      winRate: 61,
      trades: 73,
      volume: 35400,
    },
    {
      rank: 10,
      username: "BullRun",
      address: "9pJXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkv",
      pnl: 3245.6,
      winRate: 66,
      trades: 49,
      volume: 24800,
    },
  ],
  volume: [
    {
      rank: 1,
      username: "VolumeKing",
      address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkv",
      volume: 156780,
      pnl: 8945.3,
      winRate: 64,
      trades: 234,
    },
    {
      rank: 2,
      username: "HighRoller",
      address: "9yMNvg3DX98f45TXJSDpbD5jBkheTqA83TZRuJosgHkv",
      volume: 134560,
      pnl: 7234.5,
      winRate: 59,
      trades: 198,
    },
    {
      rank: 3,
      username: "BigBetter",
      address: "5zLKtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkv",
      volume: 123450,
      pnl: 6789.2,
      winRate: 62,
      trades: 187,
    },
    {
      rank: 4,
      username: "CryptoKing",
      address: "3wJXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkv",
      volume: 89500,
      pnl: 15420.5,
      winRate: 78,
      trades: 156,
    },
    {
      rank: 5,
      username: "MarketMover",
      address: "8vKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkv",
      volume: 87650,
      pnl: 4567.8,
      winRate: 58,
      trades: 165,
    },
    {
      rank: 6,
      username: "PredictorPro",
      address: "4uMXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkv",
      volume: 76200,
      pnl: 12850.25,
      winRate: 72,
      trades: 134,
    },
    {
      rank: 7,
      username: "TradingBot",
      address: "6tNXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkv",
      volume: 65430,
      pnl: 3456.9,
      winRate: 55,
      trades: 189,
    },
    {
      rank: 8,
      username: "MarketMaster",
      address: "2rLXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkv",
      volume: 54300,
      pnl: 9675.8,
      winRate: 69,
      trades: 98,
    },
    {
      rank: 9,
      username: "ActiveTrader",
      address: "1qKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkv",
      volume: 48920,
      pnl: 2345.6,
      winRate: 53,
      trades: 145,
    },
    {
      rank: 10,
      username: "TradingGuru",
      address: "9pJXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkv",
      volume: 45600,
      pnl: 8234.15,
      winRate: 65,
      trades: 87,
    },
  ],
  losers: [
    {
      rank: 1,
      username: "BadLuck",
      address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkv",
      pnl: -8945.3,
      winRate: 23,
      trades: 156,
      volume: 45600,
    },
    {
      rank: 2,
      username: "RedPortfolio",
      address: "9yMNvg3DX98f45TXJSDpbD5jBkheTqA83TZRuJosgHkv",
      pnl: -7234.5,
      winRate: 28,
      trades: 134,
      volume: 38900,
    },
    {
      rank: 3,
      username: "LossLeader",
      address: "5zLKtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkv",
      pnl: -6789.2,
      winRate: 31,
      trades: 98,
      volume: 32100,
    },
    {
      rank: 4,
      username: "BearMarket",
      address: "3wJXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkv",
      pnl: -5432.1,
      winRate: 35,
      trades: 87,
      volume: 28700,
    },
    {
      rank: 5,
      username: "WrongWay",
      address: "8vKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkv",
      pnl: -4567.8,
      winRate: 29,
      trades: 76,
      volume: 24800,
    },
    {
      rank: 6,
      username: "Unlucky",
      address: "4uMXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkv",
      pnl: -3890.25,
      winRate: 33,
      trades: 65,
      volume: 21500,
    },
    {
      rank: 7,
      username: "DownTrend",
      address: "6tNXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkv",
      pnl: -3245.6,
      winRate: 37,
      trades: 58,
      volume: 19200,
    },
    {
      rank: 8,
      username: "RedZone",
      address: "2rLXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkv",
      pnl: -2876.45,
      winRate: 32,
      trades: 49,
      volume: 16800,
    },
    {
      rank: 9,
      username: "MinusMan",
      address: "1qKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkv",
      pnl: -2345.8,
      winRate: 39,
      trades: 43,
      volume: 14500,
    },
    {
      rank: 10,
      username: "LossKing",
      address: "9pJXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkv",
      pnl: -1987.3,
      winRate: 41,
      trades: 38,
      volume: 12300,
    },
  ],
}

export default function LeaderboardPage() {
  const { t } = useI18n()
  const [selectedTab, setSelectedTab] = useState("pnl")

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />
    return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  const getCurrentData = () => {
    switch (selectedTab) {
      case "pnl":
        return leaderboardData.pnl
      case "volume":
        return leaderboardData.volume
      case "losers":
        return leaderboardData.losers
      default:
        return leaderboardData.pnl
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-6">
        {/* Leaderboard Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Trophy className="h-8 w-8 text-yellow-500" />
            <h1 className="text-3xl font-bold text-foreground">{t("leaderboard_heading")}</h1>
          </div>
          <div className="text-sm text-muted-foreground">{t("updated_every")}</div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-sm text-muted-foreground">{t("top_performer")}</span>
            </div>
            <div className="text-2xl font-bold text-green-600">+$15,420.50</div>
            <div className="text-sm text-muted-foreground">CryptoKing</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-muted-foreground">{t("highest_volume_stat")}</span>
            </div>
            <div className="text-2xl font-bold">$156,780</div>
            <div className="text-sm text-muted-foreground">VolumeKing</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Target className="h-5 w-5 text-purple-600" />
              <span className="text-sm text-muted-foreground">{t("best_win_rate")}</span>
            </div>
            <div className="text-2xl font-bold">78%</div>
            <div className="text-sm text-muted-foreground">CryptoKing</div>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 border-b">
          {[
            { id: "pnl", label: t("tab_top_pnl"), icon: TrendingUp },
            { id: "volume", label: t("tab_highest_volume"), icon: Activity },
            { id: "losers", label: t("tab_loserboard"), icon: TrendingDown },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={selectedTab === tab.id ? "default" : "ghost"}
              onClick={() => setSelectedTab(tab.id)}
              className="rounded-b-none gap-2"
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Leaderboard Table */}
        <Card className="p-6">
          <div className="space-y-3">
            {getCurrentData().map((user) => (
              <div
                key={user.rank}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  user.rank <= 3 ? "bg-gradient-to-r from-yellow-50 to-transparent border-yellow-200" : "border-border"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12">{getRankIcon(user.rank)}</div>
                  <div>
                    <div className="font-semibold text-lg">{user.username}</div>
                    <div className="text-sm text-muted-foreground font-mono">{formatAddress(user.address)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  {selectedTab === "pnl" && (
                    <>
                      <div className="text-center">
                        <div className={`text-xl font-bold ${user.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {user.pnl >= 0 ? "+" : ""}${user.pnl.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">{t("label_pnl")}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold">{user.winRate}%</div>
                        <div className="text-xs text-muted-foreground">{t("label_win_rate")}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold">{user.trades}</div>
                        <div className="text-xs text-muted-foreground">{t("label_trades")}</div>
                      </div>
                    </>
                  )}

                  {selectedTab === "volume" && (
                    <>
                      <div className="text-center">
                        <div className="text-xl font-bold text-blue-600">${user.volume.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{t("label_volume")}</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-lg font-semibold ${user.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {user.pnl >= 0 ? "+" : ""}${user.pnl.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">{t("label_pnl")}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold">{user.trades}</div>
                        <div className="text-xs text-muted-foreground">{t("label_trades")}</div>
                      </div>
                    </>
                  )}

                  {selectedTab === "losers" && (
                    <>
                      <div className="text-center">
                        <div className="text-xl font-bold text-red-600">${user.pnl.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{t("label_loss")}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-red-600">{user.winRate}%</div>
                        <div className="text-xs text-muted-foreground">{t("label_win_rate")}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold">{user.trades}</div>
                        <div className="text-xs text-muted-foreground">{t("label_trades")}</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Footer Note */}
        <div className="text-center text-sm text-muted-foreground mt-6">{t("rankings_note")}</div>
      </div>
    </div>
  )
}
