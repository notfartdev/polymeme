import { TokenData } from './coingecko'
import { SmartQuestion } from './smart-questions'

export interface MarketContext {
  currentPrice: number
  marketCap: number
  volume: number
  priceChange24h: number
  volatility: number
  liquidity: 'high' | 'medium' | 'low'
  tokenSymbol: string
  timeframe: string
}

export interface SmartDescription {
  title: string
  description: string
  resolutionCriteria: string
  dataSources: string
  edgeCases: string
  disputeResolution: string
  marketContext: string
  tokenContext: string
  historicalContext: string
  liquidityContext: string
  confidence: number
}

export class SmartDescriptionEngine {
  // Create market context for description generation
  public static createMarketContext(tokenData: TokenData, question: SmartQuestion): MarketContext {
    const volume = tokenData.total_volume
    const marketCap = tokenData.market_cap
    
    // Determine liquidity level
    let liquidity: 'high' | 'medium' | 'low' = 'low'
    if (volume > 10_000_000 && marketCap > 100_000_000) {
      liquidity = 'high'
    } else if (volume > 1_000_000 && marketCap > 10_000_000) {
      liquidity = 'medium'
    }
    
    return {
      currentPrice: tokenData.current_price,
      marketCap,
      volume,
      priceChange24h: tokenData.price_change_percentage_24h,
      volatility: Math.abs(tokenData.price_change_percentage_24h) / 100,
      liquidity,
      tokenSymbol: tokenData.symbol,
      timeframe: question.timeframe
    }
  }

  // Generate comprehensive descriptions based on question type
  public static generateDescriptions(question: SmartQuestion, tokenData: TokenData): SmartDescription[] {
    const context = this.createMarketContext(tokenData, question)
    const descriptions: SmartDescription[] = []

    // Generate question-type specific descriptions
    switch (question.questionType) {
      case 'price':
        descriptions.push(...this.generatePriceDescriptions(question, context))
        break
      case 'volume':
        descriptions.push(...this.generateVolumeDescriptions(question, context))
        break
      case 'market_cap':
        descriptions.push(...this.generateMarketCapDescriptions(question, context))
        break
      case 'trend':
        descriptions.push(...this.generateTrendDescriptions(question, context))
        break
      case 'support_resistance':
        descriptions.push(...this.generateSupportResistanceDescriptions(question, context))
        break
      case 'ath_atl':
        descriptions.push(...this.generateATHATLDescriptions(question, context))
        break
      case 'momentum':
        descriptions.push(...this.generateMomentumDescriptions(question, context))
        break
      case 'volatility':
        descriptions.push(...this.generateVolatilityDescriptions(question, context))
        break
      case 'time_sensitive':
        descriptions.push(...this.generateTimeSensitiveDescriptions(question, context))
        break
    }

    // Add general comprehensive description
    descriptions.push(this.generateComprehensiveDescription(question, context))

    return descriptions.slice(0, 3) // Return top 3 most relevant descriptions
  }

  // Generate price-based descriptions
  private static generatePriceDescriptions(question: SmartQuestion, context: MarketContext): SmartDescription[] {
    const descriptions: SmartDescription[] = []
    const { tokenSymbol, timeframe, currentPrice, liquidity } = context

    // Extract price target from question
    const priceMatch = question.question.match(/\$([0-9.]+)/)
    const targetPrice = priceMatch ? parseFloat(priceMatch[1]) : currentPrice

    // Standard price description
    descriptions.push({
      title: "Standard Price Resolution",
      description: `This market resolves to "YES" if ${tokenSymbol} reaches or exceeds $${targetPrice.toFixed(4)} within the specified ${timeframe} timeframe. The resolution is based on the highest price achieved during the market period, not just a momentary touch.`,
      resolutionCriteria: `Resolution occurs when ${tokenSymbol} trades at or above $${targetPrice.toFixed(4)} for a minimum of 2 minutes (to prevent flash price manipulation). The price must be sustained across multiple exchanges with a minimum volume of $10,000 during the confirmation period.`,
      dataSources: `Price data sourced from CoinGecko's aggregated feed, which includes: Binance (30% weight), Coinbase (25% weight), Kraken (20% weight), and other major exchanges. Data is updated every 30 seconds and volume-weighted to prevent manipulation.`,
      edgeCases: `If ${tokenSymbol} experiences a flash crash or pump (>20% in <5 minutes), the price must be sustained for 10 minutes to count. During low liquidity periods (<$100K volume), resolution requires 5-minute confirmation. Market gaps or exchange outages do not affect resolution.`,
      disputeResolution: `Disputes must be submitted within 24 hours of market close. Resolution committee reviews data from 3+ independent sources. Final decision is binding and based on objective price data.`,
      marketContext: this.generateMarketContext(context),
      tokenContext: this.generateTokenContext(context),
      historicalContext: this.generateHistoricalContext(context),
      liquidityContext: this.generateLiquidityContext(context),
      confidence: 0.95
    })

    // High-frequency description for short timeframes
    if (['1H', '3H'].includes(timeframe)) {
      descriptions.push({
        title: "High-Frequency Price Tracking",
        description: `This market uses minute-by-minute price tracking for the ${timeframe} period. Resolution requires ${tokenSymbol} to maintain above $${targetPrice.toFixed(4)} for at least 3 consecutive minutes to prevent flash manipulation.`,
        resolutionCriteria: `Price must exceed $${targetPrice.toFixed(4)} for 3+ consecutive minutes with minimum $5,000 volume per minute. Data points are collected every 60 seconds from CoinGecko's real-time feed.`,
        dataSources: `Real-time data from CoinGecko API (1-minute intervals), aggregated from 15+ exchanges including Binance, Coinbase, Kraken, KuCoin, and Bybit. Volume-weighted average prevents single-exchange manipulation.`,
        edgeCases: `Flash spikes (<2 minutes) are ignored. During high volatility (>10% in 5 minutes), confirmation period extends to 5 minutes. Low volume periods (<$50K/hour) require 5-minute confirmation.`,
        disputeResolution: `Real-time data logs are maintained. Disputes reviewed within 2 hours using timestamped data from multiple sources. Technical analysis of price charts may be used for verification.`,
        marketContext: this.generateMarketContext(context),
        tokenContext: this.generateTokenContext(context),
        historicalContext: this.generateHistoricalContext(context),
        liquidityContext: this.generateLiquidityContext(context),
        confidence: 0.92
      })
    }

    return descriptions
  }

  // Generate volume-based descriptions
  private static generateVolumeDescriptions(question: SmartQuestion, context: MarketContext): SmartDescription[] {
    const { tokenSymbol, timeframe, volume, liquidity } = context
    
    // Extract volume target from question
    const volumeMatch = question.question.match(/\$([0-9.]+)M/)
    const targetVolume = volumeMatch ? parseFloat(volumeMatch[1]) * 1_000_000 : volume * 2

    return [{
      title: "Volume-Based Resolution",
      description: `This market resolves to "YES" if ${tokenSymbol} achieves 24-hour trading volume exceeding $${(targetVolume / 1_000_000).toFixed(1)}M within the specified ${timeframe} timeframe. Volume is calculated as the sum of all buy and sell orders.`,
      resolutionCriteria: `Volume must exceed $${(targetVolume / 1_000_000).toFixed(1)}M within any 24-hour rolling window during the market period. Volume data is aggregated from all major exchanges and updated hourly.`,
      dataSources: `Volume data from CoinGecko's comprehensive exchange database, including 100+ exchanges. Data is cleaned to remove wash trading and includes only legitimate trading volume.`,
      edgeCases: `Wash trading is filtered out using CoinGecko's proprietary algorithms. Volume spikes from single large orders are included. Exchange outages do not affect volume calculations.`,
      disputeResolution: `Volume data is independently verified using multiple sources. Disputes require showing evidence of data manipulation or calculation errors.`,
      confidence: 0.88
    }]
  }

  // Generate market cap descriptions
  private static generateMarketCapDescriptions(question: SmartQuestion, context: MarketContext): SmartDescription[] {
    const { tokenSymbol, timeframe, marketCap } = context
    
    // Extract market cap target from question
    const mcMatch = question.question.match(/\$([0-9.]+)B/)
    const targetMC = mcMatch ? parseFloat(mcMatch[1]) * 1_000_000_000 : marketCap * 2

    return [{
      title: "Market Cap Milestone Resolution",
      description: `This market resolves to "YES" if ${tokenSymbol} reaches a market capitalization of $${(targetMC / 1_000_000_000).toFixed(1)}B within the specified ${timeframe} timeframe. Market cap is calculated as circulating supply × current price.`,
      resolutionCriteria: `Market cap must reach or exceed $${(targetMC / 1_000_000_000).toFixed(1)}B for at least 1 hour during the market period. Calculation uses circulating supply data from CoinGecko and real-time price feeds.`,
      dataSources: `Market cap data from CoinGecko, which tracks circulating supply from official token contracts and price data from major exchanges. Supply data is updated daily, price data every 30 seconds.`,
      edgeCases: `Supply changes (burns, unlocks) during the market period are accounted for. Price manipulation affecting market cap requires sustained movement (>1 hour) to count.`,
      disputeResolution: `Market cap calculations are independently verified using official token contract data and multiple price sources. Disputes require evidence of supply or price data errors.`,
      confidence: 0.90
    }]
  }

  // Generate trend-based descriptions
  private static generateTrendDescriptions(question: SmartQuestion, context: MarketContext): SmartDescription[] {
    const { tokenSymbol, timeframe, priceChange24h } = context

    return [{
      title: "Trend Continuation Analysis",
      description: `This market evaluates whether ${tokenSymbol}'s current trend (${priceChange24h > 0 ? 'uptrend' : 'downtrend'}) will continue or reverse within the ${timeframe} timeframe. Resolution is based on price action and momentum indicators.`,
      resolutionCriteria: `Trend continuation requires price to move in the same direction as the current trend for at least 60% of the market period. Momentum is measured using 4-hour moving averages and RSI indicators.`,
      dataSources: `Technical analysis data from TradingView and CoinGecko, including moving averages, RSI, MACD, and volume indicators. Data is updated every 15 minutes.`,
      edgeCases: `Sideways movement (<2% change) is considered trend continuation. High volatility periods (>15% daily change) require additional confirmation.`,
      disputeResolution: `Technical analysis is performed by certified analysts using standardized indicators. Disputes require showing calculation errors or data manipulation.`,
      confidence: 0.75
    }]
  }

  // Generate support/resistance descriptions
  private static generateSupportResistanceDescriptions(question: SmartQuestion, context: MarketContext): SmartDescription[] {
    const { tokenSymbol, timeframe, currentPrice } = context

    return [{
      title: "Support/Resistance Level Analysis",
      description: `This market tests whether ${tokenSymbol} can break through or hold at key support/resistance levels within the ${timeframe} timeframe. Levels are determined using technical analysis of historical price action.`,
      resolutionCriteria: `Break of resistance requires price to close above the level for 2+ consecutive hours. Support hold requires price to stay above the level for 80% of the market period.`,
      dataSources: `Technical analysis from TradingView, using 4-hour and daily charts. Support/resistance levels are calculated using pivot points and historical price clusters.`,
      edgeCases: `False breaks (quick reversal) are ignored. Levels are adjusted for significant market events or news.`,
      disputeResolution: `Technical analysis is performed by multiple analysts. Disputes require consensus from 3+ independent technical analysts.`,
      confidence: 0.80
    }]
  }

  // Generate ATH/ATL descriptions
  private static generateATHATLDescriptions(question: SmartQuestion, context: MarketContext): SmartDescription[] {
    const { tokenSymbol, timeframe } = context

    return [{
      title: "All-Time High/Low Resolution",
      description: `This market tests whether ${tokenSymbol} can reach new all-time highs or lows within the ${timeframe} timeframe. Historical data is used to establish current ATH/ATL levels.`,
      resolutionCriteria: `New ATH requires price to exceed the previous all-time high by at least 0.1%. New ATL requires price to fall below the previous all-time low by at least 0.1%.`,
      dataSources: `Historical price data from CoinGecko, covering the token's entire trading history. ATH/ATL levels are updated in real-time and verified against multiple sources.`,
      edgeCases: `Flash spikes that don't sustain are ignored. Historical data includes all major exchanges where the token has traded.`,
      disputeResolution: `Historical data is independently verified using multiple sources. Disputes require showing errors in historical price records.`,
      confidence: 0.95
    }]
  }

  // Generate momentum descriptions
  private static generateMomentumDescriptions(question: SmartQuestion, context: MarketContext): SmartDescription[] {
    const { tokenSymbol, timeframe, volatility } = context

    return [{
      title: "Momentum Analysis Resolution",
      description: `This market evaluates ${tokenSymbol}'s price momentum within the ${timeframe} timeframe. Momentum is measured using multiple technical indicators and price action patterns.`,
      resolutionCriteria: `Momentum continuation requires RSI > 60 for bullish momentum or RSI < 40 for bearish momentum, sustained for at least 4 hours. Volume must support the momentum direction.`,
      dataSources: `Technical indicators from TradingView and CoinGecko, including RSI, MACD, Stochastic, and volume analysis. Data updated every 15 minutes.`,
      edgeCases: `High volatility periods (>20% daily change) require additional confirmation. Momentum must be supported by volume increase of at least 50%.`,
      disputeResolution: `Technical analysis performed by certified analysts using standardized parameters. Disputes require showing calculation errors or data issues.`,
      confidence: 0.78
    }]
  }

  // Generate volatility descriptions
  private static generateVolatilityDescriptions(question: SmartQuestion, context: MarketContext): SmartDescription[] {
    const { tokenSymbol, timeframe } = context

    return [{
      title: "Volatility Measurement Resolution",
      description: `This market measures ${tokenSymbol}'s price volatility within the ${timeframe} timeframe. Volatility is calculated using standard deviation of price changes over the period.`,
      resolutionCriteria: `Volatility target must be achieved within any 4-hour window during the market period. Calculation uses hourly price data and excludes outliers (>3 standard deviations).`,
      dataSources: `Price data from CoinGecko, sampled every hour. Volatility calculations use statistical methods to ensure accuracy and remove manipulation attempts.`,
      edgeCases: `Extreme price movements (>50% in 1 hour) are excluded from calculations. Low liquidity periods may affect volatility measurements.`,
      disputeResolution: `Statistical calculations are independently verified. Disputes require showing mathematical errors or data manipulation.`,
      confidence: 0.85
    }]
  }

  // Generate time-sensitive descriptions
  private static generateTimeSensitiveDescriptions(question: SmartQuestion, context: MarketContext): SmartDescription[] {
    const { tokenSymbol, timeframe } = context

    return [{
      title: "Time-Sensitive Market Resolution",
      description: `This market has specific time-based criteria within the ${timeframe} timeframe. Resolution depends on price action during specific time periods or market conditions.`,
      resolutionCriteria: `Time-based criteria must be met during the specified time windows. Trading hours are defined as 9 AM - 4 PM EST for traditional market correlation.`,
      dataSources: `Time-stamped price data from CoinGecko, synchronized to UTC. Market hours are defined using EST/EDT timezone standards.`,
      edgeCases: `Weekend and holiday trading is included. Time zone changes (DST) are automatically handled. Market gaps do not affect resolution.`,
      disputeResolution: `Time-based data is independently verified using multiple sources. Disputes require showing time zone or timestamp errors.`,
      confidence: 0.88
    }]
  }

  // Generate comprehensive description
  private static generateComprehensiveDescription(question: SmartQuestion, context: MarketContext): SmartDescription {
    const { tokenSymbol, timeframe, liquidity, volatility, currentPrice, marketCap, volume } = context

    return {
      title: "Comprehensive Market Rules",
      description: `This prediction market for ${tokenSymbol} operates under strict rules to ensure fair and transparent resolution. The market will resolve based on objective data and predefined criteria within the ${timeframe} timeframe.`,
      resolutionCriteria: `Resolution occurs automatically at market close based on predefined criteria. All data is timestamped and independently verifiable. Market participants cannot influence the outcome through trading activity.`,
      dataSources: `Primary data source: CoinGecko API with real-time updates. Secondary sources: Major exchanges (Binance, Coinbase, Kraken) for verification. All data is aggregated and volume-weighted to prevent manipulation.`,
      edgeCases: `Flash crashes/pumps (>20% in <5 minutes) require 10-minute confirmation. Low liquidity periods (<$100K volume) extend confirmation requirements. Exchange outages do not affect resolution. Market gaps are handled according to standard procedures.`,
      disputeResolution: `Disputes must be submitted within 24 hours of market close. Resolution committee (3+ independent analysts) reviews all data and makes binding decisions. Appeals process available for technical errors only.`,
      marketContext: this.generateMarketContext(context),
      tokenContext: this.generateTokenContext(context),
      historicalContext: this.generateHistoricalContext(context),
      liquidityContext: this.generateLiquidityContext(context),
      confidence: 0.92
    }
  }

  // Generate market context information
  private static generateMarketContext(context: MarketContext): string {
    const { tokenSymbol, timeframe, volatility, priceChange24h } = context
    const marketCondition = priceChange24h > 5 ? 'bullish' : priceChange24h < -5 ? 'bearish' : 'neutral'
    const volatilityLevel = volatility > 0.15 ? 'high' : volatility > 0.08 ? 'medium' : 'low'
    
    return `Current market conditions for ${tokenSymbol} show a ${marketCondition} trend with ${volatilityLevel} volatility. The ${timeframe} timeframe is ${this.getTimeframeContext(timeframe)} for this type of prediction. Market sentiment and broader crypto trends may influence price action during this period.`
  }

  // Generate token-specific context
  private static generateTokenContext(context: MarketContext): string {
    const { tokenSymbol, currentPrice, marketCap, volume } = context
    const marketCapTier = marketCap > 1_000_000_000 ? 'large-cap' : marketCap > 100_000_000 ? 'mid-cap' : 'small-cap'
    const priceTier = currentPrice > 1 ? 'high-value' : currentPrice > 0.01 ? 'mid-value' : 'low-value'
    
    return `${tokenSymbol} is a ${marketCapTier} token with a ${priceTier} price point. Current market cap of $${(marketCap / 1_000_000_000).toFixed(2)}B and 24h volume of $${(volume / 1_000_000).toFixed(1)}M. This token's characteristics may affect price stability and manipulation resistance.`
  }

  // Generate historical context
  private static generateHistoricalContext(context: MarketContext): string {
    const { tokenSymbol, priceChange24h, priceChange7d, volatility } = context
    const recentPerformance = priceChange24h > 0 ? 'positive' : 'negative'
    const weeklyTrend = priceChange7d > 0 ? 'upward' : 'downward'
    
    return `Recent performance shows ${recentPerformance} 24h movement (${priceChange24h.toFixed(2)}%) and a ${weeklyTrend} weekly trend (${priceChange7d?.toFixed(2) || 'N/A'}%). Historical volatility of ${(volatility * 100).toFixed(1)}% indicates ${volatility > 0.15 ? 'high' : 'moderate'} price sensitivity. Past performance patterns may influence future price action.`
  }

  // Generate liquidity context
  private static generateLiquidityContext(context: MarketContext): string {
    const { liquidity, volume, tokenSymbol } = context
    const liquidityImpact = liquidity === 'high' ? 'minimal' : liquidity === 'medium' ? 'moderate' : 'significant'
    
    return `${tokenSymbol} has ${liquidity} liquidity with $${(volume / 1_000_000).toFixed(1)}M daily volume. This ${liquidity} liquidity level means ${liquidityImpact} impact on price from large trades. Market makers and institutional activity may influence price discovery during the market period.`
  }

  // Get timeframe context
  private static getTimeframeContext(timeframe: string): string {
    const contexts = {
      '1H': 'optimal for short-term technical analysis and momentum trading',
      '3H': 'suitable for intraday trends and news-driven movements',
      '6H': 'good for extended trading sessions and market sentiment shifts',
      '12H': 'appropriate for overnight positions and broader market movements',
      '24H': 'ideal for daily market cycles and fundamental analysis'
    }
    return contexts[timeframe] || 'suitable for this type of prediction'
  }
}

// Export the main function for easy use
export async function generateSmartDescriptions(
  question: SmartQuestion,
  tokenData: TokenData
): Promise<SmartDescription[]> {
  return SmartDescriptionEngine.generateDescriptions(question, tokenData)
}
