import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { walletAddress: string } }
) {
  try {
    const { walletAddress } = params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
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
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get trading activity using the function we created
    const { data: tradingActivity, error: activityError } = await supabase
      .rpc('get_user_trading_activity', { 
        p_user_id: user.id,
        p_limit: limit
      })

    if (activityError) {
      console.error('Error fetching trading activity:', activityError)
      return NextResponse.json(
        { error: 'Failed to fetch trading activity' },
        { status: 500 }
      )
    }

    // Transform the data to match our frontend interface
    const formattedActivity = (tradingActivity || []).map((activity: any) => ({
      id: activity.bet_id,
      marketId: activity.market_id,
      marketTitle: activity.market_title,
      marketDescription: activity.market_description,
      betSide: activity.bet_side,
      amount: parseFloat(activity.amount.toString()),
      tokenMint: activity.token_mint,
      tokenAmount: parseFloat(activity.token_amount.toString()),
      outcome: activity.outcome,
      pnl: parseFloat(activity.pnl.toString()),
      status: activity.status,
      createdAt: activity.created_at,
      settledAt: activity.settled_at,
      
      // Additional computed fields
      isWinning: activity.outcome === 'won',
      isLosing: activity.outcome === 'lost',
      isPending: activity.outcome === 'pending',
      isActive: activity.status === 'active',
      isSettled: activity.status === 'settled',
      
      // Format dates
      createdDate: new Date(activity.created_at).toISOString().split('T')[0],
      settledDate: activity.settled_at ? new Date(activity.settled_at).toISOString().split('T')[0] : null
    }))

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from('bets')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (countError) {
      console.error('Error fetching total count:', countError)
    }

    return NextResponse.json({
      activity: formattedActivity,
      pagination: {
        total: totalCount || 0,
        limit,
        offset,
        hasMore: (totalCount || 0) > offset + limit
      },
      summary: {
        totalBets: totalCount || 0,
        activeBets: formattedActivity.filter(a => a.isActive).length,
        settledBets: formattedActivity.filter(a => a.isSettled).length,
        totalPnL: formattedActivity.reduce((sum, a) => sum + a.pnl, 0),
        winningBets: formattedActivity.filter(a => a.isWinning).length,
        losingBets: formattedActivity.filter(a => a.isLosing).length
      }
    })
  } catch (error) {
    console.error('Error in /api/users/[walletAddress]/activity:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
