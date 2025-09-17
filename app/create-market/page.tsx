"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CalendarIcon, Wallet, CheckCircle, HelpCircle, Users, Hash, CalendarIcon as CalendarIcon2, Clock, Twitter, MessageCircle, Copy, Share, X as CloseIcon, ExternalLink, Send } from "lucide-react"
import { format } from "date-fns"
import Header from "@/components/header"
import { useI18n } from "@/lib/i18n"
import { marketApi, handleApiError, CreateMarketRequest } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useRouter, useSearchParams } from "next/navigation"
import { CoinGeckoAPI, TokenData } from "@/lib/coingecko"
import { TokenInfoCard } from "@/components/token-info-card"
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletAssets } from '@/hooks/use-wallet-assets'
import { WalletGuard } from '@/components/wallet-guard'

// Wallet assets will be fetched from the user's actual wallet

// Time-based prediction suggestions for memecoins
const getTimeBasedSuggestions = (tokenData: TokenData | null, tokenSymbol: string, timeframe: string) => {
  if (!tokenData || !tokenData.current_price) {
    return [`Will ${tokenSymbol} pump 10%+ in the next ${timeframe}?`]
  }
  
  const currentPrice = tokenData.current_price
  const priceChange24h = tokenData.price_change_percentage_24h || 0
  const suggestions = []
  
  // Calculate realistic targets based on timeframe and volatility
  const getVolatilityMultiplier = (timeframe: string) => {
    switch (timeframe) {
      case '1H': return 0.02  // 2% max in 1 hour (more realistic)
      case '3H': return 0.05  // 5% max in 3 hours  
      case '6H': return 0.10  // 10% max in 6 hours
      case '12H': return 0.15 // 15% max in 12 hours
      case '24H': return 0.25 // 25% max in 24 hours (realistic for memecoins)
      default: return 0.10
    }
  }
  
  const volatility = getVolatilityMultiplier(timeframe)
  const bullishTarget = (currentPrice * (1 + volatility)).toFixed(4)
  const bearishTarget = (currentPrice * (1 - volatility)).toFixed(4)
  const moderateTarget = (currentPrice * (1 + volatility * 0.5)).toFixed(4)
  
  // Price-based suggestions (more realistic)
  const percentageTarget = Math.round(volatility * 100)
  suggestions.push(
    `Will ${tokenSymbol} reach $${bullishTarget} in the next ${timeframe}?`,
    `Will ${tokenSymbol} drop below $${bearishTarget} in the next ${timeframe}?`,
    `Will ${tokenSymbol} pump ${percentageTarget}%+ in the next ${timeframe}?`
  )
  
  // Volume-based suggestions (if available)
  if (tokenData.total_volume) {
    const currentVolume = tokenData.total_volume
    const volumeTarget = (currentVolume * 2).toLocaleString()
    suggestions.push(`Will ${tokenSymbol} volume exceed $${volumeTarget} in the next ${timeframe}?`)
  }
  
  // Market cap suggestions
  if (tokenData.market_cap) {
    const currentMC = tokenData.market_cap
    const mcTarget = (currentMC * 1.2).toLocaleString()
    suggestions.push(`Will ${tokenSymbol} market cap exceed $${mcTarget} in the next ${timeframe}?`)
  }
  
  // Trend-based suggestions
  if (priceChange24h > 0) {
    suggestions.push(`Will ${tokenSymbol} continue its uptrend in the next ${timeframe}?`)
  } else {
    suggestions.push(`Will ${tokenSymbol} reverse its downtrend in the next ${timeframe}?`)
  }
  
  return suggestions
}

// Enhanced smart suggestions based on real-time data and events
const getSmartSuggestions = (tokenData: TokenData | null, tokenSymbol: string) => {
  if (!tokenData) {
    return [
      `Will ${tokenSymbol} reach $0.01 by end of 2024?`,
      `Will ${tokenSymbol} be listed on Binance by end of 2024?`,
      `Will ${tokenSymbol} pump 100%+ in the next 30 days?`,
    ]
  }
  
  const suggestions = []
  const currentPrice = tokenData.current_price
  const ath = tokenData.ath
  const marketCap = tokenData.market_cap
  
  // Price-based suggestions
  if (currentPrice > 0) {
    const doublePrice = (currentPrice * 2).toFixed(4)
    const tenXPrice = (currentPrice * 10).toFixed(4)
    const halfPrice = (currentPrice * 0.5).toFixed(4)
    
    suggestions.push(
      `Will ${tokenSymbol} reach $${doublePrice} by end of 2024?`,
      `Will ${tokenSymbol} 10x to $${tenXPrice} by Q2 2025?`,
      `Will ${tokenSymbol} drop below $${halfPrice} by end of 2024?`
    )
  }
  
  if (ath > 0) {
    suggestions.push(`Will ${tokenSymbol} break its ATH of $${ath.toFixed(4)} by end of 2024?`)
  }
  
  // Market cap based suggestions
  if (marketCap > 0) {
    suggestions.push(
      marketCap > 1e9 ? 
        `Will ${tokenSymbol} reach $${(marketCap * 2 / 1e9).toFixed(1)}B market cap by 2025?` :
        `Will ${tokenSymbol} reach $1B market cap by 2025?`
    )
  }
  
  // Always add these general suggestions
  suggestions.push(
    `Will ${tokenSymbol} be listed on Binance by end of 2024?`,
    `Will ${tokenSymbol} be listed on Coinbase by Q2 2025?`,
    `Will ${tokenSymbol} pump 100%+ in the next 30 days?`,
    `Will ${tokenSymbol} survive the next bear market?`
  )
  
  return suggestions
}

// AI-assisted description suggestions based on specific question context
const getDescriptionSuggestions = (question: string, tokenData: TokenData | null, tokenSymbol: string) => {
  if (!question) return []
  
  const suggestions = []
  
  // Analyze question type and generate specific rules
  const isPriceQuestion = /\$[\d.,]+/.test(question)
  const isPercentageQuestion = /\d+%/.test(question)
  const isTimeframeQuestion = /(1H|3H|6H|12H|24H|hour|day|week|month)/i.test(question)
  const isVolumeQuestion = /volume/i.test(question)
  const isMarketCapQuestion = /market cap|marketcap/i.test(question)
  const isTrendQuestion = /(pump|dump|trend|continue|reverse)/i.test(question)
  
  // Extract specific values from question
  const priceMatch = question.match(/\$([\d.,]+)/)
  const percentageMatch = question.match(/(\d+)%/)
  const timeframeMatch = question.match(/(1H|3H|6H|12H|24H|hour|day|week|month)/i)
  
  // Generate context-specific descriptions
  if (isPriceQuestion && priceMatch) {
    const targetPrice = priceMatch[1]
    suggestions.push(
      `This market resolves to "YES" if ${tokenSymbol} reaches or exceeds $${targetPrice} within the specified timeframe. Price data will be sourced from CoinGecko's aggregated price feed, which includes data from major exchanges like Binance, Coinbase, and Kraken.`,
      `Resolution criteria: ${tokenSymbol} must trade at or above $${targetPrice} for at least 1 minute during the market period. The highest price reached will be used for resolution. Data source: CoinGecko API.`,
      `Market rules: Price must be sustained for minimum 1 minute to count as "reached". Flash spikes that don't hold for 60+ seconds will not count. Resolution based on CoinGecko's volume-weighted average price.`
    )
  }
  
  if (isPercentageQuestion && percentageMatch) {
    const percentage = percentageMatch[1]
    suggestions.push(
      `This market resolves to "YES" if ${tokenSymbol} gains ${percentage}% or more from the opening price. The opening price is the price at market creation time.`,
      `Calculation: ((Final Price - Opening Price) / Opening Price) × 100 ≥ ${percentage}%. Opening price: $${tokenData?.current_price?.toFixed(4) || 'TBD'}. Data source: CoinGecko.`,
      `Resolution rules: Price movement must be sustained for at least 5 minutes to count. Temporary spikes that don't hold will not qualify. Based on 24h volume-weighted average price.`
    )
  }
  
  if (isTimeframeQuestion && timeframeMatch) {
    const timeframe = timeframeMatch[1]
    suggestions.push(
      `This is a ${timeframe} prediction market. The market will close exactly ${timeframe} after creation and resolve based on the final conditions at that time.`,
      `Time-based resolution: Market closes at the exact ${timeframe} mark. Final price/condition at closing time determines the outcome. No extensions or delays.`,
      `Fairness rules: All participants have the same ${timeframe} window. Market closes automatically at the specified time. Resolution occurs within 1 hour of market close.`
    )
  }
  
  if (isVolumeQuestion) {
    suggestions.push(
      `This market resolves based on ${tokenSymbol}'s trading volume. Volume data will be sourced from CoinGecko's aggregated volume feed across all major exchanges.`,
      `Volume resolution: 24-hour trading volume must exceed the specified target. Volume includes all trading pairs (USDT, BTC, ETH, etc.) aggregated.`,
      `Data source: CoinGecko API provides real-time volume data from 500+ exchanges. Volume is calculated in USD equivalent across all trading pairs.`
    )
  }
  
  if (isMarketCapQuestion) {
    suggestions.push(
      `This market resolves based on ${tokenSymbol}'s market capitalization. Market cap = circulating supply × current price. Data from CoinGecko.`,
      `Market cap calculation: Uses circulating supply (not total supply) multiplied by current price. Updates in real-time based on price movements.`,
      `Resolution criteria: Market cap must exceed the target value at market close. Based on CoinGecko's circulating supply data and real-time price feed.`
    )
  }
  
  if (isTrendQuestion) {
    suggestions.push(
      `This market resolves based on ${tokenSymbol}'s price trend direction. Trend is determined by comparing opening price to closing price.`,
      `Trend analysis: "Pump" = price increases, "Dump" = price decreases. "Continue trend" = maintains current direction, "Reverse" = changes direction.`,
      `Resolution: Based on price movement direction over the specified timeframe. Must be sustained for at least 10% of the total timeframe to count.`
    )
  }
  
  // Add general rules that apply to all markets
  suggestions.push(
    `General rules: This is a prediction market, not financial advice. All participants bet with their own tokens. Winners share the total pool proportionally. No house fee.`,
    `Dispute resolution: If data sources disagree, CoinGecko will be the primary source. In case of technical issues, market may be extended by up to 1 hour.`,
    `Risk warning: Memecoins are highly volatile. Past performance doesn't guarantee future results. Only bet what you can afford to lose.`
  )
  
  return suggestions
}

// Question clarity scoring (1-10 scale)
const calculateQuestionClarity = (question: string): number => {
  if (!question) return 0
  
  let score = 5 // Base score
  
  // Length check
  if (question.length > 20 && question.length < 150) score += 1
  if (question.length > 150) score -= 1
  
  // Has specific date/timeframe
  if (/\b(by|before|end of|Q[1-4]|202[4-9]|january|february|march|april|may|june|july|august|september|october|november|december)\b/i.test(question)) {
    score += 2
  }
  
  // Has specific price target
  if (/\$[\d.,]+|\d+x|\d+%/i.test(question)) score += 1
  
  // Starts with "Will"
  if (/^Will\s/i.test(question)) score += 1
  
  // Has question mark
  if (question.includes('?')) score += 1
  
  // Avoid vague terms
  if (/\b(soon|maybe|probably|might|could)\b/i.test(question)) score -= 2
  
  return Math.max(1, Math.min(10, score))
}

// Mock duplicate market detection
const checkDuplicateMarkets = async (question: string): Promise<any[]> => {
  if (!question || question.length < 10) return []
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // Mock similar markets (in real app, this would be an API call)
  const mockMarkets = [
    { id: "1", question: "Will PEPE reach $0.01 by end of 2024?", similarity: 0.85 },
    { id: "2", question: "Will SHIBA reach $0.001 by Q2 2025?", similarity: 0.72 },
  ]
  
  // Return matches with >70% similarity
  return mockMarkets.filter(market => 
    question.toLowerCase().includes(market.question.toLowerCase().split(' ')[1]) &&
    market.similarity > 0.7
  )
}

// Social sharing functions
const shareToTwitter = (marketId: string, question: string, toast: any) => {
  const url = `${window.location.origin}/markets/${marketId}`
  const text = `🎯 New prediction market: "${question}" \n\nWhat do you think? Place your bet! 🚀`
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
  window.open(twitterUrl, '_blank')
  toast({
    title: "Opening Twitter...",
    description: "Share window opened in new tab",
  })
}

const shareToTelegram = (marketId: string, question: string, toast: any) => {
  const url = `${window.location.origin}/markets/${marketId}`
  const text = `🎯 New prediction market: "${question}"\n\nPlace your bet: ${url}`
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
  window.open(telegramUrl, '_blank')
  toast({
    title: "Opening Telegram...",
    description: "Share window opened in new tab",
  })
}

const shareToDiscord = (marketId: string, question: string, toast: any) => {
  const url = `${window.location.origin}/markets/${marketId}`
  const text = `🎯 **New Prediction Market**\n"${question}"\n\n🚀 Place your bet: ${url}`
  
  // Copy to clipboard for Discord (Discord doesn't have direct share API)
  navigator.clipboard.writeText(text).then(() => {
    toast({
      title: "Copied to clipboard!",
      description: "Market details ready to paste in Discord",
    })
  }).catch(() => {
    toast({
      title: "Copy failed",
      description: "Please copy the URL manually",
      variant: "destructive"
    })
  })
}

const copyToClipboard = (marketId: string, question: string, toast: any) => {
  const url = `${window.location.origin}/markets/${marketId}`
  const text = `🎯 New prediction market: "${question}"\n\n🚀 Place your bet: ${url}`
  
  navigator.clipboard.writeText(text).then(() => {
    toast({
      title: "Copied to clipboard!",
      description: "Market details ready to share anywhere",
    })
  }).catch(() => {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    toast({
      title: "Copied to clipboard!",
      description: "Market details ready to share anywhere",
    })
  })
}

function CreateMarketContent() {
  const { t } = useI18n()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { publicKey } = useWallet()
  const { assets: walletAssets, loading: assetsLoading } = useWalletAssets()
  
  // Form state
  const [selectedAsset, setSelectedAsset] = useState("")
  const [question, setQuestion] = useState("")
  const [description, setDescription] = useState("")
  const [selectedTimeframe, setSelectedTimeframe] = useState("24H")
  const [closingDate, setClosingDate] = useState<Date | undefined>(undefined)
  const [closingTime, setClosingTime] = useState("23:59")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingTokenData, setIsLoadingTokenData] = useState(false)
  const [tokenData, setTokenData] = useState<TokenData | null>(null)
  const [initialBetAmount, setInitialBetAmount] = useState("")
  const [betSide, setBetSide] = useState<"yes" | "no">("yes")
  const [questionClarity, setQuestionClarity] = useState<number | null>(null)
  const [duplicateMarkets, setDuplicateMarkets] = useState<any[]>([])
  const [checkingDuplicates, setCheckingDuplicates] = useState(false)
  const [showSharingModal, setShowSharingModal] = useState(false)
  const [createdMarketData, setCreatedMarketData] = useState<{id: string, question: string} | null>(null)
  const [tokenImage, setTokenImage] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const calendarRef = useRef<HTMLDivElement>(null)

  // Handle URL parameters for pre-filling form
  useEffect(() => {
    const tokenParam = searchParams.get('token')
    const nameParam = searchParams.get('name')
    
    if (tokenParam) {
      setSelectedAsset(tokenParam.toUpperCase())
      // If we have a name parameter, we could use it for additional context
      // For now, we'll just set the asset and let the token data loading handle the rest
    }
  }, [searchParams])

  const selectedToken = walletAssets.find(asset => asset.symbol === selectedAsset)
  
  // Use time-based suggestions for short timeframes, regular suggestions for longer ones
  const questionSuggestions = selectedTimeframe && ['1H', '3H', '6H', '12H', '24H'].includes(selectedTimeframe) 
    ? getTimeBasedSuggestions(tokenData, selectedAsset, selectedTimeframe)
    : getSmartSuggestions(tokenData, selectedAsset)
    
  const descriptionSuggestions = getDescriptionSuggestions(question, tokenData, selectedAsset)

  // Calculate question clarity when question changes
  useEffect(() => {
    if (question) {
      const clarity = calculateQuestionClarity(question)
      setQuestionClarity(clarity)
    } else {
      setQuestionClarity(null)
    }
  }, [question])

  // Auto-set closing date based on selected timeframe
  useEffect(() => {
    if (selectedTimeframe && ['1H', '3H', '6H', '12H', '24H'].includes(selectedTimeframe)) {
      const now = new Date()
      const hours = parseInt(selectedTimeframe.replace('H', ''))
      const closingDate = new Date(now.getTime() + (hours * 60 * 60 * 1000))
      setClosingDate(closingDate)
    }
  }, [selectedTimeframe])

  // Check for duplicate markets when question changes
  useEffect(() => {
    if (question && question.length > 10) {
      setCheckingDuplicates(true)
      checkDuplicateMarkets(question).then(markets => {
        setDuplicateMarkets(markets)
          setCheckingDuplicates(false)
      })
    } else {
      setDuplicateMarkets([])
      setCheckingDuplicates(false)
    }
  }, [question])

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false)
      }
    }

    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isCalendarOpen])

  const handleAssetChange = async (assetSymbol: string) => {
    setSelectedAsset(assetSymbol)
    setQuestion("") // Clear previous question
    setTokenData(null) // Clear previous token data
    setTokenImage(null) // Clear previous token image
    
    if (assetSymbol) {
      setIsLoadingTokenData(true)
      try {
        const data = await CoinGeckoAPI.getTokenData(assetSymbol)
        console.log('Token data received:', data) // Debug log
        setTokenData(data)
        if (data?.image) {
          setTokenImage(data.image)
        }
        if (data) {
          toast({
            title: "Token data loaded",
            description: `Fetched real-time data for ${data.name}`,
          })
        }
      } catch (error) {
        console.error("Error fetching token data:", error)
        toast({
          title: "Failed to load token data",
          description: "Using basic token information",
          variant: "destructive",
        })
      } finally {
        setIsLoadingTokenData(false)
      }
    }
  }

  const handleCreateMarket = async () => {
    // Validate required fields
    if (!selectedAsset || !question || !description || !closingDate || !initialBetAmount) {
      toast({
        title: t("validation_error"),
        description: t("missing_required_fields"),
        variant: "destructive",
      })
      return
    }

    // Validate initial bet amount
    const betAmount = parseFloat(initialBetAmount)
    if (isNaN(betAmount) || betAmount <= 0) {
      toast({
        title: t("validation_error"),
        description: "Please enter a valid initial bet amount",
        variant: "destructive",
      })
      return
    }

    // Check if user has enough balance
    if (selectedToken && betAmount > selectedToken.balance) {
      toast({
        title: t("validation_error"),
        description: `Insufficient ${selectedAsset} balance. You have ${selectedToken.balance.toLocaleString()} ${selectedAsset}`,
        variant: "destructive",
      })
      return
    }

    // Validate closing date and time
    const dateTimeError = validateClosingDateTime()
    if (dateTimeError) {
      toast({
        title: t("validation_error"),
        description: dateTimeError,
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const closingDateTime = getClosingDateTime()!
      const marketData: CreateMarketRequest = {
        asset: selectedAsset,
        questionType: "yes-no", // Only Yes/No for MVP
        question,
        description,
        closingDate: closingDateTime.toISOString(),
        // Include token mint address for smart contract
        tokenMint: selectedToken?.mint,
        tokenSymbol: selectedToken?.symbol,
        tokenName: selectedToken?.name,
        tokenLogo: selectedToken?.logo,
        // Include wallet address for user linking
        creatorWalletAddress: publicKey?.toString(),
        // Initial bet details
        initialBet: {
          amount: betAmount,
          side: betSide,
          token: selectedAsset
        }
      }

      const createdMarket = await marketApi.createMarket(marketData)
      
      toast({
        title: t("market_created_success"),
        description: `Market "${createdMarket.question}" has been created successfully!`,
      })

      // Store market data and show sharing modal
      setCreatedMarketData({
        id: createdMarket.id,
        question: createdMarket.question
      })
      setShowSharingModal(true)
    } catch (error) {
      console.error("Error creating market:", error)
      toast({
        title: t("market_creation_failed"),
        description: handleApiError(error),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleShare = (platform: 'twitter' | 'telegram' | 'discord' | 'copy') => {
    if (!createdMarketData) return
    
    switch(platform) {
      case 'twitter':
        shareToTwitter(createdMarketData.id, createdMarketData.question, toast)
        break
      case 'telegram':
        shareToTelegram(createdMarketData.id, createdMarketData.question, toast)
        break
      case 'discord':
        shareToDiscord(createdMarketData.id, createdMarketData.question, toast)
        break
      case 'copy':
        copyToClipboard(createdMarketData.id, createdMarketData.question, toast)
        break
    }
  }

  const handleCloseModal = () => {
    setShowSharingModal(false)
    if (createdMarketData) {
      router.push(`/markets/${createdMarketData.id}`)
    }
  }

  // Step navigation functions with animations
  const nextStep = async () => {
    if (currentStep < 6 && isStepValid(currentStep)) {
      setIsAnimating(true)
      await new Promise(resolve => setTimeout(resolve, 300)) // Animation duration
      setCurrentStep(currentStep + 1)
      setIsAnimating(false)
    }
  }

  const prevStep = async () => {
    if (currentStep > 1) {
      setIsAnimating(true)
      await new Promise(resolve => setTimeout(resolve, 300))
      setCurrentStep(currentStep - 1)
      setIsAnimating(false)
    }
  }

  const goToStep = async (step: number) => {
    // Only allow navigation to completed steps or the next valid step
    if (step <= currentStep || (step === currentStep + 1 && isStepValid(currentStep))) {
      setIsAnimating(true)
      await new Promise(resolve => setTimeout(resolve, 300))
      setCurrentStep(step)
      setIsAnimating(false)
    }
  }

  // Step validation
  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1: return true // How it works - always valid
      case 2: return !!selectedAsset
      case 3: return !!question && question.length > 10
      case 4: return !!description && description.length > 20
      case 5: return !!closingDate && !!closingTime
      case 6: return !!initialBetAmount && parseFloat(initialBetAmount) > 0
      default: return false
    }
  }

  // Combine date and time into a single Date object
  const getClosingDateTime = (): Date | null => {
    if (!closingDate) return null
    
    const [hours, minutes] = closingTime.split(':').map(Number)
    const dateTime = new Date(closingDate)
    dateTime.setHours(hours, minutes, 0, 0)
    return dateTime
  }

  // Validate closing date and time
  const validateClosingDateTime = (): string | null => {
    if (!closingDate) return "Please select a closing date"
    if (!closingTime) return "Please select a closing time"
    
    const closingDateTime = getClosingDateTime()
    if (!closingDateTime) return "Invalid date/time combination"
    
    const now = new Date()
    if (closingDateTime <= now) {
      return "Closing date must be in the future"
    }
    
    // Check if closing date is too far in the future (e.g., more than 2 years)
    const twoYearsFromNow = new Date()
    twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2)
    if (closingDateTime > twoYearsFromNow) {
      return "Closing date cannot be more than 2 years in the future"
    }
    
    return null
  }

  return (
    <WalletGuard>
      <div className="min-h-screen bg-background">
        <Header />

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{t("create_market_title")}</h1>
            <p className="text-muted-foreground">{t("create_market_subtitle")}</p>
          </div>

          {/* Step Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3, 4, 5, 6].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      step === currentStep
                        ? 'bg-primary text-primary-foreground'
                        : step < currentStep
                        ? 'bg-green-500 text-white'
                        : step === currentStep + 1 && isStepValid(currentStep)
                        ? 'bg-blue-100 text-blue-600 cursor-pointer hover:bg-blue-200'
                        : 'bg-muted text-muted-foreground'
                    }`}
                    onClick={() => {
                      // Only allow clicking on the next step if current step is valid
                      if (step === currentStep + 1 && isStepValid(currentStep)) {
                        goToStep(step)
                      }
                    }}
                  >
                    {step < currentStep ? '✓' : step}
                  </div>
                  {step < 6 && (
                    <div className={`w-16 h-1 mx-2 ${
                      step < currentStep ? 'bg-green-500' : 'bg-muted'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className={currentStep === 1 ? 'text-primary font-medium' : ''}>How It Works</span>
              <span className={currentStep === 2 ? 'text-primary font-medium' : ''}>Select Token</span>
              <span className={currentStep === 3 ? 'text-primary font-medium' : ''}>Write Question</span>
              <span className={currentStep === 4 ? 'text-primary font-medium' : ''}>Add Description</span>
              <span className={currentStep === 5 ? 'text-primary font-medium' : ''}>Set Timeline</span>
              <span className={currentStep === 6 ? 'text-primary font-medium' : ''}>Review & Create</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Animated Main Card */}
            <div className="lg:col-span-2">
              <Card className={`p-8 transition-all duration-300 ${isAnimating ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
                {currentStep === 1 && (
                  <div className="text-center space-y-6">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <HelpCircle className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-4">How Prediction Markets Work</h2>
                      <p className="text-muted-foreground mb-6">
                        Create prediction markets about tokens you own. Other traders can bet on the outcome, 
                        and you earn from successful predictions!
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="font-semibold mb-2">1. Choose Token</div>
                        <p className="text-muted-foreground">Select a token from your wallet to create a market about</p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="font-semibold mb-2">2. Set Question</div>
                        <p className="text-muted-foreground">Ask a yes/no question about the token's future</p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="font-semibold mb-2">3. Place Bet</div>
                        <p className="text-muted-foreground">Bet with your tokens and earn from correct predictions</p>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                        <Wallet className="h-6 w-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold mb-2">Select Your Token</h2>
                      <p className="text-muted-foreground">Choose a memecoin or token from your wallet to create a market about</p>
                    </div>
                    
                <Select value={selectedAsset} onValueChange={handleAssetChange} disabled={isLoadingTokenData}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder={isLoadingTokenData ? "Loading token data..." : "Select a token from your wallet"} />
                  </SelectTrigger>
                  <SelectContent>
                    {walletAssets.map((asset) => (
                      <SelectItem key={asset.symbol} value={asset.symbol}>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold">{asset.symbol.slice(0, 2)}</span>
                          </div>
                          <div>
                            <span className="font-medium">{asset.symbol}</span>
                            <span className="text-muted-foreground ml-2">({asset.balance.toLocaleString()})</span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

              {selectedAsset && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 text-green-800">
                          <CheckCircle className="h-4 w-4" />
                          <span className="font-medium">Selected: {selectedAsset}</span>
                    </div>
                        <p className="text-sm text-green-600 mt-1">
                          You have {selectedToken?.balance.toLocaleString()} {selectedAsset} available for betting
                        </p>
                    </div>
                                )}
                              </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                        <Hash className="h-6 w-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold mb-2">Write Your Question</h2>
                      <p className="text-muted-foreground">Create a yes/no question about {selectedAsset}</p>
                      </div>
                    
                <div className="space-y-4">
                  {/* Timeframe Selection */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Prediction Timeframe</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {['1H', '3H', '6H', '12H', '24H'].map((timeframe) => (
                        <Button
                          key={timeframe}
                          variant={selectedTimeframe === timeframe ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedTimeframe(timeframe)}
                          className="h-10"
                        >
                          {timeframe}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedTimeframe === '1H' && 'Ultra-fast predictions for quick market moves'}
                      {selectedTimeframe === '3H' && 'Short-term predictions for memecoin volatility'}
                      {selectedTimeframe === '6H' && 'Medium-term predictions for trend analysis'}
                      {selectedTimeframe === '12H' && 'Half-day predictions for significant moves'}
                      {selectedTimeframe === '24H' && 'Daily predictions for major market shifts'}
                    </p>
                  </div>

                  <div>
                        <Label htmlFor="question">Your Question</Label>
                    <Input
                      id="question"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                          placeholder={
                            selectedTimeframe && ['1H', '3H', '6H', '12H', '24H'].includes(selectedTimeframe)
                              ? `Will ${selectedAsset} pump 5%+ in the next ${selectedTimeframe}?`
                              : `Will ${selectedAsset} reach $0.01 by end of 2024?`
                          }
                          className="h-12"
                        />
                        {questionClarity && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Clarity Score:</span>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                                <div
                                  key={score}
                                  className={`w-2 h-2 rounded-full ${
                                    score <= questionClarity ? 'bg-green-500' : 'bg-muted'
                                  }`}
                                />
                              ))}
                        </div>
                            <span className="text-sm font-medium">{questionClarity}/10</span>
                      </div>
                    )}
                        </div>

                      {questionSuggestions.length > 0 && (
                    <div>
                          <Label className="text-sm font-medium">AI Suggestions</Label>
                      <div className="mt-2 space-y-2">
                            {questionSuggestions.slice(0, 3).map((suggestion, index) => (
                          <button
                            key={index}
                                onClick={() => setQuestion(suggestion)}
                                className="w-full p-3 text-left text-sm bg-muted/50 hover:bg-muted rounded-lg transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                        </div>
                      )}
                    </div>
                    </div>
                  )}

                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                        <HelpCircle className="h-6 w-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold mb-2">Add Description</h2>
                      <p className="text-muted-foreground">Explain the rules and criteria for your market</p>
                    </div>
                    
                    <div className="space-y-4">
                  <div>
                        <Label htmlFor="description">Market Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                          placeholder="This market will resolve to 'Yes' if the specified condition is met by the closing date..."
                          className="min-h-24"
                        />
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm text-muted-foreground">
                            Minimum 20 characters required
                          </span>
                          <span className={`text-sm font-medium ${
                            description.length >= 20 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {description.length}/20+
                          </span>
                        </div>
                      </div>

                      {descriptionSuggestions.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium">AI Suggestions</Label>
                        <div className="mt-2 space-y-2">
                            {descriptionSuggestions.slice(0, 2).map((suggestion, index) => (
                            <button
                              key={index}
                                onClick={() => setDescription(suggestion)}
                                className="w-full p-3 text-left text-sm bg-muted/50 hover:bg-muted rounded-lg transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  </div>
                )}

                {currentStep === 5 && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                        <CalendarIcon className="h-6 w-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold mb-2">Set Timeline</h2>
                      <p className="text-muted-foreground">When should this market close?</p>
                    </div>

                    {/* Suggested Closing Times */}
                    {selectedTimeframe && ['1H', '3H', '6H', '12H', '24H'].includes(selectedTimeframe) && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-900 mb-2">Suggested Closing Time</h3>
                        <p className="text-sm text-blue-700 mb-3">
                          Based on your {selectedTimeframe} timeframe selection, we suggest closing the market in {selectedTimeframe} from now.
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const now = new Date()
                              const hours = parseInt(selectedTimeframe.replace('H', ''))
                              const suggestedDate = new Date(now.getTime() + (hours * 60 * 60 * 1000))
                              setClosingDate(suggestedDate)
                              setClosingTime(format(suggestedDate, 'HH:mm'))
                            }}
                            className="text-blue-600 border-blue-300 hover:bg-blue-100"
                          >
                            Use {selectedTimeframe} from now
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Timeline Explanation */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Market Timeline</h3>
                      <div className="space-y-2 text-sm text-gray-700">
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                          <span><strong>Betting Period:</strong> Users can place bets until the closing time</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                          <span><strong>Market Closes:</strong> No new bets accepted after closing time</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                          <span><strong>Resolution:</strong> Market resolves within 1 hour of closing time</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                          <span><strong>Payout:</strong> Winners can claim their share of the pool</span>
                        </div>
                        </div>
                      </div>

                    {/* Quick Preset Buttons */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Quick Presets</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {[
                          { label: '1 Hour', hours: 1 },
                          { label: '3 Hours', hours: 3 },
                          { label: '6 Hours', hours: 6 },
                          { label: '12 Hours', hours: 12 },
                          { label: '1 Day', hours: 24 },
                          { label: '3 Days', hours: 72 },
                          { label: '1 Week', hours: 168 },
                          { label: '1 Month', hours: 720 }
                        ].map((preset) => (
                          <Button
                            key={preset.label}
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const now = new Date()
                              const presetDate = new Date(now.getTime() + (preset.hours * 60 * 60 * 1000))
                              setClosingDate(presetDate)
                              setClosingTime(format(presetDate, 'HH:mm'))
                            }}
                            className="h-8 text-xs"
                          >
                            {preset.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="closingDate">Closing Date</Label>
                        <div className="relative" ref={calendarRef}>
                                <Button
                                  variant="outline"
                            className="w-full justify-start text-left font-normal h-12"
                            type="button"
                            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                            {closingDate ? format(closingDate, "PPP") : "Pick a date"}
                                </Button>
                          {isCalendarOpen && (
                            <div className="absolute top-full left-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                                <Calendar 
                                  mode="single" 
                                  selected={closingDate} 
                                  onSelect={(date) => {
                                    setClosingDate(date)
                                  setIsCalendarOpen(false)
                                  }}
                                disabled={(date) => date < new Date()}
                                  initialFocus
                                />
                            </div>
                          )}
                          </div>
                        </div>

                        <div>
                        <Label htmlFor="closingTime">Closing Time</Label>
                            <Input
                          id="closingTime"
                              type="time"
                              value={closingTime}
                              onChange={(e) => setClosingTime(e.target.value)}
                          className="h-12"
                        />
                        </div>
                      </div>

                    {validateClosingDateTime() && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{validateClosingDateTime()}</p>
                          </div>
                    )}
                        </div>
                      )}

                {currentStep === 6 && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="h-6 w-6 text-white" />
                          </div>
                      <h2 className="text-2xl font-bold mb-2">Review & Create Market</h2>
                      <p className="text-muted-foreground">Place your initial bet and create your market</p>
                        </div>
                    
                <div className="space-y-4">
                  <div>
                        <Label htmlFor="initialBetAmount">Initial Bet Amount ({selectedAsset})</Label>
                        <Input
                          id="initialBetAmount"
                          type="number"
                          value={initialBetAmount}
                          onChange={(e) => setInitialBetAmount(e.target.value)}
                          placeholder="Enter amount"
                          className="h-12"
                        />
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-muted-foreground">
                            Available: {selectedToken?.balance.toLocaleString()} {selectedAsset}
                          </p>
                          {initialBetAmount && tokenData?.current_price && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-blue-800">
                                  USD Value:
                                </span>
                                <span className="text-lg font-bold text-blue-900">
                                  ${(parseFloat(initialBetAmount) * tokenData.current_price).toFixed(2)}
                                </span>
                  </div>
                              <div className="text-xs text-blue-600 mt-1">
                                @ ${tokenData.current_price.toFixed(4)} per {selectedAsset}
                              </div>
                            </div>
                          )}
                    </div>
                  </div>
                  
                  <div>
                        <Label>Bet Side</Label>
                        <RadioGroup value={betSide} onValueChange={(value: "yes" | "no") => setBetSide(value)} className="grid grid-cols-2 gap-4 mt-3">
                          <div className={`relative cursor-pointer transition-all duration-200 ${
                            betSide === 'yes' 
                              ? 'bg-green-50 border-2 border-green-500 shadow-md' 
                              : 'bg-white border-2 border-gray-200 hover:border-green-300 hover:bg-green-25'
                          }`} style={{ borderRadius: '12px' }}>
                            <div className="p-4">
                              <div className="flex items-center space-x-3">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                  betSide === 'yes' 
                                    ? 'border-green-500 bg-green-500' 
                                    : 'border-gray-300'
                                }`}>
                                  {betSide === 'yes' && (
                                    <div className="w-2 h-2 rounded-full bg-white"></div>
                                  )}
                                </div>
                                <Label htmlFor="bet-yes" className="cursor-pointer flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-lg font-bold ${
                                      betSide === 'yes' ? 'text-green-700' : 'text-green-600'
                                    }`}>
                                      YES
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    I believe this will happen
                                  </p>
                                </Label>
                  </div>
                </div>
                            <RadioGroupItem value="yes" id="bet-yes" className="absolute inset-0 opacity-0 cursor-pointer" />
                          </div>

                          <div className={`relative cursor-pointer transition-all duration-200 ${
                            betSide === 'no' 
                              ? 'bg-red-50 border-2 border-red-500 shadow-md' 
                              : 'bg-white border-2 border-gray-200 hover:border-red-300 hover:bg-red-25'
                          }`} style={{ borderRadius: '12px' }}>
                            <div className="p-4">
                              <div className="flex items-center space-x-3">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                  betSide === 'no' 
                                    ? 'border-red-500 bg-red-500' 
                                    : 'border-gray-300'
                                }`}>
                                  {betSide === 'no' && (
                                    <div className="w-2 h-2 rounded-full bg-white"></div>
                                  )}
                    </div>
                                <Label htmlFor="bet-no" className="cursor-pointer flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-lg font-bold ${
                                      betSide === 'no' ? 'text-red-700' : 'text-red-600'
                                    }`}>
                                      NO
                                    </span>
                    </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    I believe this won't happen
                                  </p>
                                </Label>
                    </div>
                    </div>
                            <RadioGroupItem value="no" id="bet-no" className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                        </RadioGroup>
                    </div>
                  </div>
                </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex gap-3 mt-8 pt-6 border-t">
                  {currentStep > 1 && (
                    <Button
                      onClick={prevStep}
                      variant="outline"
                      className="flex-1"
                      disabled={isAnimating}
                    >
                      ← Back
                    </Button>
                  )}
                  
                  {currentStep < 6 ? (
                    <Button
                      onClick={nextStep}
                      disabled={!isStepValid(currentStep) || isAnimating}
                      className="flex-1"
                    >
                      {isAnimating ? "..." : "Next →"}
                    </Button>
                  ) : (
                <Button
                  onClick={handleCreateMarket}
                  disabled={
                    !selectedAsset || 
                    !question || 
                    !description || 
                    !closingDate || 
                    !initialBetAmount ||
                    parseFloat(initialBetAmount || "0") <= 0 ||
                    isLoading || 
                    !!validateClosingDateTime()
                  }
                      className="flex-1 bg-green-600 hover:bg-green-700"
                >
                      {isLoading ? "Creating Market..." : "Create Market"}
                </Button>
                  )}
              </div>
              </Card>
            </div>

            {/* Market Preview - Always Visible */}
            <div className="space-y-6">
              {/* Market Preview Card */}
                <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Market Preview</h3>
                <div className="border border-border rounded-lg p-4 bg-card">
                  {/* Header with icon and question */}
                  <div className="flex items-start gap-3 mb-4">
                    {selectedAsset ? (
                      tokenImage ? (
                        <img
                          src={tokenImage}
                          alt={selectedAsset}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            e.currentTarget.nextElementSibling?.classList.remove('hidden')
                          }}
                        />
                      ) : null
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <Hash className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    {/* Fallback hash icon for when no token image is available */}
                    {selectedAsset && !tokenImage && (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <Hash className="h-5 w-5 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {selectedAsset && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            {selectedAsset}
                          </span>
                        )}
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          {currentStep >= 6 ? 'READY' : 'DRAFT'}
                        </span>
                      </div>
                      <h4 className="font-semibold text-sm text-card-foreground mb-2">
                        {question || "Your question will appear here"}
                      </h4>
                      {description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Market Stats */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Chance</span>
                      <span className="text-lg font-bold text-green-600">65%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 bg-green-100 text-green-700 hover:bg-green-200">
                      Yes
                    </Button>
                      <Button size="sm" className="flex-1 bg-red-100 text-red-700 hover:bg-red-200">
                      No
                    </Button>
                  </div>
                    <div className="text-xs text-muted-foreground text-center">
                      {initialBetAmount ? `Initial bet: ${initialBetAmount} ${selectedAsset}` : 'No initial bet set'}
                      </div>
                  </div>
                </div>
              </Card>

              {/* Token Details Card - Only show when token is selected */}
              {selectedAsset && tokenData && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    {tokenImage ? (
                      <img
                        src={tokenImage}
                        alt={selectedAsset}
                        className="w-6 h-6 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.nextElementSibling?.classList.remove('hidden')
                        }}
                      />
                    ) : null}
                    {/* Fallback icon - only show if no image or image failed */}
                    <div className={`w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ${tokenImage ? 'hidden' : ''}`}>
                      <Hash className="h-3 w-3 text-white" />
                    </div>
                    {tokenData.name} ({selectedAsset}) Live Data
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Price */}
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Current Price</div>
                      <div className="text-lg font-bold">
                        ${tokenData.current_price?.toFixed(4) || 'N/A'}
                      </div>
                      {tokenData.price_change_percentage_24h && (
                        <div className={`text-sm ${
                          tokenData.price_change_percentage_24h >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {tokenData.price_change_percentage_24h >= 0 ? '+' : ''}
                          {tokenData.price_change_percentage_24h.toFixed(2)}% (24h)
                    </div>
                      )}
                    </div>

                    {/* Market Cap */}
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Market Cap</div>
                      <div className="text-lg font-bold">
                        ${tokenData.market_cap ? (tokenData.market_cap / 1e9).toFixed(2) + 'B' : 'N/A'}
                  </div>
                      {tokenData.market_cap_rank && (
                        <div className="text-sm text-muted-foreground">
                          Rank #{tokenData.market_cap_rank}
                  </div>
                      )}
                  </div>

                    {/* Volume */}
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">24h Volume</div>
                      <div className="text-lg font-bold">
                        ${tokenData.total_volume ? (tokenData.total_volume / 1e6).toFixed(1) + 'M' : 'N/A'}
                  </div>
                </div>

                    {/* ATH */}
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">All-Time High</div>
                      <div className="text-lg font-bold">
                        ${tokenData.ath?.toFixed(4) || 'N/A'}
            </div>
                      {tokenData.ath_date && (
                        <div className="text-sm text-muted-foreground">
                          {new Date(tokenData.ath_date).toLocaleDateString()}
          </div>
                      )}
        </div>
      </div>

                  {/* Social & Community Stats */}
                  <div className="mt-4 grid grid-cols-1 gap-3">
                    {/* Debug: Log token data to see what's causing the "00" */}
                    {console.log('Token data for debugging:', {
                      twitter_username: tokenData.twitter_username,
                      twitter_followers: tokenData.twitter_followers,
                      reddit_subscribers: tokenData.reddit_subscribers,
                      telegram_channel: tokenData.telegram_channel,
                      website: tokenData.website,
                      circulating_supply: tokenData.circulating_supply,
                      total_supply: tokenData.total_supply,
                      max_supply: tokenData.max_supply
                    })}
                    {tokenData.twitter_username && (
                      <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Twitter className="h-4 w-4 text-blue-500" />
                          <span className="text-sm text-muted-foreground">Twitter</span>
              </div>
                        <a 
                          href={`https://twitter.com/${tokenData.twitter_username}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 hover:text-blue-800"
                        >
                          @{tokenData.twitter_username}
                        </a>
                      </div>
                    )}

                    {tokenData.twitter_followers && tokenData.twitter_followers > 0 && (
                      <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-500" />
                          <span className="text-sm text-muted-foreground">Twitter Followers</span>
                </div>
                        <span className="font-medium">
                          {tokenData.twitter_followers >= 1000 ? 
                            (tokenData.twitter_followers / 1000).toFixed(1) + 'K' : 
                            tokenData.twitter_followers.toLocaleString()
                          }
                        </span>
              </div>
                    )}
                    
                    {tokenData.reddit_subscribers && tokenData.reddit_subscribers > 0 && (
                      <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">R</span>
                          </div>
                          <span className="text-sm text-muted-foreground">Reddit Members</span>
                        </div>
                        <span className="font-medium">
                          {(tokenData.reddit_subscribers / 1000).toFixed(1)}K
                        </span>
                      </div>
                    )}

                    {tokenData.website && (
                      <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <ExternalLink className="h-4 w-4 text-blue-500" />
                          <span className="text-sm text-muted-foreground">Website</span>
                        </div>
                        <a 
                          href={tokenData.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 hover:text-blue-800 truncate max-w-32"
                        >
                          Visit Site
                        </a>
                    </div>
                    )}

                    {tokenData.telegram_channel && (
                      <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="h-4 w-4 text-blue-500" />
                          <span className="text-sm text-muted-foreground">Telegram</span>
                        </div>
                        <a 
                          href={`https://t.me/${tokenData.telegram_channel}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 hover:text-blue-800"
                        >
                          Join Channel
                        </a>
                    </div>
                    )}

                    {/* Show supply data only if available */}
                    {(tokenData.circulating_supply && tokenData.circulating_supply > 0) && (
                      <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm text-muted-foreground">Circulating Supply</span>
                        <span className="font-medium">
                          {(tokenData.circulating_supply / 1e9).toFixed(2)}B
                        </span>
                    </div>
                    )}

                    {(tokenData.total_supply && tokenData.total_supply > 0) && (
                      <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm text-muted-foreground">Total Supply</span>
                        <span className="font-medium">
                          {(tokenData.total_supply / 1e9).toFixed(2)}B
                        </span>
                    </div>
                    )}

                    {(tokenData.max_supply && tokenData.max_supply > 0) && (
                      <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm text-muted-foreground">Max Supply</span>
                        <span className="font-medium">
                          {(tokenData.max_supply / 1e9).toFixed(2)}B
                        </span>
                      </div>
                    )}
                </div>

                </Card>
              )}

              {/* Fallback when no token data is available */}
              {selectedAsset && !tokenData && !isLoadingTokenData && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <Hash className="h-3 w-3 text-white" />
                    </div>
                    {selectedAsset} Token Info
                  </h3>
                  <div className="text-center py-8">
                    <div className="text-muted-foreground mb-2">
                      Token data not available
                    </div>
                    <div className="text-sm text-muted-foreground">
                      This token may not be listed on CoinGecko or may be a custom SPL token
                    </div>
                  </div>
                </Card>
              )}

              {/* Loading state */}
              {selectedAsset && isLoadingTokenData && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <Hash className="h-3 w-3 text-white" />
                    </div>
                    Loading {selectedAsset} Data...
                  </h3>
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <div className="text-muted-foreground">
                      Fetching live token data from CoinGecko...
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <Dialog open={showSharingModal} onOpenChange={setShowSharingModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center pb-6">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Market Created Successfully!
            </DialogTitle>
            <p className="text-sm text-gray-600 mt-2">
              Your prediction market is now live
            </p>
          </DialogHeader>
          
          {createdMarketData && (
                <div className="text-center">
                  <Button
                    onClick={handleCloseModal}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium"
                  >
                    View Market
                  </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </WalletGuard>
  )
}

export default function CreateMarketPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <CreateMarketContent />
    </Suspense>
  )
}