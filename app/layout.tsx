import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import '../src/styles/theme.css'
import ThemeProvider from '@/components/ThemeProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'JSON Diff Timeline',
  description: 'Visualize JSON differences over time with a modern, interactive timeline',
  keywords: ['JSON', 'diff', 'timeline', 'comparison', 'visualization'],
  authors: [{ name: 'JSON Diff Timeline Team' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'noindex, nofollow', // Privacy-focused app
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider>
          <div id="root">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
