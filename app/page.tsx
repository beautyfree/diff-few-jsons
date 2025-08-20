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

const TimelineScrubber = dynamic(() => import('@/components/TimelineScrubber'), {
  ssr: false,
  loading: () => <div className="text-muted-foreground">Loading timeline...</div>
})

const PairMatrix = dynamic(() => import('@/components/PairMatrix'), {
  ssr: false,
  loading: () => <div className="text-muted-foreground">Loading matrix...</div>
})

const DiffTreeView = dynamic(() => import('@/components/DiffTreeView'), {
  ssr: false,
  loading: () => <div className="text-muted-foreground">Loading diff view...</div>
})

const RulesPanel = dynamic(() => import('@/components/RulesPanel'), {
  ssr: false,
  loading: () => <div className="text-muted-foreground">Loading rules panel...</div>
})

const SearchBar = dynamic(() => import('@/components/SearchBar'), {
  ssr: false,
  loading: () => <div className="text-muted-foreground">Loading search...</div>
})

const SessionBar = dynamic(() => import('@/components/SessionBar'), {
  ssr: false,
  loading: () => <div className="text-muted-foreground">Loading session controls...</div>
})

const Consent = dynamic(() => import('@/components/Consent'), {
  ssr: false,
  loading: () => <div className="text-muted-foreground">Loading privacy settings...</div>
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
            {/* Privacy & Consent */}
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Privacy & Security</h2>
              <Consent />
            </div>

            {/* SessionBar */}
            <div className="bg-card border rounded-lg p-6">
              <SessionBar />
            </div>

            {/* UploadPanel */}
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Upload JSON Files</h2>
              <UploadPanel />
            </div>

            {/* VersionList */}
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">JSON Versions</h2>
              <VersionList />
            </div>

            {/* TimelineScrubber */}
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Timeline</h2>
              <TimelineScrubber />
            </div>

            {/* PairMatrix */}
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Comparison Matrix</h2>
              <PairMatrix />
            </div>

            {/* RulesPanel */}
            <div className="bg-card border rounded-lg p-6">
              <RulesPanel />
            </div>

            {/* SearchBar */}
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Search</h2>
              <SearchBar />
            </div>

            {/* DiffTreeView */}
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Diff View</h2>
              <DiffTreeView />
            </div>
          </div>
        </Suspense>
      </div>
    </main>
  )
}
