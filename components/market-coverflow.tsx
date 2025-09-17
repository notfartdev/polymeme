"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Users, Clock } from "lucide-react"
import { useI18n } from "@/lib/i18n"

interface Market {
  id: string
  title: string
  title_zh?: string
  description: string
  description_zh?: string
  yesPrice: number
  noPrice: number
  volume: string
  participants: number
  endDate: string
  category: string
  trending: "up" | "down" | "stable"
}

const mockMarkets: Market[] = [
  {
    id: "1",
    title: "Will $PUMP reach $100B market cap by 2026?",
    title_zh: "到 2026 年 $PUMP 的市值会达到 1000 亿美元吗？",
    description: "Pump.fun token hitting massive market cap milestone",
    description_zh: "Pump.fun 代币冲击千亿美元市值里程碑",
    yesPrice: 0.23,
    noPrice: 0.77,
    volume: "$2.4M",
    participants: 1247,
    endDate: "Dec 31, 2026",
    category: "Meme Coin",
    trending: "up",
  },
  {
    id: "2",
    title: "Will $BONK flip $DOGE by end of 2025?",
    title_zh: "$BONK 会在 2025 年底超越 $DOGE 吗？",
    description: "Solana's top dog vs the original meme coin",
    description_zh: "Solana 新贵对阵梗币元老",
    yesPrice: 0.15,
    noPrice: 0.85,
    volume: "$890K",
    participants: 892,
    endDate: "Dec 31, 2025",
    category: "Meme Coin",
    trending: "up",
  },
  {
    id: "3",
    title: "Will $WIF hit $10 before $PEPE hits $1?",
    title_zh: "$WIF 会先到 $10 还是 $PEPE 先到 $1？",
    description: "The battle of the meme coins continues",
    description_zh: "梗币之战仍在继续",
    yesPrice: 0.67,
    noPrice: 0.33,
    volume: "$1.2M",
    participants: 634,
    endDate: "Dec 31, 2025",
    category: "Meme Coin",
    trending: "down",
  },
  {
    id: "4",
    title: "Will Solana have more daily users than Ethereum?",
    title_zh: "Solana 的日活会超过以太坊吗？",
    description: "The flippening but for daily active users",
    description_zh: "不谈市值，只看日活的“翻转时刻”",
    yesPrice: 0.42,
    noPrice: 0.58,
    volume: "$567K",
    participants: 423,
    endDate: "Jun 30, 2025",
    category: "Solana",
    trending: "stable",
  },
  {
    id: "5",
    title: "Will $BOME reach $1B market cap in 2025?",
    title_zh: "$BOME 会在 2025 年达到 10 亿美元市值吗？",
    description: "Book of Meme hitting the billion dollar club",
    description_zh: "Book of Meme 冲击十亿美元俱乐部",
    yesPrice: 0.31,
    noPrice: 0.69,
    volume: "$3.1M",
    participants: 1856,
    endDate: "Dec 31, 2025",
    category: "Meme Coin",
    trending: "up",
  },
  {
    id: "6",
    title: "Will a new meme coin launch on Pump.fun hit $1B?",
    title_zh: "Pump.fun 上的新梗币会冲到 10 亿美元吗？",
    description: "Next billion dollar meme coin from Pump.fun",
    description_zh: "下一只十亿美元梗币会从 Pump.fun 诞生吗",
    yesPrice: 0.78,
    noPrice: 0.22,
    volume: "$1.8M",
    participants: 967,
    endDate: "Dec 31, 2025",
    category: "Pump.fun",
    trending: "up",
  },
  {
    id: "7",
    title: "Will $SLERF recover to all-time high?",
    title_zh: "$SLERF 能回到历史新高吗？",
    description: "The sloth that accidentally burned LP tokens",
    description_zh: "那只意外烧了 LP 的树懒还能翻身吗",
    yesPrice: 0.19,
    noPrice: 0.81,
    volume: "$2.7M",
    participants: 1543,
    endDate: "Dec 31, 2025",
    category: "Meme Coin",
    trending: "down",
  },
  {
    id: "8",
    title: "Will Jupiter ($JUP) reach $50 by 2026?",
    title_zh: "Jupiter ($JUP) 到 2026 年会涨到 $50 吗？",
    description: "Solana's DEX aggregator token price prediction",
    description_zh: "Solana 聚合交易所代币的价格预测",
    yesPrice: 0.38,
    noPrice: 0.62,
    volume: "$1.1M",
    participants: 789,
    endDate: "Dec 31, 2026",
    category: "Solana",
    trending: "stable",
  },
  {
    id: "9",
    title: "Will $MYRO become the top cat coin on Solana?",
    title_zh: "$MYRO 会成为 Solana 上最强“猫币”吗？",
    description: "Rudolph's cat vs all other feline competitors",
    description_zh: "鲁道夫之猫对决所有猫系对手",
    yesPrice: 0.55,
    noPrice: 0.45,
    volume: "$934K",
    participants: 612,
    endDate: "Jun 30, 2025",
    category: "Meme Coin",
    trending: "up",
  },
  {
    id: "10",
    title: "Will Solana process 1M TPS in 2025?",
    title_zh: "Solana 会在 2025 年达到 100 万 TPS 吗？",
    description: "The ultimate scalability milestone for SOL",
    description_zh: "SOL 的终极扩展性里程碑",
    yesPrice: 0.29,
    noPrice: 0.71,
    volume: "$1.5M",
    participants: 1134,
    endDate: "Dec 31, 2025",
    category: "Solana",
    trending: "stable",
  },
]

export function MarketCoverflow() {
  const { t, locale } = useI18n()
  const [currentIndex, setCurrentIndex] = useState(2)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const startX = useRef(0)
  const scrollLeft = useRef(0)

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 1 : -1
      setCurrentIndex((prev) => {
        const newIndex = prev + delta
        if (newIndex < 0) return mockMarkets.length - 1
        if (newIndex >= mockMarkets.length) return 0
        return newIndex
      })
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        setCurrentIndex((prev) => (prev - 1 + mockMarkets.length) % mockMarkets.length)
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        setCurrentIndex((prev) => (prev + 1) % mockMarkets.length)
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false })
    }

    // Add keyboard event listener to document
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      if (container) {
        container.removeEventListener("wheel", handleWheel)
      }
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    startX.current = e.pageX
    scrollLeft.current = currentIndex
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    e.preventDefault()
    const x = e.pageX
    const walk = (startX.current - x) / 80 // Reduced from 100 to 80 for better sensitivity
    const newIndex = Math.round(scrollLeft.current + walk)

    if (newIndex >= 0 && newIndex < mockMarkets.length) {
      setCurrentIndex(newIndex)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const getCardStyle = (index: number) => {
    const distance = Math.abs(index - currentIndex)
    const isCenter = index === currentIndex
    
    // Mobile: smaller spacing and no 3D rotation
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
    const cardSpacing = isMobile ? 240 : 320
    const rotation = isMobile ? 0 : (index - currentIndex) * -25
    const translateZ = isMobile ? 0 : (isCenter ? 0 : -100)
    
    // Limit the number of visible cards to prevent overflow
    const maxVisibleDistance = isMobile ? 1 : 2
    if (distance > maxVisibleDistance) {
      return {
        transform: `translateX(${(index - currentIndex) * cardSpacing}px) scale(0) rotateY(${rotation}deg) translateZ(${translateZ}px)`,
        opacity: 0,
        zIndex: 0,
        pointerEvents: 'none' as const,
      }
    }

    return {
      transform: `
        translateX(${(index - currentIndex) * cardSpacing}px) 
        rotateY(${rotation}deg) 
        scale(${isCenter ? 1 : 0.8})
        translateZ(${translateZ}px)
      `,
      opacity: distance > maxVisibleDistance ? 0 : isCenter ? 1 : 0.6,
      zIndex: isCenter ? 10 : 10 - distance,
    }
  }

  return (
    <div className="relative w-full h-[400px] sm:h-[450px] md:h-[500px] bg-gradient-to-b from-background to-muted/20 px-4 sm:px-8 md:px-20 lg:px-40 overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center perspective-1000">
        <div
          ref={containerRef}
          className="relative w-full h-full flex items-center justify-center overflow-hidden"
          style={{ perspective: "1000px" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {mockMarkets.map((market, index) => (
            <Card
              key={market.id}
              className="absolute w-72 sm:w-80 h-80 sm:h-96 cursor-pointer transition-all duration-500 ease-out hover:shadow-xl border-2 hover:border-primary/50"
              style={getCardStyle(index)}
              onClick={() => setCurrentIndex(index)}
            >
              <CardContent className="p-4 sm:p-6 md:p-7 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="secondary" className="text-xs bg-violet-400 text-white hover:bg-violet-500">
                      {market.category === "Meme Coin"
                        ? t("category_meme")
                        : market.category === "Solana"
                        ? t("category_solana")
                        : market.category === "Pump.fun"
                        ? t("category_pumpfun")
                        : market.category}
                    </Badge>
                    <div className="flex items-center gap-1">
                      {market.trending === "up" && <TrendingUp className="w-4 h-4 text-green-500" />}
                      {market.trending === "down" && <TrendingDown className="w-4 h-4 text-red-500" />}
                    </div>
                  </div>

                  <h3 className="font-semibold text-base sm:text-lg text-card-foreground mb-2 line-clamp-2 text-balance">
                    {locale === "zh" && market.title_zh ? market.title_zh : market.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-muted-foreground mb-4 line-clamp-2">{locale === "zh" && market.description_zh ? market.description_zh : market.description}</p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      className="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-center rounded-md cursor-pointer transition-all hover:opacity-90 text-white shadow-lg hover:shadow-green-500/80"
                      style={{
                        backgroundColor: "#10b981",
                        color: "#ffffff",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    >
                      {t("yes")} {(market.yesPrice * 100).toFixed(1)}%
                    </button>
                    <button
                      className="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-center rounded-md cursor-pointer transition-all hover:bg-red-50 shadow-lg hover:shadow-red-500/80"
                      style={{
                        backgroundColor: "#ffffff",
                        color: "#dc2626",
                        border: "1px solid #f87171",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    >
                      {t("no")} {(market.noPrice * 100).toFixed(1)}%
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span className="text-foreground hidden sm:inline">{market.participants.toLocaleString()}</span>
                      <span className="text-foreground sm:hidden">{Math.floor(market.participants / 1000)}k</span>
                    </div>
                    <div className="font-medium text-foreground">{market.volume}</div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span className="text-foreground hidden sm:inline">{market.endDate}</span>
                      <span className="text-foreground sm:hidden">{market.endDate.split(',')[0]}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Indicators */}
      <div className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2">
        {mockMarkets.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex ? "bg-primary" : "bg-muted-foreground/30"
            }`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  )
}
