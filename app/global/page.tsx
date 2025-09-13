"use client"

import { useState } from "react"
import { Star, Filter, TrendingUp, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Header from "@/components/header"
import Link from "next/link"
import { useI18n } from "@/lib/i18n"

const globalMarkets = [
  {
    id: 1,
    title: "Solana Up or Down - September 9, 11PM ET",
    description:
      "This market will resolve to 'Up' if the close price is greater than or equal to the open price for the SOL/USDT 1 hour candle...",
    icon: "🟣",
    yesPrice: 0.5,
    noPrice: 0.5,
    outcome: "No",
    outcomeType: "negative",
    volume: 11.2,
    liquidity: 1.0,
    endDate: "Ended",
    category: "Crypto",
  },
  {
    id: 2,
    title: "Tone: Ares' Rotten Tomatoes score?",
    description:
      "The market will resolve according to the Rotten Tomatoes 'Tomatometer' All Critics' Tomatometer score for 'Tone: Ares'...",
    icon: "🍅",
    yesPrice: 0.49,
    noPrice: 0.51,
    outcome: "Even",
    outcomeType: "neutral",
    volume: 115.1,
    liquidity: 1.42,
    endDate: "30d 14h",
    category: "Entertainment",
  },
  {
    id: 3,
    title: "Conference USA Championship Game Winner",
    description:
      "This is a polymarket to predict which team will win the 2025 NCAA Football Conference USA Championship Game...",
    icon: "🏈",
    yesPrice: 0.615,
    noPrice: 0.385,
    outcome: "Likely",
    outcomeType: "positive",
    volume: 9.0,
    liquidity: 0.5,
    endDate: "48d 14h",
    category: "Sports",
  },
  {
    id: 4,
    title: "Como vs. Genoa",
    description:
      "This event is for the upcoming SEA game, scheduled for September 15 at 2:45PM ET between Como and Genoa...",
    icon: "⚽",
    yesPrice: 0.57,
    noPrice: 0.43,
    outcome: "Even",
    outcomeType: "neutral",
    volume: 135.5,
    liquidity: 2.1,
    endDate: "3d 9h",
    category: "Sports",
  },
  {
    id: 5,
    title: "XRP Up or Down - September 9, 7PM ET",
    description:
      "This market will resolve to 'Up' if the close price is greater than or equal to the open price for the XRP/USDT 1 hour candle...",
    icon: "🔷",
    yesPrice: 0.5,
    noPrice: 0.5,
    outcome: "No",
    outcomeType: "negative",
    volume: 11.2,
    liquidity: 1.0,
    endDate: "Ended",
    category: "Crypto",
  },
  {
    id: 6,
    title: "Ethereum Up or Down - September 9, 6PM ET",
    description:
      "This market will resolve to 'Up' if the close price is greater than or equal to the open price for the ETH/USDT 1 hour candle...",
    icon: "🔹",
    yesPrice: 0.5,
    noPrice: 0.5,
    outcome: "No",
    outcomeType: "negative",
    volume: 11.7,
    liquidity: 1.05,
    endDate: "Ended",
    category: "Crypto",
  },
]

export default function GlobalPage() {
  const { t } = useI18n()
  const [selectedFilter, setSelectedFilter] = useState("All Time")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [favorites, setFavorites] = useState<number[]>([])

  const toggleFavorite = (marketId: number) => {
    setFavorites((prev) => (prev.includes(marketId) ? prev.filter((id) => id !== marketId) : [...prev, marketId]))
  }

  const getOutcomeBadgeColor = (type: string) => {
    switch (type) {
      case "positive":
        return "bg-green-600 text-white"
      case "negative":
        return "bg-red-600 text-white"
      case "neutral":
        return "bg-yellow-600 text-white"
      default:
        return "bg-gray-600 text-white"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t("global_heading")}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t("global_sub")}</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("source")}</span>
            <Button variant="outline" size="sm" className="bg-purple-600 text-white border-purple-600">
              {t("polymarket")}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gray-500" />
            <Button
              variant={selectedFilter === "Trending" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFilter("Trending")}
            >
              {t("trending")}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <Button
              variant={selectedFilter === "All Time" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFilter("All Time")}
            >
              {t("all_time")}
            </Button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Filter className="h-4 w-4 text-gray-500" />
            <Button variant="outline" size="sm">
              {t("filters")}
              <Badge variant="secondary" className="ml-2">
                1
              </Badge>
            </Button>
          </div>
        </div>

        {/* Markets Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300">
            <div className="col-span-5">{t("table_market", { count: 100 })}</div>
            <div className="col-span-2 text-center">{t("table_prices")}</div>
            <div className="col-span-1 text-center">{t("table_outcome")}</div>
            <div className="col-span-1 text-center">{t("table_volume")}</div>
            <div className="col-span-1 text-center">{t("table_liquidity")}</div>
            <div className="col-span-2 text-center">{t("table_end_date")}</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {globalMarkets.map((market) => (
              <Link
                key={market.id}
                href={`/global/${market.id}`}
                className="grid grid-cols-12 gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer block"
              >
                {/* Market Info */}
                <div className="col-span-5 flex items-start gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{market.icon}</span>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        toggleFavorite(market.id)
                      }}
                      className="text-gray-400 hover:text-yellow-500 transition-colors"
                    >
                      <Star
                        className={`h-4 w-4 ${favorites.includes(market.id) ? "fill-yellow-500 text-yellow-500" : ""}`}
                      />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white text-sm leading-tight mb-1">
                      {market.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{market.description}</p>
                  </div>
                </div>

                {/* Prices */}
                <div className="col-span-2 flex items-center justify-center">
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-sm">
                      <span className="text-green-600 font-medium">{market.yesPrice.toFixed(3)}</span>
                      <span className="text-gray-400">/</span>
                      <span className="text-red-600 font-medium">{market.noPrice.toFixed(3)}</span>
                    </div>
                    <div className="w-16 h-1 bg-gray-200 dark:bg-gray-600 rounded-full mt-1">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-red-500 rounded-full"
                        style={{ width: `${market.yesPrice * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Outcome */}
                <div className="col-span-1 flex items-center justify-center">
                  <Badge className={getOutcomeBadgeColor(market.outcomeType)}>{market.outcome}</Badge>
                </div>

                {/* Volume */}
                <div className="col-span-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{market.volume.toFixed(1)}K</div>
                    <div className="text-xs text-red-500">↓ 0.0%</div>
                  </div>
                </div>

                {/* Liquidity */}
                <div className="col-span-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {market.liquidity.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">core</div>
                  </div>
                </div>

                {/* End Date */}
                <div className="col-span-2 flex items-center justify-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400">{market.endDate}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Load More */}
        <div className="flex justify-center mt-8">
          <Button variant="outline" className="px-8 bg-transparent">
            {t("load_more")}
          </Button>
        </div>
      </div>
    </div>
  )
}
