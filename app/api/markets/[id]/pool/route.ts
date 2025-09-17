import { NextRequest, NextResponse } from 'next/server'
import { smartContractService } from '@/lib/smart-contract'

interface PoolData {
  marketId: string
  tokenSymbol: string
  yesPool: {
    totalTokens: number
    totalBets: number
    bets: Array<{
      walletAddress: string
      amount: number
      timestamp: string
      transactionHash: string
    }>
  }
  noPool: {
    totalTokens: number
    totalBets: number
    bets: Array<{
      walletAddress: string
      amount: number
      timestamp: string
      transactionHash: string
    }>
  }
  lastUpdated: string
}

// Mock pool data generator - in real implementation, this would fetch from smart contract
// TODO: Replace with actual smart contract calls
const generateMockPoolData = (marketId: string, tokenSymbol: string = 'SOL'): PoolData => {
  const baseYesPool = 150 + Math.random() * 100
  const baseNoPool = 200 + Math.random() * 150
  
  // Generate YES bets
  const yesBets = []
  let yesTotal = 0
  for (let i = 0; i < 15; i++) {
    const amount = Math.random() * 20 + 1
    yesTotal += amount
    yesBets.push({
      walletAddress: `${Math.random().toString(36).substr(2, 8)}${Math.random().toString(36).substr(2, 8)}${Math.random().toString(36).substr(2, 8)}${Math.random().toString(36).substr(2, 8)}`,
      amount,
      timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      transactionHash: `${Math.random().toString(36).substr(2, 8)}...${Math.random().toString(36).substr(2, 8)}`
    })
  }

  // Generate NO bets
  const noBets = []
  let noTotal = 0
  for (let i = 0; i < 12; i++) {
    const amount = Math.random() * 25 + 2
    noTotal += amount
    noBets.push({
      walletAddress: `${Math.random().toString(36).substr(2, 8)}${Math.random().toString(36).substr(2, 8)}${Math.random().toString(36).substr(2, 8)}${Math.random().toString(36).substr(2, 8)}`,
      amount,
      timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      transactionHash: `${Math.random().toString(36).substr(2, 8)}...${Math.random().toString(36).substr(2, 8)}`
    })
  }

  return {
    marketId,
    tokenSymbol,
    yesPool: {
      totalTokens: baseYesPool,
      totalBets: yesBets.length,
      bets: yesBets
    },
    noPool: {
      totalTokens: baseNoPool,
      totalBets: noBets.length,
      bets: noBets
    },
    lastUpdated: new Date().toISOString()
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const marketId = params.id
    
    if (!marketId) {
      return NextResponse.json(
        { error: 'Market ID is required' },
        { status: 400 }
      )
    }

    // First, fetch market data to get the token symbol
    const marketResponse = await fetch(`${request.nextUrl.origin}/api/markets/${marketId}`)
    let tokenSymbol = 'SOL' // Default fallback
    
    if (marketResponse.ok) {
      const marketData = await marketResponse.json()
      tokenSymbol = marketData.tokenSymbol || marketData.asset || 'SOL'
    }

    // Fetch from smart contract service with token symbol
    const poolData = await smartContractService.fetchPoolData(marketId, tokenSymbol)

    return NextResponse.json(poolData)
  } catch (error) {
    console.error('Error fetching pool data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pool data' },
      { status: 500 }
    )
  }
}
