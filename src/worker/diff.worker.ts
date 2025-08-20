import { expose } from 'comlink'
import { computeJsonDiff } from '@/engine/diff'
import type { DiffOptions, DiffResult } from '@/types/domain'

/**
 * Job status for tracking diff computation
 */
interface JobStatus {
  id: string
  status: 'pending' | 'running' | 'completed' | 'cancelled' | 'error'
  progress?: number
  result?: DiffResult
  error?: string
  startTime?: number
}

/**
 * Job queue for managing diff computations
 */
class DiffJobQueue {
  private jobs = new Map<string, JobStatus>()
  private runningJobs = new Set<string>()
  private maxConcurrentJobs = 2
  private maxQueueSize = 10
  private jobCounter = 0

  /**
   * Generate a unique job ID
   */
  private generateJobId(): string {
    return `job_${Date.now()}_${++this.jobCounter}`
  }

  /**
   * Add a new job to the queue
   */
  async addJob(
    a: unknown,
    b: unknown,
    options: DiffOptions,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    const jobId = this.generateJobId()
    
    // Check queue size limit
    if (this.jobs.size >= this.maxQueueSize) {
      throw new Error('Job queue is full. Please wait for some jobs to complete.')
    }

    // Create job status
    const job: JobStatus = {
      id: jobId,
      status: 'pending'
    }
    
    this.jobs.set(jobId, job)
    
    // Start processing if we have capacity
    this.processNextJob(jobId, a, b, options, onProgress)
    
    return jobId
  }

  /**
   * Process the next job in the queue
   */
  private async processNextJob(
    jobId: string,
    a: unknown,
    b: unknown,
    options: DiffOptions,
    onProgress?: (progress: number) => void
  ) {
    const job = this.jobs.get(jobId)
    if (!job) return

    // Check if we can start this job
    if (this.runningJobs.size >= this.maxConcurrentJobs) {
      // Wait for a slot to become available
      await this.waitForSlot()
    }

    // Check if job was cancelled while waiting
    if (job.status === 'cancelled') {
      this.cleanupJob(jobId)
      return
    }

    // Start the job
    job.status = 'running'
    job.startTime = Date.now()
    this.runningJobs.add(jobId)

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        if (job.status === 'running' && onProgress) {
          const elapsed = Date.now() - (job.startTime || 0)
          const progress = Math.min(90, Math.floor(elapsed / 100)) // Simulate progress
          job.progress = progress
          onProgress(progress)
        }
      }, 100)

      // Compute the diff
      const result = await this.computeDiffWithProgress(a, b, options, onProgress)
      
      clearInterval(progressInterval)
      
      // Check if job was cancelled during computation
      if (job.status as string === 'cancelled') {
        this.cleanupJob(jobId)
        return
      }

      // Complete the job
      job.status = 'completed'
      job.result = result
      job.progress = 100
      if (onProgress) onProgress(100)

    } catch (error) {
      if ((job.status as string) !== 'cancelled') {
        job.status = 'error'
        job.error = error instanceof Error ? error.message : String(error)
      }
    } finally {
      this.runningJobs.delete(jobId)
      this.cleanupJob(jobId)
      this.processQueue()
    }
  }

  /**
   * Compute diff with progress updates
   */
  private async computeDiffWithProgress(
    a: unknown,
    b: unknown,
    options: DiffOptions,
    onProgress?: (progress: number) => void
  ): Promise<DiffResult> {
    // For now, we'll use a simple timeout to simulate progress
    // In a real implementation, you might want to break down the computation
    // into smaller chunks and report progress for each chunk
    
    return new Promise((resolve, reject) => {
      // Use setTimeout to make the computation asynchronous
      setTimeout(() => {
        try {
          const result = computeJsonDiff(a, b, options)
          resolve(result)
        } catch (error) {
          reject(error)
        }
      }, 0)
    })
  }

  /**
   * Wait for a job slot to become available
   */
  private async waitForSlot(): Promise<void> {
    return new Promise((resolve) => {
      const checkSlot = () => {
        if (this.runningJobs.size < this.maxConcurrentJobs) {
          resolve()
        } else {
          setTimeout(checkSlot, 10)
        }
      }
      checkSlot()
    })
  }

  /**
   * Process the next job in the queue
   */
  private processQueue() {
    // Find the next pending job
    for (const [jobId, job] of Array.from(this.jobs.entries())) {
      if (job.status === 'pending' && !this.runningJobs.has(jobId)) {
        // This job is ready to be processed
        // We'll need to store the job parameters somewhere
        // For now, we'll just mark it as ready
        break
      }
    }
  }

  /**
   * Cancel a job
   */
  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId)
    if (!job) return false

    if (job.status === 'pending' || job.status === 'running') {
      job.status = 'cancelled'
      this.runningJobs.delete(jobId)
      this.cleanupJob(jobId)
      return true
    }

    return false
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): JobStatus | undefined {
    return this.jobs.get(jobId)
  }

  /**
   * Get all job statuses
   */
  getAllJobStatuses(): JobStatus[] {
    return Array.from(this.jobs.values())
  }

  /**
   * Clean up completed/cancelled jobs
   */
  private cleanupJob(jobId: string) {
    const job = this.jobs.get(jobId)
    if (job && (job.status === 'completed' || job.status === 'cancelled' || job.status === 'error')) {
      // Keep jobs for a short time to allow status queries
      setTimeout(() => {
        this.jobs.delete(jobId)
      }, 5000) // Keep for 5 seconds
    }
  }

  /**
   * Get queue statistics
   */
  getQueueStats() {
    return {
      totalJobs: this.jobs.size,
      runningJobs: this.runningJobs.size,
      maxConcurrentJobs: this.maxConcurrentJobs,
      maxQueueSize: this.maxQueueSize
    }
  }
}

// Create the job queue instance
const jobQueue = new DiffJobQueue()

// Expose the worker API using Comlink
const workerApi = {
  /**
   * Compute diff with job management
   */
  async computeJsonDiff(
    a: unknown,
    b: unknown,
    options: DiffOptions,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    return jobQueue.addJob(a, b, options, onProgress)
  },

  /**
   * Cancel a job
   */
  cancelJob(jobId: string): boolean {
    return jobQueue.cancelJob(jobId)
  },

  /**
   * Get job status
   */
  getJobStatus(jobId: string): JobStatus | undefined {
    return jobQueue.getJobStatus(jobId)
  },

  /**
   * Get all job statuses
   */
  getAllJobStatuses(): JobStatus[] {
    return jobQueue.getAllJobStatuses()
  },

  /**
   * Get queue statistics
   */
  getQueueStats() {
    return jobQueue.getQueueStats()
  },

  /**
   * Direct diff computation (for small inputs)
   */
  computeJsonDiffDirect(a: unknown, b: unknown, options: DiffOptions): DiffResult {
    return computeJsonDiff(a, b, options)
  }
}

// Expose the API to the main thread
expose(workerApi)

// Type for the exposed API
export type DiffWorkerAPI = typeof workerApi
