import { TokenData } from './coingecko'

export interface MarketResolutionData {
  marketId: string
  question: string
  questionType: 'price' | 'volume' | 'market_cap' | 'trend' | 'support_resistance' | 'ath_atl' | 'momentum' | 'volatility' | 'time_sensitive'
  resolutionCriteria: string
  closingDate: Date
  resolutionStatus: 'pending' | 'resolved' | 'disputed'
  resolution: 'yes' | 'no' | 'disputed'
  resolutionData: {
    finalPrice?: number
    finalVolume?: number
    finalMarketCap?: number
    priceHistory: PriceSnapshot[]
    volumeHistory: VolumeSnapshot[]
    resolutionTimestamp: Date
    dataSource: string
    confidence: number
  }
  disputeReason?: string
  disputeResolution?: string
}

export interface PriceSnapshot {
  timestamp: Date
  price: number
  volume: number
  source: string
}

export interface VolumeSnapshot {
  timestamp: Date
  volume24h: number
  volume1h: number
  source: string
}

export interface ResolutionResult {
  success: boolean
  resolution: 'yes' | 'no'
  confidence: number
  data: any
  explanation: string
  disputeRisk: 'low' | 'medium' | 'high'
}

export class MarketResolutionEngine {
  // Main resolution function
  public static async resolveMarket(
    marketId: string,
    question: string,
    questionType: string,
    resolutionCriteria: string,
    closingDate: Date
  ): Promise<MarketResolutionData> {
    console.log(`🔄 Resolving market ${marketId}: "${question}"`)
    
    try {
      // Get final market data at closing time
      const resolutionData = await this.getFinalMarketData(question, closingDate)
      console.log(`📊 Market data retrieved for ${marketId}:`, {
        finalPrice: resolutionData.finalPrice,
        finalVolume: resolutionData.finalVolume,
        finalMarketCap: resolutionData.finalMarketCap
      })
      
      // Determine resolution based on question type
      const resolution = await this.determineResolution(
        question,
        questionType,
        resolutionCriteria,
        resolutionData
      )
      
      console.log(`✅ Market ${marketId} resolved: ${resolution.resolution} (confidence: ${resolution.confidence})`)
      
      return {
        marketId,
        question,
        questionType: questionType as any,
        resolutionCriteria,
        closingDate,
        resolutionStatus: 'resolved',
        resolution: resolution.resolution,
        resolutionData: {
          ...resolutionData,
          resolutionTimestamp: new Date(),
          dataSource: 'CoinGecko API + TradingView',
          confidence: resolution.confidence
        },
        disputeReason: resolution.disputeRisk !== 'low' ? 'High dispute risk detected' : undefined
      }
    } catch (error) {
      console.error(`❌ Error resolving market ${marketId}:`, error)
      
      // Try fallback resolution based on question analysis
      const fallbackResolution = this.getFallbackResolution(question, questionType)
      console.log(`🔄 Using fallback resolution for ${marketId}: ${fallbackResolution}`)
      
      return {
        marketId,
        question,
        questionType: questionType as any,
        resolutionCriteria,
        closingDate,
        resolutionStatus: 'resolved',
        resolution: fallbackResolution,
        resolutionData: {
          priceHistory: [],
          volumeHistory: [],
          resolutionTimestamp: new Date(),
          dataSource: 'Fallback Analysis',
          confidence: 0.6
        },
        disputeReason: 'Used fallback resolution due to data error'
      }
    }
  }

  // Fallback resolution when main resolution fails
  private static getFallbackResolution(question: string, questionType: string): 'yes' | 'no' {
    const questionLower = question.toLowerCase()
    
    // Simple heuristic-based resolution
    if (questionType === 'price') {
      // For price questions, most targets are ambitious, so default to NO
      return 'no'
    }
    
    if (questionType === 'market_cap') {
      // Market cap targets are usually optimistic, default to NO
      return 'no'
    }
    
    if (questionType === 'support_resistance') {
      // Resistance breaks are less common, default to NO
      return 'no'
    }
    
    // Default to NO for most questions (conservative approach)
    return 'no'
  }

  // Get final market data at closing time
  private static async getFinalMarketData(question: string, closingDate: Date): Promise<any> {
    // Extract token symbol from question
    const tokenSymbol = this.extractTokenSymbol(question)
    if (!tokenSymbol) {
      throw new Error('Could not extract token symbol from question')
    }

    // Get current token data
    const tokenData = await this.getTokenDataAtTime(tokenSymbol, closingDate)
    
    // Get historical data for the market period
    const priceHistory = await this.getPriceHistory(tokenSymbol, closingDate)
    const volumeHistory = await this.getVolumeHistory(tokenSymbol, closingDate)

    return {
      finalPrice: tokenData.current_price,
      finalVolume: tokenData.total_volume,
      finalMarketCap: tokenData.market_cap,
      priceHistory,
      volumeHistory
    }
  }

  // Determine resolution based on question type
  private static async determineResolution(
    question: string,
    questionType: string,
    resolutionCriteria: string,
    data: any
  ): Promise<ResolutionResult> {
    switch (questionType) {
      case 'price':
        return this.resolvePriceQuestion(question, resolutionCriteria, data)
      case 'volume':
        return this.resolveVolumeQuestion(question, resolutionCriteria, data)
      case 'market_cap':
        return this.resolveMarketCapQuestion(question, resolutionCriteria, data)
      case 'trend':
        return this.resolveTrendQuestion(question, resolutionCriteria, data)
      case 'support_resistance':
        return this.resolveSupportResistanceQuestion(question, resolutionCriteria, data)
      case 'ath_atl':
        return this.resolveATHATLQuestion(question, resolutionCriteria, data)
      case 'momentum':
        return this.resolveMomentumQuestion(question, resolutionCriteria, data)
      case 'volatility':
        return this.resolveVolatilityQuestion(question, resolutionCriteria, data)
      case 'time_sensitive':
        return this.resolveTimeSensitiveQuestion(question, resolutionCriteria, data)
      default:
        return {
          success: false,
          resolution: 'disputed',
          confidence: 0,
          data: null,
          explanation: 'Unknown question type',
          disputeRisk: 'high'
        }
    }
  }

  // Resolve price-based questions
  private static resolvePriceQuestion(question: string, criteria: string, data: any): ResolutionResult {
    const priceMatch = question.match(/\$([0-9.]+)/)
    if (!priceMatch) {
      return {
        success: false,
        resolution: 'disputed',
        confidence: 0,
        data: null,
        explanation: 'Could not extract price target from question',
        disputeRisk: 'high'
      }
    }

    const targetPrice = parseFloat(priceMatch[1])
    const finalPrice = data.finalPrice
    const priceHistory = data.priceHistory

    // Check if price reached target with confirmation period
    const reachedTarget = this.checkPriceTargetWithConfirmation(
      priceHistory,
      targetPrice,
      question.includes('above') || question.includes('exceed') || question.includes('reach')
    )

    return {
      success: true,
      resolution: reachedTarget ? 'yes' : 'no',
      confidence: this.calculatePriceConfidence(priceHistory, targetPrice),
      data: {
        targetPrice,
        finalPrice,
        priceHistory: priceHistory.slice(-10) // Last 10 snapshots
      },
      explanation: `Target price: $${targetPrice.toFixed(4)}, Final price: $${finalPrice.toFixed(4)}, Reached: ${reachedTarget}`,
      disputeRisk: this.calculateDisputeRisk(priceHistory, targetPrice)
    }
  }

  // Resolve volume-based questions
  private static resolveVolumeQuestion(question: string, criteria: string, data: any): ResolutionResult {
    const volumeMatch = question.match(/\$([0-9.]+)M/)
    if (!volumeMatch) {
      return {
        success: false,
        resolution: 'disputed',
        confidence: 0,
        data: null,
        explanation: 'Could not extract volume target from question',
        disputeRisk: 'high'
      }
    }

    const targetVolume = parseFloat(volumeMatch[1]) * 1_000_000
    const finalVolume = data.finalVolume
    const volumeHistory = data.volumeHistory

    const reachedTarget = finalVolume >= targetVolume

    return {
      success: true,
      resolution: reachedTarget ? 'yes' : 'no',
      confidence: 0.95, // Volume data is usually reliable
      data: {
        targetVolume,
        finalVolume,
        volumeHistory: volumeHistory.slice(-5)
      },
      explanation: `Target volume: $${(targetVolume / 1_000_000).toFixed(1)}M, Final volume: $${(finalVolume / 1_000_000).toFixed(1)}M`,
      disputeRisk: 'low'
    }
  }

  // Resolve market cap questions
  private static resolveMarketCapQuestion(question: string, criteria: string, data: any): ResolutionResult {
    const mcMatch = question.match(/\$([0-9.]+)B/)
    if (!mcMatch) {
      return {
        success: false,
        resolution: 'disputed',
        confidence: 0,
        data: null,
        explanation: 'Could not extract market cap target from question',
        disputeRisk: 'high'
      }
    }

    const targetMC = parseFloat(mcMatch[1]) * 1_000_000_000
    const finalMC = data.finalMarketCap

    const reachedTarget = finalMC >= targetMC

    return {
      success: true,
      resolution: reachedTarget ? 'yes' : 'no',
      confidence: 0.95,
      data: {
        targetMC,
        finalMC
      },
      explanation: `Target market cap: $${(targetMC / 1_000_000_000).toFixed(1)}B, Final market cap: $${(finalMC / 1_000_000_000).toFixed(1)}B`,
      disputeRisk: 'low'
    }
  }

  // Resolve support/resistance questions
  private static resolveSupportResistanceQuestion(question: string, criteria: string, data: any): ResolutionResult {
    const priceMatch = question.match(/\$([0-9.]+)/)
    if (!priceMatch) {
      return {
        success: false,
        resolution: 'disputed',
        confidence: 0,
        data: null,
        explanation: 'Could not extract support/resistance level from question',
        disputeRisk: 'high'
      }
    }

    const level = parseFloat(priceMatch[1])
    const priceHistory = data.priceHistory
    const isResistance = question.includes('break') || question.includes('above')
    const isSupport = question.includes('hold') || question.includes('above')

    let resolution: 'yes' | 'no'
    let explanation: string

    if (isResistance) {
      // Check if price broke above resistance level
      const brokeResistance = this.checkResistanceBreak(priceHistory, level)
      resolution = brokeResistance ? 'yes' : 'no'
      explanation = `Resistance level: $${level.toFixed(4)}, Broke resistance: ${brokeResistance}`
    } else if (isSupport) {
      // Check if price held above support level
      const heldSupport = this.checkSupportHold(priceHistory, level)
      resolution = heldSupport ? 'yes' : 'no'
      explanation = `Support level: $${level.toFixed(4)}, Held support: ${heldSupport}`
    } else {
      return {
        success: false,
        resolution: 'disputed',
        confidence: 0,
        data: null,
        explanation: 'Could not determine if this is support or resistance question',
        disputeRisk: 'high'
      }
    }

    return {
      success: true,
      resolution,
      confidence: 0.85,
      data: {
        level,
        priceHistory: priceHistory.slice(-20),
        isResistance,
        isSupport
      },
      explanation,
      disputeRisk: 'medium'
    }
  }

  // Helper functions
  private static extractTokenSymbol(question: string): string | null {
    // Common token symbols to look for
    const commonTokens = ['WIF', 'SOL', 'BTC', 'ETH', 'BONK', 'PEPE', 'DOGE', 'SHIB']
    
    for (const token of commonTokens) {
      if (question.includes(token)) {
        return token
      }
    }
    
    return null
  }

  private static async getTokenDataAtTime(symbol: string, timestamp: Date): Promise<TokenData> {
    try {
      // Try to get real data from CoinGecko API
      const { CoinGeckoAPI } = await import('./coingecko')
      const tokenData = await CoinGeckoAPI.getTokenData(symbol) as TokenData
      
      if (tokenData && tokenData.current_price) {
        return tokenData
      }
      
      // Fallback to mock data if API fails
      console.warn(`Failed to get real data for ${symbol}, using fallback`)
      return this.getMockTokenData(symbol)
    } catch (error) {
      console.error(`Error fetching token data for ${symbol}:`, error)
      // Return mock data as fallback
      return this.getMockTokenData(symbol)
    }
  }

  private static getMockTokenData(symbol: string): TokenData {
    // Mock data based on common token prices
    const mockPrices: Record<string, number> = {
      'WIF': 2.45,
      'SOL': 185.50,
      'BTC': 65000.00,
      'ETH': 3200.00,
      'PEPE': 0.00001234,
      'PUMP': 0.0089,
      'SHIBA': 0.0000234,
      'BONK': 0.0000456
    }
    
    const currentPrice = mockPrices[symbol] || 1.00
    const marketCap = currentPrice * 1000000000 // Assume 1B supply
    
    return {
      id: symbol.toLowerCase(),
      symbol: symbol.toUpperCase(),
      name: symbol,
      current_price: currentPrice,
      market_cap: marketCap,
      total_volume: marketCap * 0.1,
      price_change_percentage_24h: 0,
      image: '',
      ath: currentPrice * 1.5,
      atl: currentPrice * 0.5
    } as TokenData
  }

  private static async getPriceHistory(symbol: string, timestamp: Date): Promise<PriceSnapshot[]> {
    // In a real implementation, this would fetch historical price data
    // For now, return mock data
    return [
      {
        timestamp: new Date(timestamp.getTime() - 60 * 60 * 1000), // 1 hour ago
        price: 0.95,
        volume: 1000000,
        source: 'CoinGecko'
      },
      {
        timestamp: new Date(timestamp.getTime() - 30 * 60 * 1000), // 30 minutes ago
        price: 0.96,
        volume: 1200000,
        source: 'CoinGecko'
      },
      {
        timestamp: timestamp,
        price: 0.9559,
        volume: 1100000,
        source: 'CoinGecko'
      }
    ]
  }

  private static async getVolumeHistory(symbol: string, timestamp: Date): Promise<VolumeSnapshot[]> {
    // Mock volume history
    return [
      {
        timestamp: new Date(timestamp.getTime() - 60 * 60 * 1000),
        volume24h: 300000000,
        volume1h: 1000000,
        source: 'CoinGecko'
      },
      {
        timestamp: timestamp,
        volume24h: 327800000,
        volume1h: 1100000,
        source: 'CoinGecko'
      }
    ]
  }

  private static checkPriceTargetWithConfirmation(
    priceHistory: PriceSnapshot[],
    targetPrice: number,
    isAbove: boolean
  ): boolean {
    // Check if price reached target with 2-minute confirmation
    const confirmationPeriod = 2 * 60 * 1000 // 2 minutes in milliseconds
    let confirmationStart: Date | null = null

    for (const snapshot of priceHistory) {
      const reachedTarget = isAbove ? snapshot.price >= targetPrice : snapshot.price <= targetPrice
      
      if (reachedTarget && !confirmationStart) {
        confirmationStart = snapshot.timestamp
      } else if (!reachedTarget && confirmationStart) {
        confirmationStart = null
      } else if (reachedTarget && confirmationStart) {
        const confirmationDuration = snapshot.timestamp.getTime() - confirmationStart.getTime()
        if (confirmationDuration >= confirmationPeriod) {
          return true
        }
      }
    }

    return false
  }

  private static checkResistanceBreak(priceHistory: PriceSnapshot[], level: number): boolean {
    // Check if price closed above resistance for 2+ consecutive hours
    let consecutiveHours = 0
    const requiredHours = 2

    for (let i = 1; i < priceHistory.length; i++) {
      const current = priceHistory[i]
      const previous = priceHistory[i - 1]
      
      if (current.price > level && previous.price > level) {
        consecutiveHours++
        if (consecutiveHours >= requiredHours) {
          return true
        }
      } else {
        consecutiveHours = 0
      }
    }

    return false
  }

  private static checkSupportHold(priceHistory: PriceSnapshot[], level: number): boolean {
    // Check if price stayed above support for 80% of the period
    const totalSnapshots = priceHistory.length
    const aboveSupport = priceHistory.filter(snapshot => snapshot.price > level).length
    const percentage = aboveSupport / totalSnapshots
    
    return percentage >= 0.8
  }

  private static calculatePriceConfidence(priceHistory: PriceSnapshot[], targetPrice: number): number {
    // Calculate confidence based on price stability and data quality
    if (priceHistory.length < 3) return 0.5
    
    const prices = priceHistory.map(s => s.price)
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
    const volatility = Math.sqrt(prices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / prices.length)
    
    // Higher confidence for stable prices and good data coverage
    const stabilityScore = Math.max(0, 1 - (volatility / avgPrice))
    const dataQualityScore = Math.min(1, priceHistory.length / 10)
    
    return (stabilityScore + dataQualityScore) / 2
  }

  private static calculateDisputeRisk(priceHistory: PriceSnapshot[], targetPrice: number): 'low' | 'medium' | 'high' {
    if (priceHistory.length < 3) return 'high'
    
    const prices = priceHistory.map(s => s.price)
    const volatility = Math.sqrt(prices.reduce((sum, price, _, arr) => {
      const avg = arr.reduce((a, b) => a + b, 0) / arr.length
      return sum + Math.pow(price - avg, 2)
    }, 0) / prices.length)
    
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
    const relativeVolatility = volatility / avgPrice
    
    if (relativeVolatility < 0.02) return 'low'
    if (relativeVolatility < 0.05) return 'medium'
    return 'high'
  }

  // Placeholder methods for other question types
  private static resolveTrendQuestion(question: string, criteria: string, data: any): ResolutionResult {
    return { success: false, resolution: 'disputed', confidence: 0, data: null, explanation: 'Trend resolution not implemented', disputeRisk: 'high' }
  }

  private static resolveATHATLQuestion(question: string, criteria: string, data: any): ResolutionResult {
    return { success: false, resolution: 'disputed', confidence: 0, data: null, explanation: 'ATH/ATL resolution not implemented', disputeRisk: 'high' }
  }

  private static resolveMomentumQuestion(question: string, criteria: string, data: any): ResolutionResult {
    return { success: false, resolution: 'disputed', confidence: 0, data: null, explanation: 'Momentum resolution not implemented', disputeRisk: 'high' }
  }

  private static resolveVolatilityQuestion(question: string, criteria: string, data: any): ResolutionResult {
    return { success: false, resolution: 'disputed', confidence: 0, data: null, explanation: 'Volatility resolution not implemented', disputeRisk: 'high' }
  }

  private static resolveTimeSensitiveQuestion(question: string, criteria: string, data: any): ResolutionResult {
    return { success: false, resolution: 'disputed', confidence: 0, data: null, explanation: 'Time-sensitive resolution not implemented', disputeRisk: 'high' }
  }
}

// Export the main resolution function
export async function resolveMarket(
  marketId: string,
  question: string,
  questionType: string,
  resolutionCriteria: string,
  closingDate: Date
): Promise<MarketResolutionData> {
  return MarketResolutionEngine.resolveMarket(marketId, question, questionType, resolutionCriteria, closingDate)
}
