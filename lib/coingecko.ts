// CoinGecko API integration for token data

export interface TokenData {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
  market_cap: number
  market_cap_rank: number
  total_volume: number
  price_change_percentage_24h: number
  price_change_percentage_7d: number
  price_change_percentage_30d: number
  ath: number
  ath_change_percentage: number
  atl: number
  atl_change_percentage: number
  last_updated: string
  // Social data
  twitter_followers?: number
  reddit_subscribers?: number
  telegram_channel?: string
  website?: string
  twitter_username?: string
  // Supply data
  circulating_supply?: number
  total_supply?: number
  max_supply?: number
}

export interface CoinGeckoResponse {
  [key: string]: TokenData
}

// Map our token symbols to CoinGecko IDs
const TOKEN_COINGECKO_MAP: Record<string, string> = {
  'WIF': 'dogwifcoin',
  'PEPE': 'pepe',
  'SHIBA': 'shiba-inu',
  'TROLL': 'troll',
  'PUMP': 'pump-fun',
  'BONK': 'bonk',
  'DOGE': 'dogecoin',
  'SOL': 'solana',
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
}

export class CoinGeckoAPI {
  private static readonly PRO_BASE_URL = process.env.NEXT_PUBLIC_COINGECKO_API_BASE || 'https://pro-api.coingecko.com/api/v3'
  private static readonly PRO_API_KEY = process.env.NEXT_PUBLIC_COINGECKO_API_KEY || 'CG-fFEtRKAkqRkgjSHbRXdht6EL'
  private static readonly FALLBACK_BASE_URL = process.env.NEXT_PUBLIC_COINGECKO_FALLBACK_FREE_BASE || 'https://api.coingecko.com/api/v3'
  private static readonly USE_FALLBACK = process.env.NEXT_PUBLIC_FEATURE_COINGECKO_FALLBACK === 'true'
  private static readonly RATE_LIMIT_DELAY = 1000 // 1 second between requests

  // Get token data by symbol with Pro API and fallback
  static async getTokenData(symbol: string): Promise<TokenData | null> {
    const coinGeckoId = TOKEN_COINGECKO_MAP[symbol.toUpperCase()]
    if (!coinGeckoId) {
      console.warn(`No CoinGecko ID found for token: ${symbol}`)
      return null
    }

    // Try Pro API first
    try {
      const proData = await this.fetchFromProAPI(coinGeckoId)
      if (proData) {
        console.log(`✅ Fetched ${symbol} data from CoinGecko Pro API`)
        return proData
      }
    } catch (error) {
      console.warn(`❌ CoinGecko Pro API failed for ${symbol}:`, error)
    }

    // Fallback to free API if enabled
    if (this.USE_FALLBACK) {
      try {
        const fallbackData = await this.fetchFromFallbackAPI(coinGeckoId)
        if (fallbackData) {
          console.log(`✅ Fetched ${symbol} data from CoinGecko Free API (fallback)`)
          return fallbackData
        }
      } catch (error) {
        console.error(`❌ CoinGecko Free API also failed for ${symbol}:`, error)
      }
    }

    return null
  }

  // Fetch from Pro API
  private static async fetchFromProAPI(coinGeckoId: string): Promise<TokenData | null> {
    const url = `${this.PRO_BASE_URL}/coins/${coinGeckoId}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=false&sparkline=false`
    
    const response = await fetch(url, {
      headers: {
        'x-cg-pro-api-key': this.PRO_API_KEY,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`CoinGecko Pro API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return this.parseTokenData(data)
  }

  // Fetch from Free API (fallback)
  private static async fetchFromFallbackAPI(coinGeckoId: string): Promise<TokenData | null> {
    const url = `${this.FALLBACK_BASE_URL}/coins/${coinGeckoId}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=false&sparkline=false`
    
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`CoinGecko Free API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return this.parseTokenData(data)
  }

  // Parse token data from API response
  private static parseTokenData(data: any): TokenData {
    console.log('Raw API data:', data) // Debug log
    return {
      id: data.id,
      symbol: data.symbol.toUpperCase(),
      name: data.name,
      image: data.image?.small || data.image?.thumb || '',
      current_price: data.market_data?.current_price?.usd || 0,
      market_cap: data.market_data?.market_cap?.usd || 0,
      market_cap_rank: data.market_cap_rank || 0,
      total_volume: data.market_data?.total_volume?.usd || 0,
      price_change_percentage_24h: data.market_data?.price_change_percentage_24h || 0,
      price_change_percentage_7d: data.market_data?.price_change_percentage_7d_in_currency?.usd || 0,
      price_change_percentage_30d: data.market_data?.price_change_percentage_30d_in_currency?.usd || 0,
      ath: data.market_data?.ath?.usd || 0,
      ath_change_percentage: data.market_data?.ath_change_percentage?.usd || 0,
      atl: data.market_data?.atl?.usd || 0,
      atl_change_percentage: data.market_data?.atl_change_percentage?.usd || 0,
      last_updated: data.last_updated || new Date().toISOString(),
      // Social data
      twitter_followers: data.community_data?.twitter_followers || 0,
      reddit_subscribers: data.community_data?.reddit_subscribers || 0,
      telegram_channel: data.links?.telegram_channel_identifier || '',
      website: data.links?.homepage?.[0] || '',
      twitter_username: data.links?.twitter_screen_name || '',
      // Supply data
      circulating_supply: data.market_data?.circulating_supply || 0,
      total_supply: data.market_data?.total_supply || 0,
      max_supply: data.market_data?.max_supply || 0,
    }
  }

  // Get multiple tokens data
  static async getMultipleTokensData(symbols: string[]): Promise<Record<string, TokenData>> {
    const results: Record<string, TokenData> = {}
    
    for (const symbol of symbols) {
      const data = await this.getTokenData(symbol)
      if (data) {
        results[symbol] = data
      }
      // Add delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_DELAY))
    }
    
    return results
  }

  // Generate smart suggestions based on token data
  static generateSmartSuggestions(tokenData: TokenData): string[] {
    const currentPrice = tokenData.current_price
    const symbol = tokenData.symbol
    const ath = tokenData.ath
    const marketCap = tokenData.market_cap
    
    const suggestions: string[] = []
    
    // Price-based suggestions
    if (currentPrice > 0) {
      const doublePrice = (currentPrice * 2).toFixed(6)
      const tenXPrice = (currentPrice * 10).toFixed(6)
      const halfPrice = (currentPrice * 0.5).toFixed(6)
      
      suggestions.push(
        `Will ${symbol} reach $${doublePrice} by end of 2024?`,
        `Will ${symbol} 10x to $${tenXPrice} by Q2 2025?`,
        `Will ${symbol} drop below $${halfPrice} by end of 2024?`
      )
    }
    
    // ATH-based suggestions
    if (ath > currentPrice) {
      suggestions.push(
        `Will ${symbol} break its ATH of $${ath.toFixed(6)} by 2025?`,
        `Will ${symbol} reach 50% of its ATH by end of 2024?`
      )
    }
    
    // Market cap suggestions
    if (marketCap > 0) {
      const billionCap = Math.round(marketCap / 1000000000)
      const tenBillionCap = Math.round(marketCap / 10000000000)
      
      if (billionCap < 10) {
        suggestions.push(`Will ${symbol} reach $1B market cap by 2025?`)
      }
      if (tenBillionCap < 1) {
        suggestions.push(`Will ${symbol} reach $10B market cap by 2025?`)
      }
    }
    
    // General memecoin suggestions
    suggestions.push(
      `Will ${symbol} be listed on Binance by end of 2024?`,
      `Will ${symbol} pump 50%+ in the next 30 days?`,
      `Will ${symbol} survive the next bear market?`,
      `Will ${symbol} reach top 100 by market cap by 2025?`
    )
    
    return suggestions.slice(0, 8) // Return top 8 suggestions
  }
}
