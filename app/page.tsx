import { Suspense } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import client components to avoid SSR issues
const UploadPanel = dynamic(() => import('@/components/UploadPanel'), {
  ssr: false,
  loading: () => <div className="text-muted-foreground">Loading upload panel...</div>
})

const VersionList = dynamic(() => import('@/components/VersionList'), {
  ssr: false,
  loading: () => <div className="text-muted-foreground">Loading version list...</div>
})

const SequentialDiffs = dynamic(() => import('@/components/SequentialDiffs'), {
  ssr: false,
  loading: () => <div className="text-muted-foreground">Loading diffs...</div>
})

const SessionBar = dynamic(() => import('@/components/SessionBar'), {
  ssr: false,
  loading: () => <div className="text-muted-foreground">Loading session controls...</div>
})

const NotificationContainer = dynamic(() => import('@/components/NotificationContainer'), {
  ssr: false
})

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <NotificationContainer />
      <div className="container mx-auto px-4 py-8">
        {/* SEO-Optimized Hero Header */}
        <header className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Free Online Tool
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-4 bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
            Diff Few JSONs Online
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-6">
            Compare JSON files online for free. Visualize differences between JSON objects with side-by-side and unified diff views. No registration required, instant results.
          </p>
        </header>

        <Suspense fallback={
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        }>
          <div className="grid gap-8 max-w-7xl mx-auto">
            {/* Session Management */}
            <SessionBar />

            {/* Upload JSON Files */}
            <UploadPanel />

            {/* JSON Versions */}
            <VersionList />

            {/* Sequential Diffs */}
            <SequentialDiffs />
          </div>
        </Suspense>
        
        {/* SEO Footer */}
        <footer className="mt-16 pt-8 border-t border-border/50">
          <div className="max-w-4xl mx-auto text-center">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">About Diff Few JSONs Online</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  A free online tool for comparing JSON files and objects. Perfect for developers, data analysts, and anyone who needs to identify differences between JSON structures. Our tool provides both side-by-side and unified diff views for comprehensive comparison.
                </p>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">Key Features</h2>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Instant JSON file comparison</li>
                  <li>• Side-by-side and unified diff views</li>
                  <li>• Git-style diff output</li>
                  <li>• No file upload limits</li>
                  <li>• Dark and light themes</li>
                  <li>• Session management and export</li>
                </ul>
              </div>
            </div>
            <div className="mt-8 pt-4 border-t border-border/30">
              <p className="text-xs text-muted-foreground">
                Diff Few JSONs Online - Free JSON Comparison Tool | Compare JSON files instantly without registration
              </p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  )
}
