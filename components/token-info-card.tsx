import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Globe } from "lucide-react"
import { TokenData } from "@/lib/coingecko"

interface TokenInfoCardProps {
  tokenData: TokenData
  userBalance?: number
}

export function TokenInfoCard({ tokenData, userBalance }: TokenInfoCardProps) {
  const formatPrice = (price: number) => {
    if (price < 0.000001) return `$${price.toExponential(2)}`
    if (price < 0.01) return `$${price.toFixed(4)}`
    if (price < 1) return `$${price.toFixed(3)}`
    if (price < 100) return `$${price.toFixed(2)}`
    return `$${price.toFixed(0)}`
  }

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`
    return `$${marketCap.toLocaleString()}`
  }

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`
    return `$${volume.toLocaleString()}`
  }

  const getPriceChangeColor = (change: number) => {
    if (change > 0) return "text-green-600"
    if (change < 0) return "text-red-600"
    return "text-muted-foreground"
  }

  const getPriceChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4" />
    if (change < 0) return <TrendingDown className="h-4 w-4" />
    return null
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <img 
            src={tokenData.image} 
            alt={tokenData.name}
            className="w-12 h-12 rounded-full"
            onError={(e) => {
              e.currentTarget.src = '/placeholder-token.png'
            }}
          />
          <div>
            <CardTitle className="text-lg">{tokenData.name}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{tokenData.symbol}</Badge>
              {tokenData.market_cap_rank > 0 && (
                <Badge variant="outline">#{tokenData.market_cap_rank}</Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Current Price</span>
          </div>
          <div className="text-right">
            <div className="font-semibold text-lg">{formatPrice(tokenData.current_price)}</div>
            <div className={`flex items-center gap-1 text-sm ${getPriceChangeColor(tokenData.price_change_percentage_24h)}`}>
              {getPriceChangeIcon(tokenData.price_change_percentage_24h)}
              {tokenData.price_change_percentage_24h > 0 ? '+' : ''}{tokenData.price_change_percentage_24h.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Market Cap */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Market Cap</span>
          </div>
          <span className="font-medium">{formatMarketCap(tokenData.market_cap)}</span>
        </div>

        {/* 24h Volume */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">24h Volume</span>
          </div>
          <span className="font-medium">{formatVolume(tokenData.total_volume)}</span>
        </div>

        {/* All Time High */}
        {tokenData.ath > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">All Time High</span>
            <div className="text-right">
              <div className="font-medium">{formatPrice(tokenData.ath)}</div>
              <div className="text-xs text-muted-foreground">
                {tokenData.ath_change_percentage.toFixed(2)}% from ATH
              </div>
            </div>
          </div>
        )}

        {/* User Balance */}
        {userBalance !== undefined && (
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Your Balance</span>
              <div className="text-right">
                <div className="font-medium">{userBalance.toLocaleString()} {tokenData.symbol}</div>
                <div className="text-xs text-muted-foreground">
                  ≈ {formatPrice(userBalance * tokenData.current_price)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7d and 30d Performance */}
        <div className="pt-3 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">7d</span>
              <div className={`font-medium ${getPriceChangeColor(tokenData.price_change_percentage_7d)}`}>
                {tokenData.price_change_percentage_7d > 0 ? '+' : ''}{tokenData.price_change_percentage_7d.toFixed(2)}%
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">30d</span>
              <div className={`font-medium ${getPriceChangeColor(tokenData.price_change_percentage_30d)}`}>
                {tokenData.price_change_percentage_30d > 0 ? '+' : ''}{tokenData.price_change_percentage_30d.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
