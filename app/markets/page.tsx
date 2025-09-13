"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, TrendingUp, Bookmark, Share2, Hash, Clock, Users } from "lucide-react"
import Header from "@/components/header"
import Link from "next/link"
import { useI18n } from "@/lib/i18n"
import { format } from "date-fns"
import { CoinGeckoAPI, TokenData } from "@/lib/coingecko"

const categories = ["All", "Trending", "Politics", "Sports", "Crypto", "Tech", "Culture", "World", "Economy"]

// Interface for real market data
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

// Mock markets for demo (will be replaced by real data)
const mockMarkets = [
  {
    id: 1,
    question: "Fed decision in September?",
    category: "Economy",
    image: "/placeholder-n8e73.png",
    options: [
      { name: "50 bps decrease", percentage: 11, type: "yes" },
      { name: "25 bps decrease", percentage: 87, type: "yes" },
    ],
    volume: "$107m",
    trending: true,
  },
  {
    id: 2,
    question: "New York City Mayoral Election",
    category: "Politics",
    image: "/placeholder-qmqsm.png",
    options: [
      { name: "Zohran Mamdani", percentage: 81, type: "yes" },
      { name: "Andrew Cuomo", percentage: 17, type: "yes" },
    ],
    volume: "$66m",
  },
  {
    id: 3,
    question: "Skye Valadez confirmed perp?",
    category: "Culture",
    image: "/person-silhouette.png",
    percentage: 13,
    volume: "$365k",
  },
  {
    id: 4,
    question: "Super Bowl Champion 2026",
    category: "Sports",
    image: "/super-bowl-trophy.jpg",
    options: [
      { name: "Buffalo", percentage: 14, type: "yes" },
      { name: "Baltimore", percentage: 13, type: "yes" },
    ],
    volume: "$46m",
  },
  {
    id: 5,
    question: "Who will win the USDH ticker?",
    category: "Crypto",
    image: "/cryptocurrency-token.png",
    options: [
      { name: "Native Markets", percentage: 96, type: "yes" },
      { name: "Paxos", percentage: 4, type: "yes" },
    ],
    volume: "$4m",
  },
  {
    id: 6,
    question: "Will Russia invade a NATO country in 2025?",
    category: "World",
    image: "/placeholder-azlmv.png",
    percentage: 7,
    volume: "$346k",
  },
  {
    id: 7,
    question: "US x Venezuela military engagement by...?",
    category: "World",
    image: "/military-flags.jpg",
    options: [
      { name: "October 31", percentage: 23, type: "yes" },
      { name: "December 31", percentage: 38, type: "yes" },
    ],
    volume: "$1m",
  },
  {
    id: 8,
    question: "Elon no longer world's richest before 2026?",
    category: "Tech",
    image: "/elon-musk-inspired-visionary.png",
    percentage: 56,
    volume: "$493k",
  },
  {
    id: 9,
    question: "Will Eric Adams drop out?",
    category: "Politics",
    image: "/placeholder-kw8si.png",
    percentage: 62,
    volume: "$1m",
  },
  {
    id: 10,
    question: "Boxing: Canelo Álvarez vs. Terence Crawford",
    category: "Sports",
    image: "/placeholder-s6nbq.png",
    options: [
      { name: "Canelo", percentage: 62, type: "yes" },
      { name: "Crawford", percentage: 38, type: "no" },
    ],
    volume: "$603k",
  },
  {
    id: 11,
    question: "Nobel Peace Prize Winner 2025",
    category: "Culture",
    image: "/placeholder-wizoz.png",
    options: [
      { name: "Sudan's Emergency...", percentage: 16, type: "yes" },
      { name: "Yulia Navalnaya", percentage: 12, type: "yes" },
    ],
    volume: "$4m",
  },
  {
    id: 12,
    question: "Israel strikes Iran by September 30?",
    category: "World",
    image: "/placeholder-yw14w.png",
    percentage: 11,
    volume: "$226k",
  },
]

export default function MarketsPage() {
  const { t } = useI18n()
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [realMarkets, setRealMarkets] = useState<MarketData[]>([])
  const [loading, setLoading] = useState(true)
  const [tokenImages, setTokenImages] = useState<Record<string, string>>({})

  // Fetch real markets from API
  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/markets')
        if (response.ok) {
          const markets = await response.json()
          setRealMarkets(markets)
          
          // Fetch token images for crypto markets
          const cryptoAssets = [...new Set(markets.map(m => m.asset).filter(Boolean))]
          if (cryptoAssets.length > 0) {
            const tokenData = await CoinGeckoAPI.getMultipleTokensData(cryptoAssets)
            const images: Record<string, string> = {}
            Object.entries(tokenData).forEach(([symbol, data]) => {
              if (data.image) {
                images[symbol] = data.image
              }
            })
            setTokenImages(images)
          }
        }
      } catch (error) {
        console.error('Error fetching markets:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMarkets()
  }, [])

  // Combine real markets with mock markets
  const allMarkets = [
    // Real markets (user-created)
    ...realMarkets.map(market => ({
      id: market.id,
      question: market.question,
      category: "Crypto", // All user-created markets are crypto for now
      image: null,
      percentage: 65, // Mock percentage for now
      volume: "$0", // Mock volume for now
      asset: market.asset,
      status: market.status,
      closingDate: market.closingDate,
      creator: market.creator,
      isReal: true
    })),
    // Mock markets (demo data)
    ...mockMarkets.map(market => ({
      ...market,
      isReal: false
    }))
  ]

  const filteredMarkets = allMarkets.filter((market) => {
    const matchesCategory = selectedCategory === "All" || market.category === selectedCategory
    const matchesSearch = market.question.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Markets Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-foreground">{t("markets_heading")}</h1>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={t("search_markets")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
            </div>
          </div>

          {/* Category Navigation */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "ghost"}
                onClick={() => setSelectedCategory(category)}
                className="whitespace-nowrap"
              >
                {category === "Trending" && <TrendingUp className="w-4 h-4 mr-2" />}
                {t((`cat_${category}` as unknown) as any)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Markets Grid */}
      <div className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading markets...</p>
            </div>
          </div>
        ) : filteredMarkets.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <Hash className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No markets found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "Try adjusting your search terms" : "Be the first to create a market!"}
            </p>
            <Link href="/create-market">
              <Button>Create Market</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredMarkets.map((market) => {
            const mainPercentage = market.percentage || (market.options ? market.options[0].percentage : 50)

            return (
              <Link key={market.id} href={`/markets/${market.id}`}>
                <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer bg-card border-border">
                  {/* Header with image and question */}
                  <div className="flex items-start gap-3 mb-4">
                    {market.isReal ? (
                      // Real market - show token image if available, otherwise hash icon
                      tokenImages[market.asset] ? (
                        <img
                          src={tokenImages[market.asset]}
                          alt={market.asset}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          onError={(e) => {
                            // Fallback to hash icon if image fails to load
                            e.currentTarget.style.display = 'none'
                            e.currentTarget.nextElementSibling?.classList.remove('hidden')
                          }}
                        />
                      ) : null
                    ) : (
                      // Mock market - show image
                      <img
                        src={market.image || "/placeholder.svg"}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                    )}
                    {/* Fallback hash icon for real markets when no token image */}
                    {market.isReal && !tokenImages[market.asset] && (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <Hash className="h-5 w-5 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {market.isReal && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            {market.asset}
                          </span>
                        )}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          market.status === 'active' ? 'bg-green-100 text-green-800' :
                          market.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {market.status?.toUpperCase() || 'ACTIVE'}
                        </span>
                      </div>
                      <h3 className="font-semibold text-card-foreground text-sm leading-tight line-clamp-2">
                        {market.question}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => e.stopPropagation()}>
                        <Share2 className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => e.stopPropagation()}>
                        <Bookmark className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold text-green-400">{mainPercentage}%</span>
                      <span className="text-xs text-muted-foreground">{t("chance")}</span>
                    </div>

                    {/* Visual progress bar */}
                    <div className="w-full bg-muted rounded-full h-2 mb-3">
                      <div
                        className="bg-green-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${mainPercentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 mb-3">
                    <Button
                      size="sm"
                      className="flex-1 bg-green-200 hover:bg-green-300 text-green-900 hover:shadow-lg hover:shadow-green-300/50 dark:bg-green-800/40 dark:hover:bg-green-700/50 dark:text-green-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {t("yes_cap")}
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-red-200 hover:bg-red-300 text-red-900 hover:shadow-lg hover:shadow-red-300/50 dark:bg-red-800/40 dark:hover:bg-red-700/50 dark:text-red-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {t("no_cap")}
                    </Button>
                  </div>

                  {/* Volume and additional info */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{market.volume} {t("vol_abbrev")}</span>
                    {market.isReal && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{format(new Date(market.closingDate), "MMM dd")}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Creator info for real markets */}
                  {market.isReal && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                      <Users className="h-3 w-3" />
                      <span>by {market.creator}</span>
                    </div>
                  )}
                </Card>
              </Link>
            )
          })}
          </div>
        )}
      </div>
    </div>
  )
}
