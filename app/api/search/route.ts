import { NextRequest, NextResponse } from 'next/server'
import { CoinGeckoAPI } from '@/lib/coingecko'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const type = searchParams.get('type') || 'coins'

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] })
    }

    let results = []

    switch (type) {
      case 'coins':
        results = await CoinGeckoAPI.searchCoins(query)
        break
      case 'trending':
        results = await CoinGeckoAPI.getTrendingCoins()
        break
      default:
        results = await CoinGeckoAPI.searchCoins(query)
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Failed to search' },
      { status: 500 }
    )
  }
}
