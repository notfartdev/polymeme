import { NextRequest, NextResponse } from 'next/server'
import { smartContractService } from '@/lib/smart-contract-real'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const tokenSymbol = searchParams.get('token') || 'SOL'

    // Fetch pool data from smart contract
    const poolData = await smartContractService.fetchPoolData(
      parseInt(params.id),
      tokenSymbol
    )

    return NextResponse.json({
      success: true,
      marketId: params.id,
      tokenSymbol: poolData.tokenSymbol,
      yesPool: poolData.yesPool,
      noPool: poolData.noPool,
      lastUpdated: poolData.lastUpdated,
      // Calculate current odds
      odds: {
        yes: poolData.yesPool.totalTokens / (poolData.yesPool.totalTokens + poolData.noPool.totalTokens) || 0.5,
        no: poolData.noPool.totalTokens / (poolData.yesPool.totalTokens + poolData.noPool.totalTokens) || 0.5
      }
    })

  } catch (error) {
    console.error('Error fetching pool data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}