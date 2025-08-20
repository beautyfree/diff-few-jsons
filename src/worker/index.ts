import { wrap } from 'comlink'
import type { DiffWorkerAPI } from './diff.worker'

/**
 * Worker manager for diff computations
 */
export class DiffWorkerManager {
  private worker: Worker | null = null
  private workerApi: any = null // Comlink wraps the API and changes types
  private isSupported: boolean

  constructor() {
    this.isSupported = typeof Worker !== 'undefined' && typeof window !== 'undefined'
  }

  /**
   * Initialize the worker
   */
  async initialize(): Promise<void> {
    if (!this.isSupported) {
      throw new Error('Web Workers are not supported in this environment')
    }

    if (this.worker) {
      return // Already initialized
    }

    try {
      // Create the worker
      this.worker = new Worker(
        new URL('./diff.worker.ts', import.meta.url),
        { type: 'module' }
      )

      // Wrap the worker with Comlink
      this.workerApi = wrap<DiffWorkerAPI>(this.worker)
    } catch (error) {
      throw new Error(`Failed to initialize worker: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Check if worker is available
   */
  isWorkerAvailable(): boolean {
    return this.isSupported && this.workerApi !== null
  }

  /**
   * Compute diff using worker
   */
  async computeJsonDiff(
    a: unknown,
    b: unknown,
    options: any,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    if (!this.workerApi) {
      throw new Error('Worker not initialized. Call initialize() first.')
    }

    return this.workerApi.computeJsonDiff(a, b, options, onProgress)
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    if (!this.workerApi) {
      return false
    }

    return await this.workerApi.cancelJob(jobId)
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<any> {
    if (!this.workerApi) {
      return undefined
    }

    return this.workerApi.getJobStatus(jobId)
  }

  /**
   * Get all job statuses
   */
  async getAllJobStatuses(): Promise<any[]> {
    if (!this.workerApi) {
      return []
    }

    return this.workerApi.getAllJobStatuses()
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<any> {
    if (!this.workerApi) {
      return {
        totalJobs: 0,
        runningJobs: 0,
        maxConcurrentJobs: 0,
        maxQueueSize: 0
      }
    }

    return this.workerApi.getQueueStats()
  }

  /**
   * Compute diff directly (for small inputs)
   */
  async computeJsonDiffDirect(a: unknown, b: unknown, options: any): Promise<any> {
    if (!this.workerApi) {
      throw new Error('Worker not initialized. Call initialize() first.')
    }

    return this.workerApi.computeJsonDiffDirect(a, b, options)
  }

  /**
   * Terminate the worker
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
      this.workerApi = null
    }
  }
}

// Export types
export type { DiffWorkerAPI } from './diff.worker'
