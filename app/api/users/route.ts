import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Types for user operations
export interface CreateUserRequest {
  walletAddress: string
  walletName?: string
  username?: string
  email?: string
}

export interface UserResponse {
  id: string
  walletAddress: string
  walletName?: string
  username?: string
  email?: string
  createdAt: string
  lastLogin: string
  isActive: boolean
  totalMarketsCreated: number
  totalBetsPlaced: number
  totalVolumeTraded: number
  winRate: number
  totalPnl: number
  bio?: string
  avatarUrl?: string
  twitterHandle?: string
  websiteUrl?: string
}

// GET /api/users - Get all users (for leaderboards, etc.)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const sortBy = searchParams.get('sortBy') || 'total_volume_traded'
    const order = searchParams.get('order') || 'desc'

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_active', true)
      .order(sortBy, { ascending: order === 'asc' })
      .limit(limit)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    // Transform data to API format
    const users: UserResponse[] = data.map(user => ({
      id: user.id,
      walletAddress: user.wallet_address,
      walletName: user.wallet_name,
      username: user.username,
      email: user.email,
      createdAt: user.created_at,
      lastLogin: user.last_login,
      isActive: user.is_active,
      totalMarketsCreated: user.total_markets_created,
      totalBetsPlaced: user.total_bets_placed,
      totalVolumeTraded: user.total_volume_traded,
      winRate: user.win_rate,
      totalPnl: user.total_pnl,
      bio: user.bio,
      avatarUrl: user.avatar_url,
      twitterHandle: user.twitter_handle,
      websiteUrl: user.website_url
    }))

    return NextResponse.json(users, { status: 200 })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/users - Create or update user
export async function POST(request: NextRequest) {
  try {
    const body: CreateUserRequest = await request.json()
    
    // Validate required fields
    if (!body.walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    // Use the get_or_create_user function
    const { data, error } = await supabase
      .rpc('get_or_create_user', {
        p_wallet_address: body.walletAddress,
        p_wallet_name: body.walletName || null
      })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    // Transform data to API format
    const user: UserResponse = {
      id: data.id,
      walletAddress: data.wallet_address,
      walletName: data.wallet_name,
      username: data.username,
      email: data.email,
      createdAt: data.created_at,
      lastLogin: data.last_login,
      isActive: data.is_active,
      totalMarketsCreated: data.total_markets_created,
      totalBetsPlaced: data.total_bets_placed,
      totalVolumeTraded: data.total_volume_traded,
      winRate: data.win_rate,
      totalPnl: data.total_pnl,
      bio: data.bio,
      avatarUrl: data.avatar_url,
      twitterHandle: data.twitter_handle,
      websiteUrl: data.website_url
    }

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Error creating/updating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
