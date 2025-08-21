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

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Modern Hero Header */}
        <header className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            JSON Diff Timeline
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-4 bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
            Track Changes Over Time
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Visualize JSON differences with a modern, interactive timeline. Compare versions, track evolution, and understand your data changes at a glance.
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
      </div>
    </main>
  )
}
