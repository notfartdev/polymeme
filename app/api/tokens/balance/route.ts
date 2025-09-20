import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('wallet')
    const tokenMint = searchParams.get('tokenMint')

    if (!walletAddress || !tokenMint) {
      return NextResponse.json(
        { error: 'Missing wallet address or token mint' },
        { status: 400 }
      )
    }

    // For now, use mock balances for development
    // In production, this would connect to Solana RPC and check real balances
    const mockBalances: Record<string, Record<string, number>> = {
      '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkv': {
        'So11111111111111111111111111111111111111112': 10.5, // SOL
        'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm': 1000, // WIF
        'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 500, // BONK
      },
      '9yMNvg3DX98f45TXJSDpbD5jBkheTqA83TZRuJosgHkv': {
        'So11111111111111111111111111111111111111112': 5.2, // SOL
        'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm': 750, // WIF
        'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 300, // BONK
      },
      '5zLKtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkv': {
        'So11111111111111111111111111111111111111112': 15.8, // SOL
        'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm': 1200, // WIF
        'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 800, // BONK
      }
    }

    const balance = mockBalances[walletAddress]?.[tokenMint] || 0
    const hasAccount = balance > 0

    return NextResponse.json({
      success: true,
      walletAddress,
      tokenMint,
      balance,
      hasAccount,
      sufficientForMarket: balance >= 1, // Minimum 1 token required
      message: balance >= 1 ? 
        `You have ${balance} tokens. Sufficient for market creation.` :
        `You have ${balance} tokens. You need at least 1 token to create a market.`
    })

  } catch (error) {
    console.error('Error checking token balance:', error)
    return NextResponse.json(
      { error: 'Failed to check token balance' },
      { status: 500 }
    )
  }
}