import { Connection, PublicKey } from '@solana/web3.js'
import { getAccount, getAssociatedTokenAddress } from '@solana/spl-token'
import { CoinGeckoAPI, TokenData } from './coingecko'

// Solana RPC endpoint - using Helius for better performance
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://mainnet.helius-rpc.com'
const HELIUS_API_KEY = process.env.HELIUS_API_KEY || '580abc5a-076c-45c9-bf91-a230d62aaea6'

// Create connection with API key
const connection = new Connection(SOLANA_RPC_URL, {
  commitment: 'confirmed',
  httpHeaders: HELIUS_API_KEY ? { 'Authorization': `Bearer ${HELIUS_API_KEY}` } : {}
})

export interface WalletAsset {
  mint: string
  symbol: string
  name: string
  balance: number
  decimals: number
  logo?: string
  price?: number
  value?: number
  change24h?: number
  // Pump.fun specific data
  isPumpFun?: boolean
  pumpFunData?: {
    creator?: string
    description?: string
    image?: string
    twitter?: string
    telegram?: string
    website?: string
    bondingCurve?: any
  }
}

// Cache for token metadata to avoid repeated API calls
const tokenMetadataCache = new Map<string, { symbol: string; name: string; decimals: number; logo?: string }>()

// Cache for Solana token list
let solanaTokenList: any[] | null = null

// Moralis API configuration
const MORALIS_API_KEY = process.env.MORALIS_API_KEY
const MORALIS_BASE_URL = 'https://solana-gateway.moralis.io'

// Fetch Solana token list
async function getSolanaTokenList(): Promise<any[]> {
  if (solanaTokenList) {
    return solanaTokenList
  }

  try {
    console.log('Fetching Solana token list...')
    const response = await fetch('https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/solana.tokenlist.json')
    
    if (response.ok) {
      const data = await response.json()
      solanaTokenList = data.tokens || []
      console.log('Loaded Solana token list:', solanaTokenList.length, 'tokens')
      return solanaTokenList
    }
  } catch (error) {
    console.warn('Failed to fetch Solana token list:', error)
  }

  return []
}

// Get token metadata from Moralis API (great for pump.fun tokens)
async function getMoralisTokenMetadata(mintAddress: string): Promise<{ symbol: string; name: string; decimals: number; logo?: string } | null> {
  if (!MORALIS_API_KEY) {
    console.warn('Moralis API key not configured')
    return null
  }

  try {
    console.log('Fetching token metadata from Moralis for:', mintAddress)
    
    // Try to get token metadata from Moralis
    const response = await fetch(`${MORALIS_BASE_URL}/token/${mintAddress}/metadata`, {
      headers: {
        'X-API-Key': MORALIS_API_KEY,
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      const data = await response.json()
      
      if (data && data.symbol) {
        const metadata = {
          symbol: data.symbol,
          name: data.name || data.symbol,
          decimals: data.decimals || 6,
          logo: data.logo
        }
        
        console.log('Found token metadata in Moralis:', metadata)
        return metadata
      }
    }
  } catch (error) {
    console.warn('Failed to fetch token metadata from Moralis:', error)
  }

  return null
}

// Get pump.fun token data from Moralis (specialized for memecoins)
async function getPumpFunTokenData(mintAddress: string): Promise<any> {
  if (!MORALIS_API_KEY) {
    return null
  }

  try {
    console.log('Fetching pump.fun data from Moralis for:', mintAddress)
    
    // Try to get pump.fun specific data
    const response = await fetch(`${MORALIS_BASE_URL}/pump-fun/token/${mintAddress}`, {
      headers: {
        'X-API-Key': MORALIS_API_KEY,
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      const data = await response.json()
      console.log('Found pump.fun data:', data)
      return data
    }
  } catch (error) {
    console.warn('Failed to fetch pump.fun data from Moralis:', error)
  }

  return null
}

// Get token metadata from CoinGecko API
async function getTokenMetadata(mintAddress: string): Promise<{ symbol: string; name: string; decimals: number; logo?: string } | null> {
  // Check cache first
  if (tokenMetadataCache.has(mintAddress)) {
    return tokenMetadataCache.get(mintAddress)!
  }

  try {
    console.log('Fetching token metadata for:', mintAddress)
    
    // Try CoinGecko API first
    const response = await fetch(`https://api.coingecko.com/api/v3/coins/solana/contract/${mintAddress}`)
    
    if (response.ok) {
      const data = await response.json()
      const metadata = {
        symbol: data.symbol?.toUpperCase() || 'UNKNOWN',
        name: data.name || 'Unknown Token',
        decimals: 6, // Default to 6 decimals for most SPL tokens
        logo: data.image?.small || data.image?.thumb
      }
      
      // Cache the result
      tokenMetadataCache.set(mintAddress, metadata)
      console.log('Found token metadata:', metadata)
      return metadata
    }
  } catch (error) {
    console.warn('Failed to fetch token metadata from CoinGecko:', error)
  }

  // Fallback 2: Try Moralis API (great for pump.fun tokens)
  try {
    const moralisMetadata = await getMoralisTokenMetadata(mintAddress)
    if (moralisMetadata) {
      // Cache the result
      tokenMetadataCache.set(mintAddress, moralisMetadata)
      return moralisMetadata
    }
  } catch (error) {
    console.warn('Failed to fetch token metadata from Moralis:', error)
  }

  // Fallback 3: Try Solana Token List
  try {
    const tokenList = await getSolanaTokenList()
    const tokenFromList = tokenList.find(token => token.address === mintAddress)
    
    if (tokenFromList) {
      const metadata = {
        symbol: tokenFromList.symbol || `TOKEN_${mintAddress.slice(0, 4)}`,
        name: tokenFromList.name || `Token ${mintAddress.slice(0, 8)}`,
        decimals: tokenFromList.decimals || 6,
        logo: tokenFromList.logoURI
      }
      
      // Cache the result
      tokenMetadataCache.set(mintAddress, metadata)
      console.log('Found token in Solana list:', metadata)
      return metadata
    }
  } catch (error) {
    console.warn('Failed to check Solana token list:', error)
  }

  // Fallback 4: Try to get basic info from Solana RPC
  try {
    const mintInfo = await connection.getParsedAccountInfo(new PublicKey(mintAddress))
    if (mintInfo.value?.data && 'parsed' in mintInfo.value.data) {
      const parsedData = mintInfo.value.data.parsed.info
      const metadata = {
        symbol: `TOKEN_${mintAddress.slice(0, 4)}`,
        name: `Token ${mintAddress.slice(0, 8)}`,
        decimals: parsedData.decimals || 6
      }
      
      // Cache the result
      tokenMetadataCache.set(mintAddress, metadata)
      console.log('Found basic token info from RPC:', metadata)
      return metadata
    }
  } catch (error) {
    console.warn('Failed to fetch basic token info from RPC:', error)
  }

  // Final fallback
  const fallbackMetadata = {
    symbol: `TOKEN_${mintAddress.slice(0, 4)}`,
    name: `Token ${mintAddress.slice(0, 8)}`,
    decimals: 6
  }
  
  tokenMetadataCache.set(mintAddress, fallbackMetadata)
  return fallbackMetadata
}

// Fetch all token accounts for a wallet
export async function fetchWalletTokenAccounts(walletAddress: string): Promise<WalletAsset[]> {
  try {
    console.log('Fetching token accounts for wallet:', walletAddress)
    const publicKey = new PublicKey(walletAddress)
    
    // Get all token accounts for this wallet
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
      programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
    })

    console.log('Found token accounts:', tokenAccounts.value.length)
    const assets: WalletAsset[] = []

    for (const account of tokenAccounts.value) {
      const accountData = account.account.data.parsed.info
      const mint = accountData.mint
      const balance = accountData.tokenAmount.uiAmount || 0
      const decimals = accountData.tokenAmount.decimals

      console.log('Token account:', { mint, balance, decimals })

      // Skip zero balance tokens
      if (balance <= 0) {
        console.log('Skipping zero balance token:', mint)
        continue
      }

      // Get token metadata dynamically
      const tokenInfo = await getTokenMetadata(mint)
      if (!tokenInfo) {
        console.log('Failed to get token metadata for:', mint)
        continue
      }

      const asset: WalletAsset = {
        mint,
        symbol: tokenInfo.symbol,
        name: tokenInfo.name,
        balance,
        decimals,
        logo: tokenInfo.logo
      }

      // Check if it's a pump.fun token and get additional data
      try {
        const pumpFunData = await getPumpFunTokenData(mint)
        if (pumpFunData) {
          asset.isPumpFun = true
          asset.pumpFunData = {
            creator: pumpFunData.creator,
            description: pumpFunData.description,
            image: pumpFunData.image,
            twitter: pumpFunData.twitter,
            telegram: pumpFunData.telegram,
            website: pumpFunData.website,
            bondingCurve: pumpFunData.bondingCurve
          }
          // Use pump.fun image if available
          if (pumpFunData.image) {
            asset.logo = pumpFunData.image
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch pump.fun data for ${mint}:`, error)
      }

      // Fetch price data from CoinGecko
      try {
        const tokenData = await CoinGeckoAPI.getTokenData(tokenInfo.symbol)
        if (tokenData && tokenData.current_price) {
          asset.logo = asset.logo || tokenData.image
          asset.price = tokenData.current_price
          asset.value = balance * tokenData.current_price
          asset.change24h = tokenData.price_change_percentage_24h
          console.log(`Price data for ${tokenInfo.symbol}:`, { price: tokenData.current_price, value: asset.value })
        } else {
          console.warn(`No price data found for ${tokenInfo.symbol}`)
          // Set default values for tokens without price data
          asset.price = 0
          asset.value = 0
          asset.change24h = 0
        }
      } catch (error) {
        console.warn(`Failed to fetch price data for ${tokenInfo.symbol}:`, error)
        // Set default values on error
        asset.price = 0
        asset.value = 0
        asset.change24h = 0
      }

      assets.push(asset)
    }

    // Sort by USD value (highest first)
    return assets.sort((a, b) => (b.value || 0) - (a.value || 0))
  } catch (error) {
    console.error('Error fetching wallet token accounts:', error)
    return []
  }
}

// Fetch SOL balance separately
export async function fetchSOLBalance(walletAddress: string): Promise<WalletAsset | null> {
  try {
    console.log('Fetching SOL balance for wallet:', walletAddress)
    const publicKey = new PublicKey(walletAddress)
    const balance = await connection.getBalance(publicKey)
    const solBalance = balance / 1e9 // Convert lamports to SOL

    console.log('SOL balance:', solBalance, 'lamports:', balance)

    if (solBalance <= 0) {
      console.log('No SOL balance found')
      return null
    }

    const asset: WalletAsset = {
      mint: 'So11111111111111111111111111111111111111112',
      symbol: 'SOL',
      name: 'Solana',
      balance: solBalance,
      decimals: 9,
    }

    // Fetch SOL price from CoinGecko
    try {
      const tokenData = await CoinGeckoAPI.getTokenData('SOL')
      if (tokenData && tokenData.current_price) {
        asset.logo = tokenData.image
        asset.price = tokenData.current_price
        asset.value = solBalance * tokenData.current_price
        asset.change24h = tokenData.price_change_percentage_24h
        console.log(`SOL price data:`, { price: tokenData.current_price, value: asset.value })
      } else {
        console.warn('No SOL price data found')
        asset.price = 0
        asset.value = 0
        asset.change24h = 0
      }
    } catch (error) {
      console.warn('Failed to fetch SOL price data:', error)
      asset.price = 0
      asset.value = 0
      asset.change24h = 0
    }

    return asset
  } catch (error) {
    console.error('Error fetching SOL balance:', error)
    return null
  }
}

// Get all wallet assets (SOL + SPL tokens)
export async function fetchAllWalletAssets(walletAddress: string): Promise<WalletAsset[]> {
  try {
    const [solAsset, tokenAssets] = await Promise.all([
      fetchSOLBalance(walletAddress),
      fetchWalletTokenAccounts(walletAddress)
    ])

    const allAssets = [...tokenAssets]
    if (solAsset) {
      allAssets.unshift(solAsset) // Put SOL first
    }

    return allAssets
  } catch (error) {
    console.error('Error fetching all wallet assets:', error)
    return []
  }
}

// Calculate total portfolio value
export function calculatePortfolioValue(assets: WalletAsset[]): number {
  return assets.reduce((total, asset) => total + (asset.value || 0), 0)
}

// Calculate total portfolio change (24h)
export function calculatePortfolioChange(assets: WalletAsset[]): number {
  if (assets.length === 0) return 0
  
  const totalValue = calculatePortfolioValue(assets)
  const weightedChange = assets.reduce((total, asset) => {
    if (!asset.value || !asset.change24h) return total
    const weight = asset.value / totalValue
    return total + (asset.change24h * weight)
  }, 0)

  return weightedChange
}
