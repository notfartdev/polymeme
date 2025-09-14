import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { marketId, betSide, amount, tokenMint, tokenAmount, walletAddress } = body

    // Validate required fields
    if (!marketId || !betSide || !amount || !tokenMint || !tokenAmount || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate bet side
    if (!['yes', 'no'].includes(betSide)) {
      return NextResponse.json(
        { error: 'Invalid bet side. Must be "yes" or "no"' },
        { status: 400 }
      )
    }

    // Validate amount
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Bet amount must be greater than 0' },
        { status: 400 }
      )
    }

    // Get user by wallet address
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found. Please ensure your wallet is connected.' },
        { status: 404 }
      )
    }

    // Verify market exists
    const { data: market, error: marketError } = await supabase
      .from('markets')
      .select('id, status, token_mint')
      .eq('id', marketId)
      .single()

    if (marketError || !market) {
      return NextResponse.json(
        { error: 'Market not found' },
        { status: 404 }
      )
    }

    // Check if market is still active
    if (market.status !== 'active') {
      return NextResponse.json(
        { error: 'This market is no longer accepting bets' },
        { status: 400 }
      )
    }

    // Verify token matches market requirement
    if (market.token_mint && market.token_mint !== tokenMint) {
      return NextResponse.json(
        { error: 'Invalid token for this market' },
        { status: 400 }
      )
    }

    // Create the bet
    const { data: bet, error: betError } = await supabase
      .from('bets')
      .insert({
        user_id: user.id,
        market_id: marketId,
        bet_side: betSide,
        amount: amount,
        token_mint: tokenMint,
        token_amount: tokenAmount,
        status: 'active'
      })
      .select()
      .single()

    if (betError) {
      console.error('Error creating bet:', betError)
      return NextResponse.json(
        { error: 'Failed to place bet' },
        { status: 500 }
      )
    }

    // Update market betting stats
    const updateField = betSide === 'yes' ? 'total_yes_bets' : 'total_no_bets'
    const { error: marketUpdateError } = await supabase
      .from('markets')
      .update({
        [updateField]: supabase.raw(`${updateField} + 1`),
        total_volume: supabase.raw(`total_volume + ${amount}`)
      })
      .eq('id', marketId)

    if (marketUpdateError) {
      console.error('Error updating market stats:', marketUpdateError)
      // Don't fail the bet creation for this
    }

    return NextResponse.json({
      success: true,
      bet: {
        id: bet.id,
        marketId: bet.market_id,
        betSide: bet.bet_side,
        amount: bet.amount,
        tokenMint: bet.token_mint,
        tokenAmount: bet.token_amount,
        status: bet.status,
        createdAt: bet.created_at
      }
    })

  } catch (error) {
    console.error('Error in /api/bets POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const marketId = searchParams.get('marketId')
    const walletAddress = searchParams.get('walletAddress')

    let query = supabase
      .from('bets')
      .select(`
        id,
        bet_side,
        amount,
        token_mint,
        token_amount,
        outcome,
        pnl,
        status,
        created_at,
        settled_at,
        markets (
          id,
          question,
          status
        )
      `)

    if (marketId) {
      query = query.eq('market_id', marketId)
    }

    if (walletAddress) {
      // Get user by wallet address first
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', walletAddress)
        .single()

      if (user) {
        query = query.eq('user_id', user.id)
      } else {
        return NextResponse.json({ bets: [] })
      }
    }

    const { data: bets, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching bets:', error)
      return NextResponse.json(
        { error: 'Failed to fetch bets' },
        { status: 500 }
      )
    }

    return NextResponse.json({ bets: bets || [] })

  } catch (error) {
    console.error('Error in /api/bets GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
