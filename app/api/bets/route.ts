import { NextRequest, NextResponse } from 'next/server'
import { smartContractService } from '@/lib/smart-contract'

// Mock token balance checker - in real implementation, this would query Solana
async function checkTokenBalance(walletAddress: string, tokenMint: string) {
  // Simulate different balances based on wallet address
  const walletHash = walletAddress.slice(-4)
  const baseBalance = parseInt(walletHash, 16) * 1000 // Convert last 4 chars to number
  
  // Add some randomness
  const randomFactor = Math.random() * 0.5 + 0.75 // 0.75 to 1.25
  const balance = Math.floor(baseBalance * randomFactor)
  
  return {
    balance,
    hasBalance: balance > 0,
    sufficientForBet: balance >= 100
  }
}

interface PlaceBetRequest {
  marketId: string
  amount: number
  side: 'yes' | 'no'
  walletAddress: string
  tokenMint: string
}

export async function POST(request: NextRequest) {
  try {
    const body: PlaceBetRequest = await request.json()
    const { marketId, amount, side, walletAddress, tokenMint } = body

    // Validate required fields
    if (!marketId || !amount || !side || !walletAddress || !tokenMint) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate amount
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      )
    }

    // Validate side
    if (side !== 'yes' && side !== 'no') {
      return NextResponse.json(
        { error: 'Side must be either "yes" or "no"' },
        { status: 400 }
      )
    }

    // Check token balance before allowing bet
    try {
      // Simulate token balance check (in real implementation, this would query Solana)
      const mockBalance = await checkTokenBalance(walletAddress, tokenMint)
      
      if (!mockBalance.hasBalance) {
        return NextResponse.json(
          { error: 'Insufficient token balance' },
          { status: 400 }
        )
      }

      if (amount > mockBalance.balance) {
        return NextResponse.json(
          { error: `Insufficient balance. You have ${mockBalance.balance} tokens but trying to bet ${amount}` },
          { status: 400 }
        )
      }
    } catch (error) {
      console.error('Error checking token balance:', error)
      return NextResponse.json(
        { error: 'Failed to verify token balance' },
        { status: 500 }
      )
    }

    // TODO: In real implementation, this would:
    // 1. Validate wallet signature
    // 2. Check user has sufficient token balance
    // 3. Call smart contract to place bet
    // 4. Return transaction signature

    // For now, simulate successful bet placement
    const result = await smartContractService.placeBet(
      {} as any, // Mock wallet - in real implementation, this would be the actual wallet
      marketId,
      amount,
      side
    )

    return NextResponse.json({
      success: true,
      transactionSignature: result.transactionSignature,
      message: `Bet placed: ${amount} tokens on ${side.toUpperCase()}`
    })

  } catch (error) {
    console.error('Error placing bet:', error)
    return NextResponse.json(
      { error: 'Failed to place bet' },
      { status: 500 }
    )
  }
}