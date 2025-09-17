import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const marketId = params.id
    
    // Fetch specific market from Supabase
    const { data, error } = await supabase
      .from('markets')
      .select('*')
      .eq('id', marketId)
      .single()

    if (error) {
      console.error('Supabase error:', error)
      if (error.code === 'PGRST116') {
        // No rows returned - market not found
        return NextResponse.json(
          { error: 'Market not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    // Transform data to API format
    const market = {
      id: data.id,
      asset: data.asset,
      questionType: data.question_type,
      question: data.question,
      description: data.description,
      closingDate: data.closing_date,
      createdAt: data.created_at,
      status: data.status,
      creator: data.creator,
      tokenMint: data.token_mint,
      tokenSymbol: data.token_symbol,
      tokenName: data.token_name,
      tokenLogo: data.token_logo,
      multipleChoiceOptions: data.multiple_choice_options,
      minValue: data.min_value,
      maxValue: data.max_value,
      unit: data.unit,
      earliestDate: data.earliest_date,
      latestDate: data.latest_date,
      initialBetAmount: data.initial_bet_amount,
      betSide: data.bet_side,
      totalYesBets: data.total_yes_bets,
      totalNoBets: data.total_no_bets,
      totalVolume: data.total_volume
    }
    
    return NextResponse.json(market, { status: 200 })
  } catch (error) {
    console.error('Error fetching market:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
