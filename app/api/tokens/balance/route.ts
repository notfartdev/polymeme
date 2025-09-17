import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey } from '@solana/web3.js'
import { getAccount, getAssociatedTokenAddress } from '@solana/spl-token'

interface TokenBalanceRequest {
  walletAddress: string
  tokenMint: string
}

export async function POST(request: NextRequest) {
  try {
    const body: TokenBalanceRequest = await request.json()
    const { walletAddress, tokenMint } = body

    // Validate required fields
    if (!walletAddress || !tokenMint) {
      return NextResponse.json(
        { error: 'Missing required fields: walletAddress and tokenMint' },
        { status: 400 }
      )
    }

    // Validate wallet address format
    try {
      new PublicKey(walletAddress)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      )
    }

    // Validate token mint format
    try {
      new PublicKey(tokenMint)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token mint format' },
        { status: 400 }
      )
    }

    // TODO: In real implementation, this would:
    // 1. Connect to Solana RPC
    // 2. Get the associated token account
    // 3. Fetch the token balance
    // 4. Return the balance in token units

    // For now, simulate token balance checking
    const mockBalance = await checkTokenBalance(walletAddress, tokenMint)

    return NextResponse.json({
      success: true,
      walletAddress,
      tokenMint,
      balance: mockBalance.balance,
      balanceFormatted: mockBalance.balanceFormatted,
      hasBalance: mockBalance.balance > 0,
      sufficientForBet: mockBalance.balance >= 100, // Minimum bet amount
      lastChecked: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error checking token balance:', error)
    return NextResponse.json(
      { error: 'Failed to check token balance' },
      { status: 500 }
    )
  }
}

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
    balanceFormatted: `${balance.toLocaleString()} tokens`
  }
}
