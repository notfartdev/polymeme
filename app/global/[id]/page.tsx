"use client"

import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Header from "@/components/header"
import Link from "next/link"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useI18n } from "@/lib/i18n"

// Sample market data - in real app this would come from API
const marketData = {
  1: {
    id: 1,
    title: "Solana Up or Down - September 9, 11PM ET",
    description:
      "This market will resolve to 'Up' if the close price is greater than or equal to the open price for the SOL/USDT 1 hour candle...",
    icon: "🟣",
    price: 0.525,
    liquidity: 65000,
    volume: 533900,
    markets: 25,
    endDate: "9/20/2025",
    lastUpdate: "5:28:18 PM",
    category: "Crypto",
  },
}

// Sample chart data
const chartData = [
  { time: "00:00", yes: 0.45, no: 0.55 },
  { time: "04:00", yes: 0.48, no: 0.52 },
  { time: "08:00", yes: 0.52, no: 0.48 },
  { time: "12:00", yes: 0.49, no: 0.51 },
  { time: "16:00", yes: 0.53, no: 0.47 },
  { time: "20:00", yes: 0.525, no: 0.475 },
]

const multiMarketChartData = [
  {
    time: "00:00",
    germany: 0.45,
    turkey: 0.25,
    greece: 0.14,
    poland: 0.16,
    slovenia: 0.18,
    finland: 0.12,
  },
  {
    time: "04:00",
    germany: 0.48,
    turkey: 0.26,
    greece: 0.15,
    poland: 0.17,
    slovenia: 0.19,
    finland: 0.13,
  },
  {
    time: "08:00",
    germany: 0.52,
    turkey: 0.24,
    greece: 0.16,
    poland: 0.15,
    slovenia: 0.17,
    finland: 0.14,
  },
  {
    time: "12:00",
    germany: 0.49,
    turkey: 0.27,
    greece: 0.14,
    poland: 0.18,
    slovenia: 0.16,
    finland: 0.12,
  },
  {
    time: "16:00",
    germany: 0.53,
    turkey: 0.25,
    greece: 0.15,
    poland: 0.16,
    slovenia: 0.18,
    finland: 0.13,
  },
  {
    time: "20:00",
    germany: 0.525,
    turkey: 0.25,
    greece: 0.144,
    poland: 0.17,
    slovenia: 0.19,
    finland: 0.135,
  },
]

// Related markets data
const relatedMarkets = [
  {
    id: 2,
    title: "Will Germany win the 2025 EuroBasket Championship?",
    yesPrice: 0.525,
    noPrice: 0.475,
    outcome: "Even",
    volume: 401000,
    liquidity: 2470,
  },
  {
    id: 3,
    title: "Will Turkey win the 2025 EuroBasket Championship?",
    yesPrice: 0.25,
    noPrice: 0.75,
    outcome: "Unlikely",
    volume: 270000,
    liquidity: 2410,
  },
  {
    id: 4,
    title: "Will Greece win the 2025 EuroBasket Championship?",
    yesPrice: 0.144,
    noPrice: 0.856,
    outcome: "Unlikely",
    volume: 94400,
    liquidity: 340,
  },
]

export default function GlobalMarketDetailPage({ params }: { params: { id: string } }) {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState("information")
  const marketId = Number.parseInt(params.id)
  const market = marketData[marketId as keyof typeof marketData] || marketData[1]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <div className="container mx-auto px-4 py-6">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link
            href="/global"
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("back_to_global")}
          </Link>
        </div>

        {/* Market Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-4 mb-4">
            <span className="text-3xl">{market.icon}</span>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{market.title}</h1>
              <div className="flex flex-wrap gap-6 text-sm text-gray-600 dark:text-gray-400">
                <span>
                  Price: <span className="font-medium text-gray-900 dark:text-white">${market.price.toFixed(3)}</span>
                </span>
                <span>
                  Liquidity:{" "}
                  <span className="font-medium text-gray-900 dark:text-white">
                    ${(market.liquidity / 1000).toFixed(0)}k
                  </span>
                </span>
                <span>
                  Volume:{" "}
                  <span className="font-medium text-gray-900 dark:text-white">
                    ${(market.volume / 1000).toFixed(1)}k
                  </span>
                </span>
                <span>
                  Markets: <span className="font-medium text-gray-900 dark:text-white">{market.markets}</span>
                </span>
                <span>
                  End Date: <span className="font-medium text-gray-900 dark:text-white">{market.endDate}</span>
                </span>
                <span>
                  Last Update: <span className="font-medium text-gray-900 dark:text-white">{market.lastUpdate}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1 xl:w-3/4">
            {/* Price Chart */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{t("price_chart_title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    germany: {
                      label: "Germany",
                      color: "hsl(142, 76%, 36%)",
                    },
                    turkey: {
                      label: "Turkey",
                      color: "hsl(0, 84%, 60%)",
                    },
                    greece: {
                      label: "Greece",
                      color: "hsl(217, 91%, 60%)",
                    },
                    poland: {
                      label: "Poland",
                      color: "hsl(262, 83%, 58%)",
                    },
                    slovenia: {
                      label: "Slovenia",
                      color: "hsl(43, 96%, 56%)",
                    },
                    finland: {
                      label: "Finland",
                      color: "hsl(173, 58%, 39%)",
                    },
                  }}
                  className="h-[500px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={multiMarketChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={[0, 1]} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="germany"
                        stroke="var(--color-germany)"
                        strokeWidth={2}
                        name="Germany"
                      />
                      <Line
                        type="monotone"
                        dataKey="turkey"
                        stroke="var(--color-turkey)"
                        strokeWidth={2}
                        name="Turkey"
                      />
                      <Line
                        type="monotone"
                        dataKey="greece"
                        stroke="var(--color-greece)"
                        strokeWidth={2}
                        name="Greece"
                      />
                      <Line
                        type="monotone"
                        dataKey="poland"
                        stroke="var(--color-poland)"
                        strokeWidth={2}
                        name="Poland"
                      />
                      <Line
                        type="monotone"
                        dataKey="slovenia"
                        stroke="var(--color-slovenia)"
                        strokeWidth={2}
                        name="Slovenia"
                      />
                      <Line
                        type="monotone"
                        dataKey="finland"
                        stroke="var(--color-finland)"
                        strokeWidth={2}
                        name="Finland"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="information">{t("tab_information")}</TabsTrigger>
                <TabsTrigger value="positions">{t("tab_positions")}</TabsTrigger>
                <TabsTrigger value="trades">{t("tab_trades")}</TabsTrigger>
                <TabsTrigger value="news">{t("tab_news")}</TabsTrigger>
              </TabsList>

              <TabsContent value="information" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t("tab_information")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-2">{t("description_label")}</h3>
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        This is a polymarket to predict which team will win the 2025 EuroBasket Championship. If the
                        listed team wins the 2025 EuroBasket Championship, this market will resolve to "Yes." Otherwise,
                        it will resolve to "No." If the listed team is eliminated from contention from the EuroBasket
                        Championship based on the official rules of the tournament, the relevant market will resolve to
                        "No." If the 2025 EuroBasket Championship is canceled or not completed by November 1, 2025, this
                        market will resolve to "Other." The primary resolution source for this market will be official
                        results published by FIBA Europe. A consensus of credible reporting may also be used.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{t("total_volume")}</div>
                        <div className="font-semibold">${(market.volume / 1000).toFixed(1)}k</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{t("liquidity_label")}</div>
                        <div className="font-semibold">${(market.liquidity / 1000).toFixed(0)}k</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{t("markets_label")}</div>
                        <div className="font-semibold">{market.markets}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{t("end_date_label")}</div>
                        <div className="font-semibold">{market.endDate}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="positions" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <p className="text-center text-gray-500 dark:text-gray-400">{t("no_positions")}</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="trades" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <p className="text-center text-gray-500 dark:text-gray-400">{t("no_trades")}</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="news" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <p className="text-center text-gray-500 dark:text-gray-400">{t("no_news")}</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="xl:w-1/4 xl:min-w-[300px]">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {t("sidebar_markets")}
                  <Badge variant="secondary">{t("active_markets_count", { count: 24 })}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
                {relatedMarkets.map((relatedMarket) => (
                  <Link
                    key={relatedMarket.id}
                    href={`/global/${relatedMarket.id}`}
                    className="block p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <h4 className="font-medium text-sm mb-2 line-clamp-2">{relatedMarket.title}</h4>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex gap-1">
                        <span className="text-green-600">{relatedMarket.yesPrice.toFixed(3)}</span>
                        <span className="text-gray-400">/</span>
                        <span className="text-red-600">{relatedMarket.noPrice.toFixed(3)}</span>
                      </div>
                      <Badge
                        variant="secondary"
                        className={
                          relatedMarket.outcome === "Even"
                            ? "bg-yellow-100 text-yellow-800"
                            : relatedMarket.outcome === "Unlikely"
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                        }
                      >
                        {relatedMarket.outcome}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{t("vol_short")} ${(relatedMarket.volume / 1000).toFixed(0)}k</span>
                      <span>{t("liq_short")} ${relatedMarket.liquidity}</span>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
