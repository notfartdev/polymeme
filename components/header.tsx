"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Wallet, User, Bell, TrendingUp, DollarSign, Clock, X, TrendingUp as TrendingIcon } from "lucide-react"
import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { useI18n } from "@/lib/i18n"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { WalletConnect } from "@/components/wallet-connect"
import { WalletAwareLink } from "@/components/wallet-aware-link"
import { SearchResult } from "@/lib/coingecko"

export function Header() {
  const { t, locale, setLocale } = useI18n()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const searchRef = useRef<HTMLDivElement>(null)
  
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "surge",
      title: "Market Surge Alert",
      message: "Trump 2024 Election market up 15% in last hour",
      time: "2 min ago",
      read: false,
      icon: TrendingUp,
    },
    {
      id: 2,
      type: "trade",
      title: "Trade Executed",
      message: "Your YES position in Bitcoin $100k filled at 67¢",
      time: "5 min ago",
      read: false,
      icon: DollarSign,
    },
    {
      id: 3,
      type: "upcoming",
      title: "Market Expiring Soon",
      message: "Your position in Fed Rate Cut expires in 2 hours",
      time: "1 hour ago",
      read: true,
      icon: Clock,
    },
    {
      id: 4,
      type: "surge",
      title: "High Volume Alert",
      message: "Solana ETF Approval market volume increased 300%",
      time: "3 hours ago",
      read: true,
      icon: TrendingUp,
    },
  ])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = (id: number) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const removeNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  // Search functionality
  const handleSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      setIsSearchOpen(false)
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.results || [])
        setIsSearchOpen(true)
      }
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(value)
    }, 300)
  }

  const handleSearchResultClick = (result: SearchResult) => {
    setSearchQuery("")
    setSearchResults([])
    setIsSearchOpen(false)
    // Navigate to token detail page
    window.location.href = `/token/${result.symbol.toLowerCase()}`
  }

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 w-full">
        <div className="flex items-center gap-4 sm:gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">P</span>
            </div>
            <span className="font-bold text-lg sm:text-xl text-primary hidden sm:block">PredictMarket</span>
            <span className="font-bold text-lg sm:text-xl text-primary sm:hidden">PM</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/markets">
              <Button variant="ghost" className="text-sm font-medium">
                {t("nav_markets")}
              </Button>
            </Link>
            <Link href="/global">
              <Button variant="ghost" className="text-sm font-medium">
                {t("nav_global")}
              </Button>
            </Link>
            <Link href="/leaderboard">
              <Button variant="ghost" className="text-sm font-medium">
                {t("nav_leaderboard")}
              </Button>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative hidden lg:block" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder={t("search_placeholder")} 
              className="pl-10 w-64" 
              value={searchQuery}
              onChange={handleSearchInputChange}
              onFocus={() => searchResults.length > 0 && setIsSearchOpen(true)}
            />
            
            {/* Search Results Dropdown */}
            {isSearchOpen && (
              <div className="absolute top-full left-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-80 overflow-y-auto min-w-80 w-max">
                {isSearching ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto mb-2"></div>
                    Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-2">
                    <div className="px-4 py-2 text-xs text-muted-foreground border-b border-border/50">
                      Click any coin to create a prediction market
                    </div>
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        className="w-full px-4 py-3 text-left hover:bg-muted/50 flex items-center gap-3 min-w-0"
                        onClick={() => handleSearchResultClick(result)}
                      >
                        {result.thumb && (
                          <img 
                            src={result.thumb} 
                            alt={result.name}
                            className="w-6 h-6 rounded-full flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                            {result.name}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">
                              {result.symbol.toUpperCase()}
                            </span>
                            {result.market_cap_rank && (
                              <span>Rank #{result.market_cap_rank}</span>
                            )}
                          </div>
                        </div>
                        <TrendingIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                ) : searchQuery.length >= 2 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No coins found for "{searchQuery}"
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <WalletConnect />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute top-0 right-0 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs -translate-y-1/2 translate-x-1/2"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0">
              <div className="p-4 border-b">
                <h3 className="font-semibold">{t("notifications")}</h3>
                <p className="text-sm text-muted-foreground">
                  {unreadCount > 0 ? `${unreadCount} ${t("unread_notifications")}` : t("all_caught_up")}
                </p>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">{t("no_notifications")}</div>
                ) : (
                  notifications.map((notification) => {
                    const IconComponent = notification.icon
                    return (
                      <div
                        key={notification.id}
                        className={`p-4 border-b hover:bg-muted/50 cursor-pointer ${
                          !notification.read ? "bg-blue-50/50" : ""
                        }`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2 rounded-full ${
                              notification.type === "surge"
                                ? "bg-green-100 text-green-600"
                                : notification.type === "trade"
                                  ? "bg-blue-100 text-blue-600"
                                  : "bg-orange-100 text-orange-600"
                            }`}
                          >
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm">{notification.title}</p>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeNotification(notification.id)
                                }}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-2">{notification.time}</p>
                          </div>
                          {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
              {notifications.length > 0 && (
                <div className="p-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
                  >
                    {t("mark_all_read")}
                  </Button>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="sm" onClick={() => setLocale(locale === "en" ? "zh" : "en")}
            className="px-2 hidden sm:flex">
            {locale === "en" ? "中文" : "EN"}
          </Button>

          <WalletAwareLink href="/portfolio" requiresWallet={true}>
            <Button variant="ghost" size="sm">
              <User className="w-4 h-4" />
            </Button>
          </WalletAwareLink>
        </div>
      </div>
    </header>
  )
}

export default Header
