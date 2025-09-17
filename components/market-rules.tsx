"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info, Clock, Target, Shield, AlertTriangle, CheckCircle } from "lucide-react"

interface MarketRulesProps {
  question: string
  tokenSymbol: string
  timeframe?: string
  tokenData?: {
    current_price: number
    market_cap: number
    total_volume: number
  } | null
}

export function MarketRules({ question, tokenSymbol, timeframe, tokenData }: MarketRulesProps) {
  // Analyze question to determine rules
  const isPriceQuestion = /\$[\d.,]+/.test(question)
  const isPercentageQuestion = /\d+%/.test(question)
  const isVolumeQuestion = /volume/i.test(question)
  const isMarketCapQuestion = /market cap|marketcap/i.test(question)
  const isTrendQuestion = /(pump|dump|trend|continue|reverse)/i.test(question)
  
  // Extract values
  const priceMatch = question.match(/\$([\d.,]+)/)
  const percentageMatch = question.match(/(\d+)%/)
  const targetPrice = priceMatch ? priceMatch[1] : null
  const percentage = percentageMatch ? percentageMatch[1] : null

  const getResolutionRules = () => {
    if (isPriceQuestion && targetPrice) {
      return {
        title: "Price Target Resolution",
        rules: [
          `${tokenSymbol} must reach or exceed $${targetPrice}`,
          "Price must be sustained for at least 1 minute",
          "Based on CoinGecko's volume-weighted average price",
          "Data sourced from 500+ exchanges including Binance, Coinbase, Kraken"
        ]
      }
    }
    
    if (isPercentageQuestion && percentage) {
      return {
        title: "Percentage Gain Resolution",
        rules: [
          `${tokenSymbol} must gain ${percentage}% or more from opening price`,
          `Opening price: $${tokenData?.current_price?.toFixed(4) || 'TBD'}`,
          "Price movement must be sustained for at least 5 minutes",
          "Calculation: ((Final - Opening) / Opening) × 100"
        ]
      }
    }
    
    if (isVolumeQuestion) {
      return {
        title: "Volume Target Resolution",
        rules: [
          "24-hour trading volume must exceed specified target",
          "Volume includes all trading pairs (USDT, BTC, ETH, etc.)",
          "Aggregated across all major exchanges",
          "Calculated in USD equivalent"
        ]
      }
    }
    
    if (isMarketCapQuestion) {
      return {
        title: "Market Cap Resolution",
        rules: [
          "Market cap = circulating supply × current price",
          "Uses circulating supply (not total supply)",
          "Updates in real-time based on price movements",
          "Data from CoinGecko's circulating supply feed"
        ]
      }
    }
    
    if (isTrendQuestion) {
      return {
        title: "Trend Direction Resolution",
        rules: [
          "Based on price movement direction over timeframe",
          "Must be sustained for at least 10% of total timeframe",
          "Pump = price increases, Dump = price decreases",
          "Continue = maintains direction, Reverse = changes direction"
        ]
      }
    }
    
    return {
      title: "General Resolution",
      rules: [
        "Market resolves based on specified condition",
        "Data sourced from CoinGecko API",
        "Resolution occurs within 1 hour of market close"
      ]
    }
  }

  const resolutionRules = getResolutionRules()

  return (
    <div className="space-y-4">
      {/* Market Type Badge */}
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="flex items-center gap-1">
          <Target className="h-3 w-3" />
          {timeframe ? `${timeframe} Prediction` : 'Yes/No Market'}
        </Badge>
        <Badge variant="outline">
          {tokenSymbol} Required
        </Badge>
      </div>

      {/* Resolution Rules */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            {resolutionRules.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {resolutionRules.rules.map((rule, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
              <span className="text-sm text-muted-foreground">{rule}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Timeframe Rules */}
      {timeframe && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Market Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
              <span className="text-sm text-muted-foreground">
                <strong>Betting Period:</strong> Users can place bets until closing time
              </span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
              <span className="text-sm text-muted-foreground">
                <strong>Market Closes:</strong> No new bets accepted after closing time
              </span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
              <span className="text-sm text-muted-foreground">
                <strong>Resolution:</strong> Market resolves within 1 hour of closing time
              </span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
              <span className="text-sm text-muted-foreground">
                <strong>Payout:</strong> Winners can claim their share of the pool
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Betting Rules */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            Betting Rules
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
            <span className="text-sm text-muted-foreground">
              You need {tokenSymbol} tokens to place bets
            </span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
            <span className="text-sm text-muted-foreground">
              Winners share the total pool proportionally
            </span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
            <span className="text-sm text-muted-foreground">
              No house fee - all tokens go to winners
            </span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
            <span className="text-sm text-muted-foreground">
              No minimum bet required
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Data Source */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            Data Source & Fairness
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
            <span className="text-sm text-muted-foreground">
              Primary data source: CoinGecko API
            </span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
            <span className="text-sm text-muted-foreground">
              Aggregated from 500+ exchanges
            </span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
            <span className="text-sm text-muted-foreground">
              Volume-weighted average pricing
            </span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
            <span className="text-sm text-muted-foreground">
              Dispute resolution: CoinGecko is final authority
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Risk Warning */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Risk Warning:</strong> Memecoins are highly volatile and unpredictable. 
          This is a prediction market for entertainment purposes, not financial advice. 
          Only bet what you can afford to lose. Past performance doesn't guarantee future results.
        </AlertDescription>
      </Alert>
    </div>
  )
}
