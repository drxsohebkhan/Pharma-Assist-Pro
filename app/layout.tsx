import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Space_Grotesk } from 'next/font/google'
import { AppShell } from '@/components/app-shell'
import { LanguageProvider } from '@/components/language-provider'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'PharmaAssist Pro — Pharmacy Intelligence Platform',
  description:
    'AI-powered clinical decision support system for pharmacists. Smart symptom analysis, inventory-matched medicine suggestions, prescription decoding, and professional dosage guidance. Made by DRX Soheb Khan.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0a0a0f',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`dark bg-background ${geist.variable} ${geistMono.variable} ${spaceGrotesk.variable}`}
    >
      <body className="antialiased min-h-screen">
        <LanguageProvider>
          <AppShell>{children}</AppShell>
        </LanguageProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
