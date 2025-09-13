import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

// Types for market creation
export interface CreateMarketRequest {
  asset: string
  questionType: 'yes-no' | 'multiple-choice' | 'numeric' | 'date'
  question: string
  description: string
  closingDate: string
  tokenMint?: string // SPL token mint address for smart contract
  multipleChoiceOptions?: string[]
  minValue?: string
  maxValue?: string
  unit?: string
  earliestDate?: string
  latestDate?: string
}

export interface MarketResponse {
  id: string
  asset: string
  questionType: string
  question: string
  description: string
  closingDate: string
  createdAt: string
  status: 'active' | 'pending' | 'closed'
  creator: string
  tokenMint?: string // SPL token mint address
  // Type-specific fields
  multipleChoiceOptions?: string[]
  minValue?: string
  maxValue?: string
  unit?: string
  earliestDate?: string
  latestDate?: string
}

// File-based storage for demo purposes
const DATA_FILE = path.join(process.cwd(), 'data', 'markets.json')

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.dirname(DATA_FILE)
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

// Load markets from file
async function loadMarkets(): Promise<MarketResponse[]> {
  try {
    await ensureDataDir()
    const data = await fs.readFile(DATA_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

// Save markets to file
async function saveMarkets(markets: MarketResponse[]): Promise<void> {
  await ensureDataDir()
  await fs.writeFile(DATA_FILE, JSON.stringify(markets, null, 2))
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateMarketRequest = await request.json()
    
    // Validate required fields
    if (!body.asset || !body.questionType || !body.question || !body.description || !body.closingDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate question type specific fields
    if (body.questionType === 'multiple-choice' && (!body.multipleChoiceOptions || body.multipleChoiceOptions.length < 2)) {
      return NextResponse.json(
        { error: 'Multiple choice questions require at least 2 options' },
        { status: 400 }
      )
    }

    if (body.questionType === 'numeric' && (!body.minValue || !body.maxValue)) {
      return NextResponse.json(
        { error: 'Numeric questions require min and max values' },
        { status: 400 }
      )
    }

    if (body.questionType === 'date' && (!body.earliestDate || !body.latestDate)) {
      return NextResponse.json(
        { error: 'Date questions require earliest and latest dates' },
        { status: 400 }
      )
    }

    // Load existing markets
    const markets = await loadMarkets()

    // Create new market
    const newMarket: MarketResponse = {
      id: `market_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      asset: body.asset,
      questionType: body.questionType,
      question: body.question,
      description: body.description,
      closingDate: body.closingDate,
      createdAt: new Date().toISOString(),
      status: 'active',
      creator: 'demo_user', // In production, this would come from authentication
      tokenMint: body.tokenMint, // SPL token mint address
      // Type-specific fields
      ...(body.multipleChoiceOptions && { multipleChoiceOptions: body.multipleChoiceOptions }),
      ...(body.minValue && { minValue: body.minValue }),
      ...(body.maxValue && { maxValue: body.maxValue }),
      ...(body.unit && { unit: body.unit }),
      ...(body.earliestDate && { earliestDate: body.earliestDate }),
      ...(body.latestDate && { latestDate: body.latestDate }),
    }

    // Store the market
    markets.push(newMarket)
    await saveMarkets(markets)

    return NextResponse.json(newMarket, { status: 201 })
  } catch (error) {
    console.error('Error creating market:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const markets = await loadMarkets()
    return NextResponse.json(markets, { status: 200 })
  } catch (error) {
    console.error('Error fetching markets:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
