import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { I18nProvider } from '@/lib/i18n'
import { Toaster } from '@/components/ui/toaster'
import { WalletContextProvider } from '@/contexts/WalletContext'
import { UserProvider } from '@/contexts/UserContext'

export const metadata: Metadata = {
  title: 'Polymeme - Prediction Markets',
  description: 'Trade on the future with Polymeme prediction markets. Bet on crypto, politics, and more.',
  generator: 'Polymeme',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} overflow-x-hidden`}>
        <WalletContextProvider>
          <UserProvider>
            <I18nProvider>
              {children}
              <Toaster />
              <Analytics />
            </I18nProvider>
          </UserProvider>
        </WalletContextProvider>
      </body>
    </html>
  )
}
