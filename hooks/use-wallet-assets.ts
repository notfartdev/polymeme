"use client"

import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { fetchAllWalletAssets, WalletAsset, calculatePortfolioValue, calculatePortfolioChange } from '@/lib/wallet-assets'

export function useWalletAssets() {
  const { publicKey, connected } = useWallet()
  const [assets, setAssets] = useState<WalletAsset[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAssets = async () => {
    if (!publicKey || !connected) {
      console.log('No publicKey or not connected:', { publicKey: publicKey?.toString(), connected })
      setAssets([])
      setError(null)
      return
    }

    console.log('Fetching assets for wallet:', publicKey.toString())
    setLoading(true)
    setError(null)

    try {
      const walletAssets = await fetchAllWalletAssets(publicKey.toString())
      console.log('Fetched wallet assets:', walletAssets)
      
      // Filter out assets with zero balance and add some validation
      const validAssets = walletAssets.filter(asset => 
        asset.balance > 0 && 
        asset.symbol && 
        asset.symbol !== 'UNKNOWN' &&
        !asset.symbol.startsWith('TOKEN_')
      )
      
      setAssets(validAssets)
      
      if (validAssets.length === 0) {
        setError('No valid tokens found in your wallet. Make sure you have some SPL tokens or SOL.')
      }
    } catch (err) {
      console.error('Error fetching wallet assets:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch wallet assets')
      setAssets([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssets()
  }, [publicKey, connected])

  const totalValue = calculatePortfolioValue(assets)
  const totalChange = calculatePortfolioChange(assets)

  return {
    assets,
    loading,
    error,
    totalValue,
    totalChange,
    refetch: fetchAssets
  }
}
