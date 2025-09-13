"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Wallet, User, Bell, TrendingUp, DollarSign, Clock, X } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useI18n } from "@/lib/i18n"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

export function Header() {
  const { t, locale, setLocale } = useI18n()
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

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6 w-full">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">P</span>
            </div>
            <span className="font-bold text-xl text-primary">PredictMarket</span>
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

        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input placeholder={t("search_placeholder")} className="pl-10 w-48" />
          </div>

          <Button size="sm" className="gap-2">
            <Wallet className="w-4 h-4" />
            {t("connect_wallet")}
          </Button>

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
            className="px-2">
            {locale === "en" ? "中文" : "EN"}
          </Button>

          <Link href="/portfolio">
            <Button variant="ghost" size="sm">
              <User className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}

export default Header
