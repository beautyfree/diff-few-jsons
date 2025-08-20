import { Suspense } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import client components to avoid SSR issues
const UploadPanel = dynamic(() => import('@/components/UploadPanel'), {
  ssr: false,
  loading: () => <div className="text-gray-600 dark:text-gray-300">Loading upload panel...</div>
})

const VersionList = dynamic(() => import('@/components/VersionList'), {
  ssr: false,
  loading: () => <div className="text-gray-600 dark:text-gray-300">Loading version list...</div>
})

const SequentialDiffs = dynamic(() => import('@/components/SequentialDiffs'), {
  ssr: false,
  loading: () => <div className="text-gray-600 dark:text-gray-300">Loading diffs...</div>
})

const SessionBar = dynamic(() => import('@/components/SessionBar'), {
  ssr: false,
  loading: () => <div className="text-gray-600 dark:text-gray-300">Loading session controls...</div>
})

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white dark:bg-black">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            JSON Diff Timeline
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Visualize JSON differences over time with a modern, interactive timeline
          </p>
        </header>

        <Suspense fallback={
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-600 dark:text-gray-300">Loading...</div>
          </div>
        }>
                    <div className="grid gap-6">
            {/* Session Management */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <SessionBar />
            </div>

            {/* Upload JSON Files */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Upload JSON Files</h2>
              <UploadPanel />
            </div>

            {/* JSON Versions */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">JSON Versions</h2>
              <VersionList />
            </div>

            {/* Sequential Diffs */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Sequential Differences</h2>
              <SequentialDiffs />
            </div>
          </div>
        </Suspense>
      </div>
    </main>
  )
}
