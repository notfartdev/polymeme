import { NextRequest, NextResponse } from 'next/server'
import { MarketScheduler } from '@/lib/market-scheduler'

export async function POST(request: NextRequest) {
  try {
    // Check for authorization (in production, you'd want proper auth)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🔄 Starting manual market resolution process...')
    
    // Process all pending resolutions
    await MarketScheduler.processAllPendingResolutions()
    
    // Get updated stats
    const stats = await MarketScheduler.getResolutionStats()
    
    return NextResponse.json({
      success: true,
      message: 'Market resolution process completed',
      stats
    })

  } catch (error) {
    console.error('Error in manual market resolution:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get resolution statistics
    const stats = await MarketScheduler.getResolutionStats()
    const pendingResolutions = await MarketScheduler.checkPendingResolutions()
    
    return NextResponse.json({
      stats,
      pendingResolutions: pendingResolutions.map(r => ({
        marketId: r.marketId,
        question: r.question,
        closingDate: r.closingDate,
        status: r.status
      }))
    })

  } catch (error) {
    console.error('Error getting resolution status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
