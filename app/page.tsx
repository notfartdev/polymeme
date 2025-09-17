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
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      <Header />

      <main className="container mx-auto px-4 sm:px-6 flex-1 flex flex-col justify-center">
        {/* Hero Section */}
        <div className="text-center mb-4 mt-8 sm:mt-12 md:mt-20">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-4 text-balance leading-tight px-4">
            {t("hero_title_prefix")} <span className="glow-pulse" style={{ color: "#2d8f5a" }}>{t("hero_title_highlight")}</span> {t("hero_title_suffix")}
          </h1>
        </div>

        {/* Featured Markets Coverflow */}
        <div className="mb-4 flex-1 flex items-center min-h-0">
          <MarketCoverflow />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pb-4 px-4">
          <WalletAwareLink href="/create-market" requiresWallet={true}>
            <Button size="lg" className="px-6 py-2 rounded-full w-full sm:w-auto">
              {t("cta_create_market")}
            </Button>
          </WalletAwareLink>
          <Link href="/markets">
            <Button variant="outline" size="lg" className="px-6 py-2 rounded-full bg-transparent w-full sm:w-auto">
              {t("cta_see_all")}
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
