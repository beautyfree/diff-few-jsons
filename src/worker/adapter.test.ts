import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { DiffAdapter, createDiffAdapter } from './adapter'
import type { DiffOptions } from '@/types/domain'
import type { ProgressEvent } from './adapter'

// Mock the worker manager
vi.mock('./index', () => ({
  DiffWorkerManager: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    isWorkerAvailable: vi.fn().mockReturnValue(true),
    computeJsonDiff: vi.fn().mockResolvedValue('worker-job-id'),
    cancelJob: vi.fn().mockResolvedValue(true),
    getJobStatus: vi.fn().mockResolvedValue({
      id: 'worker-job-id',
      status: 'completed',
      result: {
        versionA: '',
        versionB: '',
        optionsKey: '',
        root: { path: '', kind: 'unchanged' as const },
        stats: { nodes: 1, computeMs: 10 }
      }
    }),
    getAllJobStatuses: vi.fn().mockResolvedValue([]),
    getQueueStats: vi.fn().mockResolvedValue({
      totalJobs: 0,
      runningJobs: 0,
      maxConcurrentJobs: 2,
      maxQueueSize: 10
    }),
    computeJsonDiffDirect: vi.fn(),
    terminate: vi.fn()
  }))
}))

// Mock the diff engine
vi.mock('@/engine/diff', () => ({
  computeJsonDiff: vi.fn().mockImplementation((a, b, options) => ({
    versionA: '',
    versionB: '',
    optionsKey: '',
    root: { path: '', kind: 'unchanged' as const },
    stats: { nodes: 1, computeMs: 10 }
  }))
}))

describe('DiffAdapter', () => {
  let adapter: DiffAdapter
  let progressEvents: ProgressEvent[]

  beforeEach(() => {
    vi.useFakeTimers()
    progressEvents = []
    
    adapter = createDiffAdapter({
      maxInThreadSize: 100, // Small size to force worker usage
      useWorker: true,
      onProgress: (event) => progressEvents.push(event)
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    adapter.dispose()
  })

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await expect(adapter.initialize()).resolves.toBeUndefined()
      expect(adapter.isWorkerAvailable()).toBe(true)
    })
  })

  describe('Diff Computation', () => {
    beforeEach(async () => {
      await adapter.initialize()
    })

    it('should compute diff with progress events', async () => {
      const a = { name: 'John', age: 30 }
      const b = { name: 'John', age: 31 }
      const options: DiffOptions = {
        arrayStrategy: 'index',
        arrayKeyPath: undefined,
        ignoreRules: [],
        transformRules: []
      }

      const computation = adapter.computeDiff(a, b, options)

      // Fast-forward time to simulate progress
      vi.advanceTimersByTime(100)

      const result = await computation

      expect(result.cancelled).toBe(false)
      expect(result.result).toBeDefined()
      expect(result.jobId).toBeDefined()

      // Check progress events
      expect(progressEvents).toHaveLength(5) // start, progress(25), progress(75), progress(100), done
      expect(progressEvents[0].type).toBe('start')
      expect(progressEvents[1].type).toBe('progress')
      expect(progressEvents[1].progress).toBe(25)
      expect(progressEvents[2].type).toBe('progress')
      expect(progressEvents[2].progress).toBe(75)
      expect(progressEvents[3].type).toBe('progress')
      expect(progressEvents[3].progress).toBe(100)
      expect(progressEvents[4].type).toBe('done')
    })

    it('should use in-thread computation for small inputs', async () => {
      const smallAdapter = createDiffAdapter({
        maxInThreadSize: 1024 * 1024, // 1MB
        useWorker: true,
        onProgress: (event) => progressEvents.push(event)
      })

      await smallAdapter.initialize()

      const a = { name: 'John' }
      const b = { name: 'Jane' }
      const options: DiffOptions = {
        arrayStrategy: 'index',
        arrayKeyPath: undefined,
        ignoreRules: [],
        transformRules: []
      }

      const result = await smallAdapter.computeDiff(a, b, options)

      expect(result.cancelled).toBe(false)
      expect(result.result).toBeDefined()
      expect(progressEvents.some(e => e.type === 'start')).toBe(true)
      expect(progressEvents.some(e => e.type === 'done')).toBe(true)
    })
  })

  describe('Job Management', () => {
    beforeEach(async () => {
      await adapter.initialize()
    })

    it('should return false when cancelling non-existent job', () => {
      const cancelled = adapter.cancelJob('non-existent-job')
      expect(cancelled).toBe(false)
    })

    it('should get queue statistics', async () => {
      const stats = await adapter.getQueueStats()
      expect(stats).toBeDefined()
      expect(stats.totalJobs).toBe(0)
      expect(stats.runningJobs).toBe(0)
      expect(stats.maxConcurrentJobs).toBe(2)
      expect(stats.maxQueueSize).toBe(10)
    })

    it('should track active job count', async () => {
      expect(adapter.getActiveJobCount()).toBe(0)

      const a = { name: 'John' }
      const b = { name: 'Jane' }
      const options: DiffOptions = {
        arrayStrategy: 'index',
        arrayKeyPath: undefined,
        ignoreRules: [],
        transformRules: []
      }

      const computation = adapter.computeDiff(a, b, options)

      // Job should be active immediately after starting
      expect(adapter.getActiveJobCount()).toBe(1)

      // Wait for completion
      vi.advanceTimersByTime(200)
      await computation

      // Job should be completed
      expect(adapter.getActiveJobCount()).toBe(0)
    })
  })

  describe('Worker Integration', () => {
    beforeEach(async () => {
      await adapter.initialize()
    })

    it('should use worker for large inputs', async () => {
      const largeAdapter = createDiffAdapter({
        maxInThreadSize: 100, // Very small to force worker usage
        useWorker: true,
        onProgress: (event) => progressEvents.push(event)
      })

      await largeAdapter.initialize()

      // Create a large input
      const largeData = Array.from({ length: 1000 }, (_, i) => ({ id: i, data: 'x'.repeat(100) }))
      const a = { items: largeData }
      const b = { items: largeData.map(item => ({ ...item, data: item.data + 'modified' })) }
      
      const options: DiffOptions = {
        arrayStrategy: 'index',
        arrayKeyPath: undefined,
        ignoreRules: [],
        transformRules: []
      }

      const computation = largeAdapter.computeDiff(a, b, options)

      // Fast-forward time to simulate worker processing
      vi.advanceTimersByTime(500)

      const result = await computation

      expect(result.cancelled).toBe(false)
      expect(result.result).toBeDefined()
      expect(progressEvents.some(e => e.type === 'start')).toBe(true)
      expect(progressEvents.some(e => e.type === 'done')).toBe(true)
    })
  })
})
