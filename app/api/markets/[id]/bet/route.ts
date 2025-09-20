import { NextRequest, NextResponse } from 'next/server'
import { smartContractService } from '@/lib/smart-contract-real'
import { PublicKey } from '@solana/web3.js'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { walletAddress, amount, side, signature } = body

    // Validate required fields
    if (!walletAddress || !amount || !side || !signature) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate side
    if (!['yes', 'no'].includes(side)) {
      return NextResponse.json(
        { error: 'Invalid side. Must be "yes" or "no"' },
        { status: 400 }
      )
    }

    // Validate amount
    const betAmount = parseFloat(amount)
    if (isNaN(betAmount) || betAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid bet amount' },
        { status: 400 }
      )
    }

    // Create wallet object for smart contract
    const wallet = {
      publicKey: new PublicKey(walletAddress),
      signTransaction: async (tx: any) => {
        // This would normally be handled by the frontend
        // For now, we'll return the transaction as-is
        return tx
      },
      signAllTransactions: async (txs: any[]) => {
        // This would normally be handled by the frontend
        return txs
      }
    }

    // Convert amount to token decimals (assuming 6 decimals)
    const tokenAmount = Math.floor(betAmount * Math.pow(10, 6))

    // Place bet using smart contract
    const result = await smartContractService.placeBet(
      wallet,
      parseInt(params.id),
      tokenAmount,
      side
    )

    if (result.success) {
      return NextResponse.json({
        success: true,
        transactionSignature: result.transactionSignature,
        message: `Bet placed successfully: ${betAmount} tokens on ${side.toUpperCase()}`
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to place bet' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error placing bet:', error)
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
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('wallet')

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    // Fetch user position from smart contract
    const position = await smartContractService.fetchUserPosition(
      parseInt(params.id),
      new PublicKey(walletAddress)
    )

    if (position) {
      return NextResponse.json({
        success: true,
        position: {
          yesAmount: position.yesAmount,
          noAmount: position.noAmount,
          totalAmount: position.yesAmount + position.noAmount
        }
      })
    } else {
      return NextResponse.json({
        success: true,
        position: {
          yesAmount: 0,
          noAmount: 0,
          totalAmount: 0
        }
      })
    }

  } catch (error) {
    console.error('Error fetching user position:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
