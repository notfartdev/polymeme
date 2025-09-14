"use client"

import { useWallet } from '@solana/wallet-adapter-react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface WalletAwareLinkProps {
  href: string
  children: React.ReactNode
  requiresWallet?: boolean
  className?: string
  onClick?: () => void
}

export function WalletAwareLink({ 
  href, 
  children, 
  requiresWallet = false, 
  className,
  onClick 
}: WalletAwareLinkProps) {
  const { connected } = useWallet()
  const router = useRouter()
  const { toast } = useToast()

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick()
    }

    if (requiresWallet && !connected) {
      e.preventDefault()
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to access this page.",
        variant: "destructive"
      })
      return
    }

    // If wallet is required and connected, or not required, proceed normally
    router.push(href)
  }

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  )
}
