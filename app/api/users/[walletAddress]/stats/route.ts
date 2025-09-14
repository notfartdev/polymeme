import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { walletAddress: string } }
) {
  try {
    const { walletAddress } = params

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    // Get user by wallet address
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, wallet_address, total_markets_created, total_bets_placed, total_volume_traded, total_pnl, win_rate')
      .eq('wallet_address', walletAddress)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get betting stats using the function we created
    const { data: bettingStats, error: statsError } = await supabase
      .rpc('get_user_betting_stats', { p_user_id: user.id })

    if (statsError) {
      console.error('Error fetching betting stats:', statsError)
      return NextResponse.json(
        { error: 'Failed to fetch betting stats' },
        { status: 500 }
      )
    }

    const stats = bettingStats?.[0] || {
      total_bets: 0,
      total_volume: 0,
      total_pnl: 0,
      win_rate: 0,
      active_positions: 0,
      best_trade: 0,
      worst_trade: 0,
      avg_trade: 0
    }

    // Return comprehensive user stats
    const userStats = {
      // User info
      userId: user.id,
      walletAddress: user.wallet_address,
      
      // Market creation stats
      totalMarketsCreated: user.total_markets_created || 0,
      
      // Betting stats
      totalBets: stats.total_bets,
      totalVolume: parseFloat(stats.total_volume.toString()),
      totalPnL: parseFloat(stats.total_pnl.toString()),
      winRate: parseFloat(stats.win_rate.toString()),
      activePositions: stats.active_positions,
      
      // Performance metrics
      bestTrade: parseFloat(stats.best_trade.toString()),
      worstTrade: parseFloat(stats.worst_trade.toString()),
      avgTrade: parseFloat(stats.avg_trade.toString()),
      
      // Calculated fields
      totalTrades: stats.total_bets,
      isActiveTrader: stats.total_bets > 0,
      hasWinningRecord: stats.total_pnl > 0
    }

    return NextResponse.json(userStats)
  } catch (error) {
    console.error('Error in /api/users/[walletAddress]/stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
