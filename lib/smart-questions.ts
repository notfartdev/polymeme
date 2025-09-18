import { TokenData } from './coingecko'

export interface MarketContext {
  currentPrice: number
  marketCap: number
  volume: number
  priceChange24h: number
  priceChange7d: number
  priceChange30d: number
  ath: number
  atl: number
  volatility: number
  supportLevel?: number
  resistanceLevel?: number
  timeOfDay: string
  isTradingHours: boolean
}

export interface SmartQuestion {
  question: string
  timeframe: string
  expectedProbability: number // 0-1
  resolutionCriteria: string
  questionType: 'price' | 'volume' | 'market_cap' | 'trend' | 'support_resistance' | 'ath_atl' | 'momentum' | 'volatility' | 'time_sensitive'
}

// Timeframe-specific parameters
const TIMEFRAME_CONFIG = {
  '1H': {
    minPriceChange: 0.005, // 0.5% minimum
    maxPriceChange: 0.02,  // 2% maximum
    volumeMultiplier: 1.5,
    realisticMove: 0.01    // 1% realistic move
  },
  '3H': {
    minPriceChange: 0.01,  // 1% minimum
    maxPriceChange: 0.05,  // 5% maximum
    volumeMultiplier: 2.0,
    realisticMove: 0.025   // 2.5% realistic move
  },
  '6H': {
    minPriceChange: 0.015, // 1.5% minimum
    maxPriceChange: 0.08,  // 8% maximum
    volumeMultiplier: 2.5,
    realisticMove: 0.035   // 3.5% realistic move
  },
  '12H': {
    minPriceChange: 0.02,  // 2% minimum
    maxPriceChange: 0.12,  // 12% maximum
    volumeMultiplier: 2.8,
    realisticMove: 0.045   // 4.5% realistic move
  },
  '24H': {
    minPriceChange: 0.02,  // 2% minimum
    maxPriceChange: 0.15,  // 15% maximum
    volumeMultiplier: 3.0,
    realisticMove: 0.05    // 5% realistic move
  }
}

export class SmartQuestionEngine {
  // Create market context from token data
  public static createMarketContext(tokenData: TokenData): MarketContext {
    const now = new Date()
    const hour = now.getHours()
    const isTradingHours = hour >= 9 && hour <= 16 // 9 AM - 4 PM EST
    
    return {
      currentPrice: tokenData.current_price,
      marketCap: tokenData.market_cap,
      volume: tokenData.total_volume,
      priceChange24h: tokenData.price_change_percentage_24h,
      priceChange7d: tokenData.price_change_percentage_7d_in_currency,
      priceChange30d: tokenData.price_change_percentage_30d_in_currency,
      ath: tokenData.ath,
      atl: tokenData.atl,
      volatility: Math.abs(tokenData.price_change_percentage_24h) / 100,
      supportLevel: tokenData.current_price * 0.95, // 5% below current
      resistanceLevel: tokenData.current_price * 1.05, // 5% above current
      timeOfDay: hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening',
      isTradingHours
    }
  }

  // Generate diverse questions based on token data and timeframe
  public static generateQuestions(
    tokenData: TokenData,
    timeframe: string,
    marketContext: MarketContext
  ): SmartQuestion[] {
    const questions: SmartQuestion[] = []
    const config = TIMEFRAME_CONFIG[timeframe]
    if (!config) return []

    // 1. Price-based questions (3-4 questions)
    questions.push(...this.generatePriceQuestions(tokenData, timeframe, marketContext, config))

    // 2. Volume questions (1-2 questions)
    questions.push(...this.generateVolumeQuestions(tokenData, timeframe, marketContext, config))

    // 3. Market Cap questions (1-2 questions)
    questions.push(...this.generateMarketCapQuestions(tokenData, timeframe, marketContext, config))

    // 4. Trend questions (1-2 questions)
    questions.push(...this.generateTrendQuestions(tokenData, timeframe, marketContext, config))

    // 5. Support/Resistance questions (1-2 questions)
    if (marketContext.supportLevel && marketContext.resistanceLevel) {
      questions.push(...this.generateSupportResistanceQuestions(tokenData, timeframe, marketContext))
    }

    // 6. ATH/ATL questions (1-2 questions)
    questions.push(...this.generateATHATLQuestions(tokenData, timeframe, marketContext))
    
    // 7. Momentum and volatility questions (1-2 questions)
    questions.push(...this.generateMomentumQuestions(tokenData, timeframe, marketContext, config))
    
    // 8. Time-sensitive questions (1-2 questions)
    questions.push(...this.generateTimeSensitiveQuestions(tokenData, timeframe, marketContext))

    // Filter and validate questions
    const validQuestions = questions
      .map(q => ({ ...q, ...this.validateQuestion(q, marketContext) }))
      .filter(q => q.isValid && q.manipulationRisk === 'low')

    // Return up to 10 questions, prioritizing diverse types
    return this.diversifyQuestions(validQuestions)
      .slice(0, 10)
  }

  // Generate price-based questions
  private static generatePriceQuestions(
    tokenData: TokenData,
    timeframe: string,
    context: MarketContext,
    config: any
  ): SmartQuestion[] {
    const questions: SmartQuestion[] = []
    const currentPrice = context.currentPrice
    const realisticMove = currentPrice * config.realisticMove

    // Bullish target
    const bullishTarget = currentPrice + realisticMove
    questions.push({
      question: `Will ${tokenData.symbol} reach $${bullishTarget.toFixed(4)} or higher in the next ${timeframe}?`,
      timeframe,
      expectedProbability: 0.6,
      resolutionCriteria: `Price must reach or exceed $${bullishTarget.toFixed(4)} within the specified timeframe`,
      questionType: 'price' as const
    })
    
    // Bearish target
    const bearishTarget = currentPrice - realisticMove
    questions.push({
      question: `Will ${tokenData.symbol} drop below $${bearishTarget.toFixed(4)} in the next ${timeframe}?`,
      timeframe,
      expectedProbability: 0.4,
      resolutionCriteria: `Price must drop below $${bearishTarget.toFixed(4)} within the specified timeframe`,
      questionType: 'price' as const
    })

    // Moderate bullish target
    const moderateBullish = currentPrice * (1 + config.minPriceChange)
    questions.push({
      question: `Will ${tokenData.symbol} stay above $${moderateBullish.toFixed(4)} in the next ${timeframe}?`,
      timeframe,
      expectedProbability: 0.55,
      resolutionCriteria: `Price must remain above $${moderateBullish.toFixed(4)} within the specified timeframe`,
      questionType: 'price' as const
    })

    return questions
  }

  // Generate volume-based questions
  private static generateVolumeQuestions(
    tokenData: TokenData,
    timeframe: string,
    context: MarketContext,
    config: any
  ): SmartQuestion[] {
    const questions: SmartQuestion[] = []
    const currentVolume = context.volume
    const volumeThreshold = currentVolume * config.volumeMultiplier
    
    questions.push({
      question: `Will ${tokenData.symbol} volume exceed $${(volumeThreshold / 1e6).toFixed(1)}M in the next ${timeframe}?`,
      timeframe,
      expectedProbability: 0.3,
      resolutionCriteria: `24-hour volume must exceed $${(volumeThreshold / 1e6).toFixed(1)}M within the specified timeframe`,
      questionType: 'volume' as const
    })

    return questions
  }

  // Generate market cap questions
  private static generateMarketCapQuestions(
    tokenData: TokenData,
    timeframe: string,
    context: MarketContext
  ): SmartQuestion[] {
    const questions: SmartQuestion[] = []
    const currentMC = context.marketCap
    
    // Only generate market cap questions for reasonable targets
    if (currentMC < 1e9) { // Less than $1B
      questions.push({
        question: `Will ${tokenData.symbol} reach $1B market cap in the next ${timeframe}?`,
        timeframe,
        expectedProbability: 0.2,
        resolutionCriteria: `Market cap must reach or exceed $1B within the specified timeframe`,
        questionType: 'market_cap' as const
      })
    } else if (currentMC < 5e9) { // Less than $5B
      questions.push({
        question: `Will ${tokenData.symbol} reach $5B market cap in the next ${timeframe}?`,
        timeframe,
        expectedProbability: 0.15,
        resolutionCriteria: `Market cap must reach or exceed $5B within the specified timeframe`,
        questionType: 'market_cap' as const
      })
    }

    return questions
  }

  // Generate trend-based questions
  private static generateTrendQuestions(
    tokenData: TokenData,
    timeframe: string,
    context: MarketContext,
    config: any
  ): SmartQuestion[] {
    const questions: SmartQuestion[] = []
    const priceChange24h = context.priceChange24h
    const currentPrice = context.currentPrice
    
    // Trend continuation questions
    if (priceChange24h > 5) { // Strong uptrend
      const continuationTarget = currentPrice * (1 + config.minPriceChange)
      questions.push({
        question: `Will ${tokenData.symbol} continue its uptrend and reach $${continuationTarget.toFixed(4)} in the next ${timeframe}?`,
        timeframe,
        expectedProbability: 0.6,
        resolutionCriteria: `Price must reach or exceed $${continuationTarget.toFixed(4)} within the specified timeframe`,
        questionType: 'trend' as const
      })
    } else if (priceChange24h < -5) { // Strong downtrend
      const reversalTarget = currentPrice * (1 + config.minPriceChange)
      questions.push({
        question: `Will ${tokenData.symbol} reverse its downtrend and reach $${reversalTarget.toFixed(4)} in the next ${timeframe}?`,
        timeframe,
        expectedProbability: 0.3,
        resolutionCriteria: `Price must reach or exceed $${reversalTarget.toFixed(4)} within the specified timeframe`,
        questionType: 'trend' as const
      })
    }

    return questions
  }

  // Generate support/resistance questions
  private static generateSupportResistanceQuestions(
    tokenData: TokenData,
    timeframe: string,
    context: MarketContext
  ): SmartQuestion[] {
    const questions: SmartQuestion[] = []
    const { supportLevel, resistanceLevel, currentPrice } = context
    
    if (resistanceLevel && resistanceLevel > currentPrice) {
      questions.push({
        question: `Will ${tokenData.symbol} break resistance at $${resistanceLevel.toFixed(4)} in the next ${timeframe}?`,
        timeframe,
        expectedProbability: 0.4,
        resolutionCriteria: `Price must reach or exceed $${resistanceLevel.toFixed(4)} within the specified timeframe`,
        questionType: 'support_resistance' as const
      })
    }
    
    if (supportLevel && supportLevel < currentPrice) {
      questions.push({
        question: `Will ${tokenData.symbol} hold above support at $${supportLevel.toFixed(4)} in the next ${timeframe}?`,
        timeframe,
        expectedProbability: 0.6,
        resolutionCriteria: `Price must remain above $${supportLevel.toFixed(4)} within the specified timeframe`,
        questionType: 'support_resistance' as const
      })
    }

    return questions
  }

  // Generate ATH/ATL questions
  private static generateATHATLQuestions(
    tokenData: TokenData,
    timeframe: string,
    context: MarketContext
  ): SmartQuestion[] {
    const questions: SmartQuestion[] = []
    const { ath, atl, currentPrice } = context
    
    // ATH questions (only if ATH is within reasonable distance)
    if (ath > currentPrice) {
      const athDistance = ((ath - currentPrice) / currentPrice) * 100
      if (athDistance < 50) { // Only if ATH is within 50%
        questions.push({
          question: `Will ${tokenData.symbol} break its ATH of $${ath.toFixed(4)} in the next ${timeframe}?`,
          timeframe,
          expectedProbability: 0.2,
          resolutionCriteria: `Price must reach or exceed $${ath.toFixed(4)} within the specified timeframe`,
          questionType: 'ath_atl' as const
        })
      }
    }
    
    // ATL questions (only if ATL is within reasonable distance)
    if (atl < currentPrice) {
      const atlDistance = ((currentPrice - atl) / currentPrice) * 100
      if (atlDistance < 30) { // Only if ATL is within 30%
        questions.push({
          question: `Will ${tokenData.symbol} retest its ATL of $${atl.toFixed(4)} in the next ${timeframe}?`,
          timeframe,
          expectedProbability: 0.2,
          resolutionCriteria: `Price must reach or drop below $${atl.toFixed(4)} within the specified timeframe`,
          questionType: 'ath_atl' as const
        })
      }
    }

    return questions
  }

  // Generate momentum and volatility questions
  private static generateMomentumQuestions(
    tokenData: TokenData,
    timeframe: string,
    context: MarketContext,
    config: any
  ): SmartQuestion[] {
    const questions: SmartQuestion[] = []
    const { currentPrice, priceChange24h, volatility } = context
    
    // Momentum questions based on recent price action
    if (Math.abs(priceChange24h) > 10) { // High volatility
      const momentumTarget = currentPrice * (1 + (priceChange24h > 0 ? 0.02 : -0.02))
      questions.push({
        question: `Will ${tokenData.symbol} ${priceChange24h > 0 ? 'continue' : 'reverse'} its momentum and reach $${momentumTarget.toFixed(4)} in the next ${timeframe}?`,
        timeframe,
        expectedProbability: 0.4,
        resolutionCriteria: `Price must reach or exceed $${momentumTarget.toFixed(4)} within the specified timeframe`,
        questionType: 'momentum' as const
      })
    }

    // Volatility questions
    if (volatility > 0.1) { // High volatility token
      const swingPercentages = {
        '1H': '5%',
        '3H': '8%',
        '6H': '10%',
        '12H': '12%',
        '24H': '15%'
      }
      const swingPercent = swingPercentages[timeframe] || '10%'
      
      questions.push({
        question: `Will ${tokenData.symbol} experience a ${swingPercent}+ price swing in the next ${timeframe}?`,
        timeframe,
        expectedProbability: 0.3,
        resolutionCriteria: `Price must move ${swingPercent} or more in either direction within the specified timeframe`,
        questionType: 'volatility' as const
      })
    }

    return questions
  }

  // Generate time-sensitive questions
  private static generateTimeSensitiveQuestions(
    tokenData: TokenData,
    timeframe: string,
    context: MarketContext
  ): SmartQuestion[] {
    const questions: SmartQuestion[] = []
    const { timeOfDay, isTradingHours, currentPrice } = context
    
    // Trading hours questions
    if (isTradingHours && ['3H', '6H', '12H'].includes(timeframe)) {
      questions.push({
        question: `Will ${tokenData.symbol} maintain above $${(currentPrice * 0.98).toFixed(4)} during US trading hours?`,
        timeframe,
        expectedProbability: 0.6,
        resolutionCriteria: `Price must remain above $${(currentPrice * 0.98).toFixed(4)} during US trading hours (9 AM - 4 PM EST)`,
        questionType: 'time_sensitive' as const
      })
    }

    // Mid-day questions for 6H and 12H timeframes
    if (timeframe === '6H') {
      questions.push({
        question: `Will ${tokenData.symbol} maintain above $${(currentPrice * 0.99).toFixed(4)} for the next 6 hours?`,
        timeframe,
        expectedProbability: 0.55,
        resolutionCriteria: `Price must remain above $${(currentPrice * 0.99).toFixed(4)} for the entire 6-hour period`,
        questionType: 'time_sensitive' as const
      })
    }

    if (timeframe === '12H') {
      questions.push({
        question: `Will ${tokenData.symbol} reach $${(currentPrice * 1.03).toFixed(4)} within the next 12 hours?`,
        timeframe,
        expectedProbability: 0.4,
        resolutionCriteria: `Price must reach or exceed $${(currentPrice * 1.03).toFixed(4)} within the 12-hour period`,
        questionType: 'time_sensitive' as const
      })
    }

    // End-of-day questions for 24H timeframe
    if (timeframe === '24H') {
      questions.push({
        question: `Will ${tokenData.symbol} close above $${(currentPrice * 1.02).toFixed(4)} today?`,
        timeframe,
        expectedProbability: 0.45,
        resolutionCriteria: `Price must close above $${(currentPrice * 1.02).toFixed(4)} at end of trading day`,
        questionType: 'time_sensitive' as const
      })
    }

    return questions
  }

  // Diversify questions to ensure variety
  private static diversifyQuestions(questions: any[]): SmartQuestion[] {
    const typeCounts: { [key: string]: number } = {}
    const diversified: SmartQuestion[] = []
    
    // Sort by question type to ensure variety
    const sortedQuestions = questions.sort((a, b) => {
      const aCount = typeCounts[a.questionType] || 0
      const bCount = typeCounts[b.questionType] || 0
      return aCount - bCount
    })
    
    for (const question of sortedQuestions) {
      const type = question.questionType
      if ((typeCounts[type] || 0) < 2) { // Max 2 questions per type
        diversified.push(question)
        typeCounts[type] = (typeCounts[type] || 0) + 1
      }
    }
    
    return diversified
  }

  // Validate question fairness and anti-manipulation
  private static validateQuestion(question: SmartQuestion, context: MarketContext): { isValid: boolean; manipulationRisk: 'low' | 'medium' | 'high' } {
    // Check if probability is within fair range (10-90%)
    const isFair = question.expectedProbability >= 0.1 && question.expectedProbability <= 0.9
    
    // Check for manipulation risk
    let manipulationRisk: 'low' | 'medium' | 'high' = 'low'
    
    // High manipulation risk if probability is too extreme
    if (question.expectedProbability < 0.05 || question.expectedProbability > 0.95) {
      manipulationRisk = 'high'
    }
    // Medium risk for extreme but not impossible probabilities
    else if (question.expectedProbability < 0.1 || question.expectedProbability > 0.9) {
      manipulationRisk = 'medium'
    }
    
    return {
      isValid: isFair,
      manipulationRisk
    }
  }
}

// Export the main function for easy use
export async function generateSmartQuestions(
  tokenData: TokenData,
  timeframe: string
): Promise<SmartQuestion[]> {
  const marketContext = SmartQuestionEngine.createMarketContext(tokenData)
  return SmartQuestionEngine.generateQuestions(tokenData, timeframe, marketContext)
}