"use client"

import { Header } from "@/components/header"
import { MarketCoverflow } from "@/components/market-coverflow"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useI18n } from "@/lib/i18n"
import { WalletAwareLink } from "@/components/wallet-aware-link"

export default function HomePage() {
  const { t } = useI18n()
  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col">
      <Header />

      <main className="container mx-auto px-6 flex-1 flex flex-col justify-center">
        {/* Hero Section */}
        <div className="text-center mb-4 mt-20">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 text-balance leading-tight">
            {t("hero_title_prefix")} <span className="glow-pulse" style={{ color: "#2d8f5a" }}>{t("hero_title_highlight")}</span> {t("hero_title_suffix")}
          </h1>
        </div>

        {/* Featured Markets Coverflow */}
        <div className="mb-4 flex-1 flex items-center">
          <MarketCoverflow />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center pb-4">
          <WalletAwareLink href="/create-market" requiresWallet={true}>
            <Button size="lg" className="px-6 py-2 rounded-full">
              {t("cta_create_market")}
            </Button>
          </WalletAwareLink>
          <Link href="/markets">
            <Button variant="outline" size="lg" className="px-6 py-2 rounded-full bg-transparent">
              {t("cta_see_all")}
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
