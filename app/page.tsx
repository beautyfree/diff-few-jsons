import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { 
  UploadSkeleton, 
  VersionListSkeleton, 
  DiffSkeleton, 
  SessionBarSkeleton 
} from '@/components/Skeleton'

// Dynamically import client components to avoid SSR issues
const UploadPanel = dynamic(() => import('@/components/UploadPanel'), {
  ssr: false,
  loading: () => <UploadSkeleton />
})

const VersionList = dynamic(() => import('@/components/VersionList'), {
  ssr: false,
  loading: () => <VersionListSkeleton />
})

const SequentialDiffs = dynamic(() => import('@/components/SequentialDiffs'), {
  ssr: false,
  loading: () => <DiffSkeleton />
})

const SessionBar = dynamic(() => import('@/components/SessionBar'), {
  ssr: false,
  loading: () => <SessionBarSkeleton />
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
          <div className="space-y-8 max-w-7xl mx-auto">
            <SessionBarSkeleton />
            <UploadSkeleton />
            <VersionListSkeleton />
            <DiffSkeleton />
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
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-muted-foreground">
                  Diff Few JSONs Online - Free JSON Comparison Tool | Compare JSON files instantly without registration
                </p>
                <div className="flex items-center gap-4">
                  <a
                    href="https://github.com/beautyfree/diff-few-jsons"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    <span>GitHub</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  )
}
