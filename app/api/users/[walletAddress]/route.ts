import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/users/[walletAddress] - Get specific user by wallet address
export async function GET(
  request: NextRequest,
  { params }: { params: { walletAddress: string } }
) {
  try {
    const walletAddress = params.walletAddress
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single()

    if (error) {
      console.error('Supabase error:', error)
      if (error.code === 'PGRST116') {
        // No rows returned - user not found
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    // Transform data to API format
    const user = {
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
    
    return NextResponse.json(user, { status: 200 })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/users/[walletAddress] - Update user profile
export async function PUT(
  request: NextRequest,
  { params }: { params: { walletAddress: string } }
) {
  try {
    const walletAddress = params.walletAddress
    const body = await request.json()
    
    // Only allow updating certain fields
    const allowedFields = [
      'username', 'email', 'bio', 'avatarUrl', 'twitterHandle', 'websiteUrl'
    ]
    
    const updateData: any = {}
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        // Convert camelCase to snake_case for database
        const dbField = field.replace(/([A-Z])/g, '_$1').toLowerCase()
        updateData[dbField] = body[field]
      }
    })

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('wallet_address', walletAddress)
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    // Transform data to API format
    const user = {
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
    
    return NextResponse.json(user, { status: 200 })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
