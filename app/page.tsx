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
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            JSON Diff Timeline
          </h1>
          <p className="text-muted-foreground">
            Visualize JSON differences over time with a modern, interactive timeline
          </p>
        </header>

        <Suspense fallback={
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        }>
                    <div className="grid gap-6">
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
