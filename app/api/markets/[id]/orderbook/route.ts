import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const marketId = params.id
    
    // Fetch recent bets for this market from the database
    const { data: bets, error: betsError } = await supabase
      .from('bets')
      .select(`
        id,
        bet_side,
        amount,
        token_mint,
        token_amount,
        created_at,
        outcome,
        pnl,
        status,
        user_id,
        users!inner(wallet_address)
      `)
      .eq('market_id', marketId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(20) // Get last 20 bets

    if (betsError) {
      console.error('Error fetching bets:', betsError)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    // Fetch market pool data
    const { data: market, error: marketError } = await supabase
      .from('markets')
      .select('total_yes_bets, total_no_bets, total_volume, asset, token_symbol, token_name, token_mint')
      .eq('id', marketId)
      .single()

    if (marketError) {
      console.error('Error fetching market:', marketError)
      return NextResponse.json(
        { error: 'Market not found' },
        { status: 404 }
      )
    }

    // Separate bets by side
    const yesBets = bets.filter(bet => bet.bet_side === 'yes')
    const noBets = bets.filter(bet => bet.bet_side === 'no')

    // Get the most recent bet as "last trade"
    const lastTrade = bets.length > 0 ? {
      price: bets[0].bet_side === 'yes' ? 
        (market.total_yes_bets / (market.total_yes_bets + market.total_no_bets) || 0.5) :
        (market.total_no_bets / (market.total_yes_bets + market.total_no_bets) || 0.5),
      size: bets[0].amount,
      side: bets[0].bet_side,
      timestamp: bets[0].created_at,
      walletAddress: bets[0].users.wallet_address,
      transactionHash: `tx_${bets[0].id.slice(0, 8)}` // Mock transaction hash
    } : null

    // Format order book entries
    const formatOrderBookEntry = (bet: any, side: 'yes' | 'no') => {
      const price = side === 'yes' ? 
        (market.total_yes_bets / (market.total_yes_bets + market.total_no_bets) || 0.5) :
        (market.total_no_bets / (market.total_yes_bets + market.total_no_bets) || 0.5)
      
      return {
        price,
        size: bet.amount,
        total: bet.amount,
        side,
        timestamp: bet.created_at,
        walletAddress: bet.users.wallet_address,
        transactionHash: `tx_${bet.id.slice(0, 8)}`
      }
    }

    const orderBookData = {
      yesOrders: yesBets.slice(0, 8).map(bet => formatOrderBookEntry(bet, 'yes')),
      noOrders: noBets.slice(0, 8).map(bet => formatOrderBookEntry(bet, 'no')),
      lastTrade,
      poolData: {
        yesPool: { 
          totalTokens: market.total_yes_bets || 0, 
          totalBets: yesBets.length 
        },
        noPool: { 
          totalTokens: market.total_no_bets || 0, 
          totalBets: noBets.length 
        }
      },
      volume24h: market.total_volume || 0,
      tokenSymbol: market.token_symbol || market.asset || 'SOL',
      tokenName: market.token_name || market.asset || 'Solana',
      tokenMint: market.token_mint
    }

    return NextResponse.json(orderBookData, { status: 200 })

  } catch (error) {
    console.error('Error fetching order book:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
