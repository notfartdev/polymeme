import { NextRequest, NextResponse } from 'next/server'
import { MarketScheduler } from '@/lib/market-scheduler'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Manual market resolution triggered')
    
    // Process all pending market resolutions
    await MarketScheduler.processAllPendingResolutions()
    
    // Get updated stats
    const stats = await MarketScheduler.getResolutionStats()
    
    return NextResponse.json({
      success: true,
      message: 'Market resolution process completed',
      stats
    })
    
  } catch (error) {
    console.error('Error in market resolution:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process market resolutions' },
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
      success: true,
      stats,
      pendingResolutions
    })
    
  } catch (error) {
    console.error('Error getting resolution stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get resolution stats' },
      { status: 500 }
    )
  }
}
