import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { resolveMarket } from '@/lib/market-resolution'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const marketId = params.id

    // Get market data from database
    const { data: market, error: marketError } = await supabase
      .from('markets')
      .select('*')
      .eq('id', marketId)
      .single()

    if (marketError || !market) {
      return NextResponse.json(
        { error: 'Market not found' },
        { status: 404 }
      )
    }

    // Check if market is already resolved
    if (market.status === 'closed') {
      return NextResponse.json(
        { error: 'Market already resolved' },
        { status: 400 }
      )
    }

    // Check if market closing date has passed
    const closingDate = new Date(market.closing_date)
    const now = new Date()
    
    if (now < closingDate) {
      return NextResponse.json(
        { error: 'Market has not reached closing date yet' },
        { status: 400 }
      )
    }

    // Resolve the market
    const resolutionData = await resolveMarket(
      marketId,
      market.question,
      market.question_type_detailed || 'price',
      market.resolution_criteria || '',
      closingDate
    )

    // Update market in database with resolution
    const { error: updateError } = await supabase
      .from('markets')
      .update({
        status: 'closed',
        resolution: resolutionData.resolution,
        resolution_data: resolutionData.resolutionData,
        resolved_at: new Date().toISOString(),
        dispute_reason: resolutionData.disputeReason
      })
      .eq('id', marketId)

    if (updateError) {
      console.error('Error updating market:', updateError)
      return NextResponse.json(
        { error: 'Failed to update market resolution' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      resolution: resolutionData,
      message: 'Market resolved successfully'
    })

  } catch (error) {
    console.error('Error resolving market:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const marketId = params.id

    // Get market data from database
    const { data: market, error: marketError } = await supabase
      .from('markets')
      .select('*')
      .eq('id', marketId)
      .single()

    if (marketError || !market) {
      return NextResponse.json(
        { error: 'Market not found' },
        { status: 404 }
      )
    }

    // Return current resolution status
    return NextResponse.json({
      marketId,
      status: market.status,
      resolution: market.resolution,
      resolutionData: market.resolution_data,
      resolvedAt: market.resolved_at,
      disputeReason: market.dispute_reason
    })

  } catch (error) {
    console.error('Error getting market resolution:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
