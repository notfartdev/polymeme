"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'

interface User {
  id: string
  walletAddress: string
  walletName?: string
  username?: string
  email?: string
  createdAt: string
  lastLogin: string
  isActive: boolean
  totalMarketsCreated: number
  totalBetsPlaced: number
  totalVolumeTraded: number
  winRate: number
  totalPnl: number
  bio?: string
  avatarUrl?: string
  twitterHandle?: string
  websiteUrl?: string
}

interface UserContextType {
  user: User | null
  loading: boolean
  error: string | null
  refreshUser: () => Promise<void>
  updateUser: (updates: Partial<User>) => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

interface UserProviderProps {
  children: ReactNode
}

export function UserProvider({ children }: UserProviderProps) {
  const { publicKey, connected } = useWallet()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch user data when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      fetchUser()
    } else {
      setUser(null)
    }
  }, [connected, publicKey])

  const fetchUser = async () => {
    if (!publicKey) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/users/${publicKey.toString()}`)
      
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else if (response.status === 404) {
        // User doesn't exist, create them
        await createUser()
      } else {
        throw new Error('Failed to fetch user')
      }
    } catch (err) {
      console.error('Error fetching user:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const createUser = async () => {
    if (!publicKey) return

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          walletName: 'Phantom' // You could detect this from the wallet adapter
        }),
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        throw new Error('Failed to create user')
      }
    } catch (err) {
      console.error('Error creating user:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const refreshUser = async () => {
    await fetchUser()
  }

  const updateUser = async (updates: Partial<User>) => {
    if (!publicKey || !user) return

    try {
      const response = await fetch(`/api/users/${publicKey.toString()}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        const updatedUser = await response.json()
        setUser(updatedUser)
      } else {
        throw new Error('Failed to update user')
      }
    } catch (err) {
      console.error('Error updating user:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const value: UserContextType = {
    user,
    loading,
    error,
    refreshUser,
    updateUser
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
