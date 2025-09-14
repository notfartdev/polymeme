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

    // Get detailed betting stats
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

    // Get additional performance metrics
    const { data: monthlyStats, error: monthlyError } = await supabase
      .from('bets')
      .select('pnl, created_at, outcome')
      .eq('user_id', user.id)
      .eq('status', 'settled')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days

    if (monthlyError) {
      console.error('Error fetching monthly stats:', monthlyError)
    }

    // Calculate monthly performance
    const monthlyPnL = monthlyStats?.reduce((sum, bet) => sum + parseFloat(bet.pnl.toString()), 0) || 0
    const monthlyTrades = monthlyStats?.length || 0
    const monthlyWinRate = monthlyStats?.length > 0 
      ? (monthlyStats.filter(bet => bet.outcome === 'won').length / monthlyStats.length) * 100 
      : 0

    // Get recent performance (last 7 days)
    const { data: weeklyStats, error: weeklyError } = await supabase
      .from('bets')
      .select('pnl, created_at, outcome')
      .eq('user_id', user.id)
      .eq('status', 'settled')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days

    if (weeklyError) {
      console.error('Error fetching weekly stats:', weeklyError)
    }

    const weeklyPnL = weeklyStats?.reduce((sum, bet) => sum + parseFloat(bet.pnl.toString()), 0) || 0
    const weeklyTrades = weeklyStats?.length || 0

    // Calculate performance trends
    const performanceData = {
      // Overall stats
      totalVolume: parseFloat(stats.total_volume.toString()),
      totalPnL: parseFloat(stats.total_pnl.toString()),
      winRate: parseFloat(stats.win_rate.toString()),
      totalTrades: stats.total_bets,
      activePositions: stats.active_positions,
      
      // Trade performance
      bestTrade: parseFloat(stats.best_trade.toString()),
      worstTrade: parseFloat(stats.worst_trade.toString()),
      avgTrade: parseFloat(stats.avg_trade.toString()),
      
      // Time-based performance
      monthlyPnL,
      monthlyTrades,
      monthlyWinRate,
      weeklyPnL,
      weeklyTrades,
      
      // Calculated metrics
      profitMargin: stats.total_volume > 0 ? (parseFloat(stats.total_pnl.toString()) / parseFloat(stats.total_volume.toString())) * 100 : 0,
      riskRewardRatio: stats.worst_trade !== 0 ? Math.abs(parseFloat(stats.best_trade.toString()) / parseFloat(stats.worst_trade.toString())) : 0,
      
      // Performance indicators
      isProfitable: parseFloat(stats.total_pnl.toString()) > 0,
      isConsistent: parseFloat(stats.win_rate.toString()) > 50,
      isActive: stats.total_bets > 0,
      
      // Market creation stats
      totalMarketsCreated: user.total_markets_created || 0,
      
      // Summary
      performanceGrade: calculatePerformanceGrade(parseFloat(stats.win_rate.toString()), parseFloat(stats.total_pnl.toString())),
      riskLevel: calculateRiskLevel(parseFloat(stats.win_rate.toString()), stats.total_bets)
    }

    return NextResponse.json(performanceData)
  } catch (error) {
    console.error('Error in /api/users/[walletAddress]/performance:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to calculate performance grade
function calculatePerformanceGrade(winRate: number, totalPnL: number): string {
  if (winRate >= 70 && totalPnL > 0) return 'A+'
  if (winRate >= 60 && totalPnL > 0) return 'A'
  if (winRate >= 50 && totalPnL > 0) return 'B+'
  if (winRate >= 50) return 'B'
  if (winRate >= 40) return 'C'
  return 'D'
}

// Helper function to calculate risk level
function calculateRiskLevel(winRate: number, totalTrades: number): string {
  if (totalTrades === 0) return 'Unknown'
  if (winRate >= 60) return 'Low'
  if (winRate >= 40) return 'Medium'
  return 'High'
}
