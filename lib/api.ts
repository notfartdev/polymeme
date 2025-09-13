// API client utilities for consistent API calls

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

export interface ApiResponse<T> {
  data?: T
  error?: string
  status: number
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Generic API client function
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  }

  try {
    const response = await fetch(url, { ...defaultOptions, ...options })
    const data = await response.json()

    if (!response.ok) {
      throw new ApiError(
        data.error || `HTTP error! status: ${response.status}`,
        response.status,
        data
      )
    }

    return {
      data,
      status: response.status,
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    
    // Network or other errors
    throw new ApiError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      0
    )
  }
}

// Market creation types
export interface CreateMarketRequest {
  asset: string
  questionType: 'yes-no' | 'multiple-choice' | 'numeric' | 'date'
  question: string
  description: string
  closingDate: string
  tokenMint?: string // SPL token mint address for smart contract
  creatorWalletAddress?: string // Wallet address of the creator
  multipleChoiceOptions?: string[]
  minValue?: string
  maxValue?: string
  unit?: string
  earliestDate?: string
  latestDate?: string
  initialBetAmount?: string
  betSide?: 'yes' | 'no'
  initialBet?: {
    amount: string
    side: 'yes' | 'no'
    token: string
  }
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
  multipleChoiceOptions?: string[]
  minValue?: string
  maxValue?: string
  unit?: string
  earliestDate?: string
  latestDate?: string
}

// Market API functions
export const marketApi = {
  // Create a new market
  async createMarket(marketData: CreateMarketRequest): Promise<MarketResponse> {
    const response = await apiCall<MarketResponse>('/api/markets', {
      method: 'POST',
      body: JSON.stringify(marketData),
    })
    
    if (!response.data) {
      throw new ApiError('No data returned from API', response.status)
    }
    
    return response.data
  },

  // Get all markets
  async getMarkets(): Promise<MarketResponse[]> {
    const response = await apiCall<MarketResponse[]>('/api/markets', {
      method: 'GET',
    })
    
    if (!response.data) {
      throw new ApiError('No data returned from API', response.status)
    }
    
    return response.data
  },

  // Get a specific market by ID
  async getMarket(id: string): Promise<MarketResponse> {
    const response = await apiCall<MarketResponse>(`/api/markets/${id}`, {
      method: 'GET',
    })
    
    if (!response.data) {
      throw new ApiError('No data returned from API', response.status)
    }
    
    return response.data
  },
}

// Utility function to handle API errors in components
export function handleApiError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return 'An unexpected error occurred'
}
