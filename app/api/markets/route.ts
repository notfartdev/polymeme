import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Types for market creation
export interface CreateMarketRequest {
  asset: string
  questionType: 'yes-no' | 'multiple-choice' | 'numeric' | 'date'
  question: string
  description: string
  closingDate: string
  tokenMint?: string // SPL token mint address for smart contract
  tokenSymbol?: string // Token symbol (e.g., SOL, WIF, BONK)
  tokenName?: string // Token name (e.g., Solana, dogwifhat, Bonk)
  tokenLogo?: string // Token logo URL
  creatorWalletAddress?: string // Wallet address of the creator
  multipleChoiceOptions?: string[]
  minValue?: string
  maxValue?: string
  unit?: string
  earliestDate?: string
  latestDate?: string
  initialBetAmount?: string
  betSide?: 'yes' | 'no'
  initialBet?: {
    amount: string
    side: 'yes' | 'no'
    token: string
  }
  // Comprehensive market rules
  resolutionCriteria?: string
  dataSources?: string
  edgeCases?: string
  disputeResolution?: string
  marketContext?: string
  tokenContext?: string
  historicalContext?: string
  liquidityContext?: string
  confidenceScore?: number
  questionTypeDetailed?: string
}

export interface MarketResponse {
  id: string
  asset: string
  questionType: string
  question: string
  description: string
  closingDate: string
  createdAt: string
  status: 'active' | 'pending' | 'closed'
  creator: string
  tokenMint?: string // SPL token mint address
  // Type-specific fields
  multipleChoiceOptions?: string[]
  minValue?: string
  maxValue?: string
  unit?: string
  earliestDate?: string
  latestDate?: string
  // Betting fields
  initialBetAmount?: string
  betSide?: 'yes' | 'no'
  totalYesBets?: number
  totalNoBets?: number
  totalVolume?: number
  resolution?: 'yes' | 'no' | 'disputed'
  // Comprehensive market rules
  resolutionCriteria?: string
  dataSources?: string
  edgeCases?: string
  disputeResolution?: string
  marketContext?: string
  tokenContext?: string
  historicalContext?: string
  liquidityContext?: string
  confidenceScore?: number
  questionTypeDetailed?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateMarketRequest = await request.json()
    
    // Validate required fields
    if (!body.asset || !body.questionType || !body.question || !body.description || !body.closingDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate question type specific fields
    if (body.questionType === 'multiple-choice' && (!body.multipleChoiceOptions || body.multipleChoiceOptions.length < 2)) {
      return NextResponse.json(
        { error: 'Multiple choice questions require at least 2 options' },
        { status: 400 }
      )
    }

    if (body.questionType === 'numeric' && (!body.minValue || !body.maxValue)) {
      return NextResponse.json(
        { error: 'Numeric questions require min and max values' },
        { status: 400 }
      )
    }

    if (body.questionType === 'date' && (!body.earliestDate || !body.latestDate)) {
      return NextResponse.json(
        { error: 'Date questions require earliest and latest dates' },
        { status: 400 }
      )
    }

    // Require initial bet for market creation
    if (!body.initialBetAmount || parseFloat(body.initialBetAmount) <= 0) {
      return NextResponse.json(
        { error: 'Initial bet amount is required to create a market' },
        { status: 400 }
      )
    }

    if (!body.betSide || (body.betSide !== 'yes' && body.betSide !== 'no')) {
      return NextResponse.json(
        { error: 'Initial bet side (yes or no) is required to create a market' },
        { status: 400 }
      )
    }

    // Check token balance if wallet address and token mint are provided
    if (body.creatorWalletAddress && body.tokenMint) {
      try {
        const balanceResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/tokens/balance?wallet=${body.creatorWalletAddress}&tokenMint=${body.tokenMint}`)
        const balanceData = await balanceResponse.json()
        
        if (!balanceData.success) {
          return NextResponse.json(
            { error: `Failed to check token balance: ${balanceData.error}` },
            { status: 400 }
          )
        }

        // Require minimum 1 token to create market
        if (balanceData.balance < 1) {
          return NextResponse.json(
            { error: `Insufficient ${body.tokenSymbol || 'token'} balance. You have ${balanceData.balance} tokens but need at least 1 token to create a market.` },
            { status: 400 }
          )
        }

        // Check initial bet amount if provided
        if (body.initialBetAmount && parseFloat(body.initialBetAmount) > balanceData.balance) {
          return NextResponse.json(
            { error: `Insufficient balance for initial bet. You have ${balanceData.balance} ${body.tokenSymbol || 'tokens'} but trying to bet ${body.initialBetAmount}` },
            { status: 400 }
          )
        }

      } catch (error) {
        console.error('Error checking token balance:', error)
        return NextResponse.json(
          { error: 'Failed to verify token balance' },
          { status: 500 }
        )
      }
    }

    // Get or create user if wallet address is provided
    let creatorUserId = null
    if (body.creatorWalletAddress) {
      const { data: userData, error: userError } = await supabase
        .rpc('get_or_create_user', {
          p_wallet_address: body.creatorWalletAddress,
          p_wallet_name: null
        })
      
      if (userError) {
        console.error('Error creating user:', userError)
        return NextResponse.json(
          { error: 'Failed to create user' },
          { status: 500 }
        )
      }
      creatorUserId = userData.id
    }

    // Create new market data for Supabase
    const marketData = {
      asset: body.asset,
      question_type: body.questionType,
      question: body.question,
      description: body.description,
      closing_date: body.closingDate,
      status: 'active',
      creator: body.creatorWalletAddress || 'demo_user',
      creator_wallet_address: body.creatorWalletAddress,
      creator_user_id: creatorUserId,
      token_mint: body.tokenMint,
      token_symbol: body.tokenSymbol,
      token_name: body.tokenName,
      token_logo: body.tokenLogo,
      // Type-specific fields
      multiple_choice_options: body.multipleChoiceOptions,
      min_value: body.minValue,
      max_value: body.maxValue,
      unit: body.unit,
      earliest_date: body.earliestDate,
      latest_date: body.latestDate,
      // Betting fields
      initial_bet_amount: body.initialBetAmount || body.initialBet?.amount,
      bet_side: body.betSide || body.initialBet?.side,
      total_yes_bets: 0,
      total_no_bets: 0,
      total_volume: 0,
      // Comprehensive market rules
      resolution_criteria: body.resolutionCriteria,
      data_sources: body.dataSources,
      edge_cases: body.edgeCases,
      dispute_resolution: body.disputeResolution,
      market_context: body.marketContext,
      token_context: body.tokenContext,
      historical_context: body.historicalContext,
      liquidity_context: body.liquidityContext,
      confidence_score: body.confidenceScore,
      question_type_detailed: body.questionTypeDetailed
    }

    // Insert into Supabase
    const { data, error } = await supabase
      .from('markets')
      .insert([marketData])
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    // Transform data back to API format
    const newMarket: MarketResponse = {
      id: data.id,
      asset: data.asset,
      questionType: data.question_type,
      question: data.question,
      description: data.description,
      closingDate: data.closing_date,
      createdAt: data.created_at,
      status: data.status,
      creator: data.creator,
      tokenMint: data.token_mint,
      multipleChoiceOptions: data.multiple_choice_options,
      minValue: data.min_value,
      maxValue: data.max_value,
      unit: data.unit,
      earliestDate: data.earliest_date,
      latestDate: data.latest_date,
      initialBetAmount: data.initial_bet_amount,
      betSide: data.bet_side,
      totalYesBets: data.total_yes_bets,
      totalNoBets: data.total_no_bets,
      totalVolume: data.total_volume,
      // Comprehensive market rules
      resolutionCriteria: data.resolution_criteria,
      dataSources: data.data_sources,
      edgeCases: data.edge_cases,
      disputeResolution: data.dispute_resolution,
      marketContext: data.market_context,
      tokenContext: data.token_context,
      historicalContext: data.historical_context,
      liquidityContext: data.liquidity_context,
      confidenceScore: data.confidence_score,
      questionTypeDetailed: data.question_type_detailed
    }

    return NextResponse.json(newMarket, { status: 201 })
  } catch (error) {
    console.error('Error creating market:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Fetch markets from Supabase
    const { data, error } = await supabase
      .from('markets')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    // Transform data to API format
    const markets: MarketResponse[] = data.map(market => ({
      id: market.id,
      asset: market.asset,
      questionType: market.question_type,
      question: market.question,
      description: market.description,
      closingDate: market.closing_date,
      createdAt: market.created_at,
      status: market.status,
      creator: market.creator,
      tokenMint: market.token_mint,
      multipleChoiceOptions: market.multiple_choice_options,
      minValue: market.min_value,
      maxValue: market.max_value,
      unit: market.unit,
      earliestDate: market.earliest_date,
      latestDate: market.latest_date,
      initialBetAmount: market.initial_bet_amount,
      betSide: market.bet_side,
      totalYesBets: market.total_yes_bets,
      totalNoBets: market.total_no_bets,
      totalVolume: market.total_volume,
      resolution: market.resolution,
      // Comprehensive market rules
      resolutionCriteria: market.resolution_criteria,
      dataSources: market.data_sources,
      edgeCases: market.edge_cases,
      disputeResolution: market.dispute_resolution,
      marketContext: market.market_context,
      tokenContext: market.token_context,
      historicalContext: market.historical_context,
      liquidityContext: market.liquidity_context,
      confidenceScore: market.confidence_score,
      questionTypeDetailed: market.question_type_detailed
    }))

    return NextResponse.json(markets, { status: 200 })
  } catch (error) {
    console.error('Error fetching markets:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
