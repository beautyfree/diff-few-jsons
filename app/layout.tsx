import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import '../src/styles/theme.css'
import ThemeProvider from '@/components/ThemeProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Diff Few JSONs Online - Free JSON Comparison Tool',
  description: 'Compare JSON files online for free. Visualize differences between JSON objects with side-by-side and unified diff views. No registration required, instant results.',
  keywords: [
    'JSON diff online',
    'JSON comparison tool',
    'compare JSON files',
    'JSON difference checker',
    'online JSON diff',
    'JSON file comparison',
    'diff JSON online',
    'JSON visualizer',
    'JSON diff tool',
    'free JSON comparison'
  ],
  authors: [{ name: 'Diff Few JSONs Team' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: 'Diff Few JSONs Online - Free JSON Comparison Tool',
    description: 'Compare JSON files online for free. Visualize differences between JSON objects with side-by-side and unified diff views.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Diff Few JSONs Online - Free JSON Comparison Tool',
    description: 'Compare JSON files online for free. Visualize differences between JSON objects.',
  },
  alternates: {
    canonical: 'https://diff-few-jsons.vercel.app',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Diff Few JSONs Online",
              "description": "Free online tool for comparing JSON files and objects with side-by-side and unified diff views",
              "url": "https://diff-few-jsons.vercel.app",
              "applicationCategory": "DeveloperApplication",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "featureList": [
                "JSON file comparison",
                "Side-by-side diff view",
                "Unified diff view",
                "Git-style diff output",
                "No registration required",
                "Dark and light themes",
                "Session management"
              ],
              "author": {
                "@type": "Organization",
                "name": "Diff Few JSONs Team"
              }
            })
          }}
        />
      </head>
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
