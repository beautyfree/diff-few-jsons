import { DiffWorkerManager } from './index'
import { computeJsonDiff } from '@/engine/diff'
import type { DiffOptions, DiffResult } from '@/types/domain'

/**
 * Progress event types
 */
export type ProgressEvent = {
  type: 'start' | 'progress' | 'done' | 'error' | 'cancelled'
  jobId?: string
  progress?: number
  result?: DiffResult
  error?: string
}

/**
 * Progress callback type
 */
export type ProgressCallback = (event: ProgressEvent) => void

/**
 * Diff computation result
 */
export interface DiffComputationResult {
  jobId: string
  result: DiffResult
  cancelled: boolean
}

/**
 * Configuration for the diff adapter
 */
export interface DiffAdapterConfig {
  /** Maximum input size to use in-thread computation (in bytes) */
  maxInThreadSize: number
  /** Whether to use worker by default */
  useWorker: boolean
  /** Progress callback */
  onProgress?: ProgressCallback
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: DiffAdapterConfig = {
  maxInThreadSize: 1024 * 1024, // 1MB
  useWorker: true,
  onProgress: undefined
}

/**
 * Client adapter for diff computations with progress events
 */
export class DiffAdapter {
  private workerManager: DiffWorkerManager
  private config: DiffAdapterConfig
  private activeJobs = new Map<string, { cancelled: boolean }>()

  constructor(config: Partial<DiffAdapterConfig> = {}) {
    this.workerManager = new DiffWorkerManager()
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Initialize the adapter
   */
  async initialize(): Promise<void> {
    if (this.config.useWorker) {
      try {
        await this.workerManager.initialize()
      } catch (error) {
        console.warn('Failed to initialize worker, falling back to in-thread computation:', error)
        this.config.useWorker = false
      }
    }
  }

  /**
   * Estimate the size of input data in bytes
   */
  private estimateInputSize(a: unknown, b: unknown): number {
    try {
      const aStr = JSON.stringify(a)
      const bStr = JSON.stringify(b)
      return new Blob([aStr, bStr]).size
    } catch {
      // If JSON.stringify fails, estimate conservatively
      return 1024 * 1024 * 2 // 2MB
    }
  }

  /**
   * Check if input is small enough for in-thread computation
   */
  private shouldUseInThread(a: unknown, b: unknown): boolean {
    if (!this.config.useWorker) {
      return true
    }

    const size = this.estimateInputSize(a, b)
    return size <= this.config.maxInThreadSize
  }

  /**
   * Compute diff with progress events
   */
  async computeDiff(
    a: unknown,
    b: unknown,
    options: DiffOptions,
    jobId?: string
  ): Promise<DiffComputationResult> {
    const actualJobId = jobId || `diff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Track this job
    this.activeJobs.set(actualJobId, { cancelled: false })

    try {
      // Emit start event
      this.emitProgress({
        type: 'start',
        jobId: actualJobId
      })

      // Check if we should use in-thread computation
      if (this.shouldUseInThread(a, b)) {
        const result = await this.computeInThread(a, b, options, actualJobId)
        this.activeJobs.delete(actualJobId)
        return result
      } else {
        const result = await this.computeInWorker(a, b, options, actualJobId)
        this.activeJobs.delete(actualJobId)
        return result
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      this.emitProgress({
        type: 'error',
        jobId: actualJobId,
        error: errorMessage
      })

      this.activeJobs.delete(actualJobId)
      throw error
    }
  }

  /**
   * Compute diff in the main thread
   */
  private async computeInThread(
    a: unknown,
    b: unknown,
    options: DiffOptions,
    jobId: string
  ): Promise<DiffComputationResult> {
    // Check if job was cancelled
    if (this.activeJobs.get(jobId)?.cancelled) {
      this.emitProgress({
        type: 'cancelled',
        jobId
      })
      return { jobId, result: null as any, cancelled: true }
    }

    // Simulate progress for in-thread computation
    this.emitProgress({
      type: 'progress',
      jobId,
      progress: 25
    })

    // Check cancellation again
    if (this.activeJobs.get(jobId)?.cancelled) {
      this.emitProgress({
        type: 'cancelled',
        jobId
      })
      return { jobId, result: null as any, cancelled: true }
    }

    this.emitProgress({
      type: 'progress',
      jobId,
      progress: 75
    })

    // Perform the actual computation
    const result = computeJsonDiff(a, b, options)

    // Check cancellation one more time
    if (this.activeJobs.get(jobId)?.cancelled) {
      this.emitProgress({
        type: 'cancelled',
        jobId
      })
      return { jobId, result: null as any, cancelled: true }
    }

    // Emit completion
    this.emitProgress({
      type: 'progress',
      jobId,
      progress: 100
    })

    this.emitProgress({
      type: 'done',
      jobId,
      result
    })

    return { jobId, result, cancelled: false }
  }

  /**
   * Compute diff in worker
   */
  private async computeInWorker(
    a: unknown,
    b: unknown,
    options: DiffOptions,
    jobId: string
  ): Promise<DiffComputationResult> {
    // Check if job was cancelled before starting
    if (this.activeJobs.get(jobId)?.cancelled) {
      this.emitProgress({
        type: 'cancelled',
        jobId
      })
      return { jobId, result: null as any, cancelled: true }
    }

    // Submit job to worker
    const workerJobId = await this.workerManager.computeJsonDiff(
      a,
      b,
      options,
      (progress) => {
        // Check if job was cancelled
        if (this.activeJobs.get(jobId)?.cancelled) {
          this.workerManager.cancelJob(workerJobId)
          return
        }

        this.emitProgress({
          type: 'progress',
          jobId,
          progress
        })
      }
    )

    // Poll for job completion
    while (true) {
      // Check if job was cancelled
      if (this.activeJobs.get(jobId)?.cancelled) {
        await this.workerManager.cancelJob(workerJobId)
        this.emitProgress({
          type: 'cancelled',
          jobId
        })
        return { jobId, result: null as any, cancelled: true }
      }

      // Get job status
      const status = await this.workerManager.getJobStatus(workerJobId)
      
      if (!status) {
        throw new Error('Job not found')
      }

      if (status.status === 'completed') {
        this.emitProgress({
          type: 'done',
          jobId,
          result: status.result
        })
        return { jobId, result: status.result!, cancelled: false }
      }

      if (status.status === 'error') {
        throw new Error(status.error || 'Unknown error')
      }

      if (status.status === 'cancelled') {
        this.emitProgress({
          type: 'cancelled',
          jobId
        })
        return { jobId, result: null as any, cancelled: true }
      }

      // Wait a bit before polling again
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  /**
   * Cancel a job
   */
  cancelJob(jobId: string): boolean {
    const job = this.activeJobs.get(jobId)
    if (job) {
      job.cancelled = true
      return true
    }
    return false
  }

  /**
   * Cancel all active jobs
   */
  cancelAllJobs(): void {
    for (const [jobId] of Array.from(this.activeJobs.entries())) {
      this.cancelJob(jobId)
    }
  }

  /**
   * Get active job count
   */
  getActiveJobCount(): number {
    return this.activeJobs.size
  }

  /**
   * Check if worker is available
   */
  isWorkerAvailable(): boolean {
    return this.workerManager.isWorkerAvailable()
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<any> {
    return this.workerManager.getQueueStats()
  }

  /**
   * Emit progress event
   */
  private emitProgress(event: ProgressEvent): void {
    if (this.config.onProgress) {
      this.config.onProgress(event)
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.cancelAllJobs()
    this.workerManager.terminate()
  }
}

/**
 * Create a diff adapter with default configuration
 */
export function createDiffAdapter(config?: Partial<DiffAdapterConfig>): DiffAdapter {
  return new DiffAdapter(config)
}
