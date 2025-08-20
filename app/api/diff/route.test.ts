import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST, OPTIONS } from './route'

// Mock the diff engine
vi.mock('@/engine/diff', () => ({
  computeJsonDiff: vi.fn().mockImplementation((a, b, options) => ({
    versionA: 'test-a',
    versionB: 'test-b',
    optionsKey: 'test-options',
    root: {
      path: '',
      kind: 'modified' as const,
      children: [
        {
          path: 'name',
          kind: 'modified' as const,
          before: 'John',
          after: 'Jane'
        }
      ]
    },
    stats: {
      nodes: 2,
      computeMs: 10
    }
  }))
}))

// Helper to create NextRequest
function createRequest(
  method: string,
  body?: any,
  headers: Record<string, string> = {}
): NextRequest {
  const url = 'https://example.com/api/diff'
  const init: any = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  }

  if (body) {
    init.body = JSON.stringify(body)
  }

  return new NextRequest(url, init)
}

// Helper to parse NDJSON stream
async function parseNDJSONStream(response: Response): Promise<any[]> {
  const text = await response.text()
  return text
    .split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line))
}

describe('/api/diff', () => {
  let originalEnv: string | undefined

  beforeEach(() => {
    originalEnv = process.env.ENABLE_DIFF_API
    vi.clearAllMocks()
  })

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.ENABLE_DIFF_API = originalEnv
    } else {
      delete process.env.ENABLE_DIFF_API
    }
  })

  describe('GET /api/diff', () => {
    it('should return API info when enabled', async () => {
      process.env.ENABLE_DIFF_API = 'true'

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.enabled).toBe(true)
      expect(data.version).toBe('1.0.0')
      expect(data.limits).toBeDefined()
      expect(data.features).toContain('streaming_response')
      expect(data.usage).toBeDefined()
    })

    it('should return disabled status when not enabled', async () => {
      process.env.ENABLE_DIFF_API = 'false'

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.enabled).toBe(false)
      expect(data.message).toContain('not enabled')
    })

    it('should return disabled status when env var not set', async () => {
      delete process.env.ENABLE_DIFF_API

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.enabled).toBe(false)
    })
  })

  describe('OPTIONS /api/diff', () => {
    it('should return CORS headers', async () => {
      const response = await OPTIONS()

      expect(response.status).toBe(200)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, OPTIONS')
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization')
      expect(response.headers.get('Access-Control-Max-Age')).toBe('86400')
    })
  })

  describe('POST /api/diff', () => {
    beforeEach(() => {
      process.env.ENABLE_DIFF_API = 'true'
    })

    it('should return error when API is disabled', async () => {
      process.env.ENABLE_DIFF_API = 'false'

      const request = createRequest('POST', { a: {}, b: {} })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.error).toBe('Diff API is not enabled')
    })

    it('should validate request body structure', async () => {
      const request = createRequest('POST', { invalid: 'body' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('missing required fields')
    })

    it('should validate payload size limits', async () => {
      // Create a large payload that exceeds the limit
      const largeObject = {
        data: 'x'.repeat(11 * 1024 * 1024) // 11MB
      }

      const request = createRequest('POST', { a: largeObject, b: {} })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Request payload too large')
    })

    it('should handle invalid JSON gracefully', async () => {
      const url = 'https://example.com/api/diff'
      const request = new NextRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{ invalid json'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid JSON in request body')
    })

    it('should compute diff and return streaming response', async () => {
      const requestBody = {
        a: { name: 'John', age: 30 },
        b: { name: 'Jane', age: 30 },
        options: {
          arrayStrategy: 'index' as const,
          ignoreRules: [],
          transformRules: []
        }
      }

      const request = createRequest('POST', requestBody)
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('application/x-ndjson')
      expect(response.headers.get('Cache-Control')).toBe('no-cache')
      expect(response.headers.get('Connection')).toBe('keep-alive')

      // Parse streaming response
      const chunks = await parseNDJSONStream(response)

      // Verify chunk structure
      expect(chunks.length).toBeGreaterThan(0)

      // Find specific chunk types
      const startChunk = chunks.find(c => c.type === 'start')
      const progressChunks = chunks.filter(c => c.type === 'progress')
      const dataChunks = chunks.filter(c => c.type === 'data')
      const endChunk = chunks.find(c => c.type === 'end')

      expect(startChunk).toBeDefined()
      expect(startChunk.payload.message).toBe('Starting diff computation')
      expect(startChunk.payload.payloadSize).toBeGreaterThan(0)

      expect(progressChunks.length).toBeGreaterThanOrEqual(1)
      expect(progressChunks[0].payload.progress).toBe(25)

      expect(dataChunks.length).toBeGreaterThanOrEqual(1)
      const metadataChunk = dataChunks.find(c => c.payload.type === 'metadata')
      expect(metadataChunk).toBeDefined()
      expect(metadataChunk.payload.data.versionA).toBe('test-a')
      expect(metadataChunk.payload.data.versionB).toBe('test-b')
      expect(metadataChunk.payload.data.stats).toBeDefined()

      expect(endChunk).toBeDefined()
      expect(endChunk.payload.message).toBe('Diff computation completed')
      expect(endChunk.payload.totalTime).toBeGreaterThanOrEqual(0)

      // Verify all chunks have timestamps
      chunks.forEach(chunk => {
        expect(chunk.timestamp).toBeDefined()
        expect(new Date(chunk.timestamp).getTime()).toBeGreaterThan(0)
      })
    })

    it('should handle computation errors gracefully', async () => {
      // Mock the diff engine to throw an error
      const { computeJsonDiff } = await import('@/engine/diff')
      vi.mocked(computeJsonDiff).mockImplementationOnce(() => {
        throw new Error('Computation failed')
      })

      const request = createRequest('POST', { a: {}, b: {} })
      const response = await POST(request)

      expect(response.status).toBe(200) // Stream starts successfully
      expect(response.headers.get('Content-Type')).toBe('application/x-ndjson')

      const chunks = await parseNDJSONStream(response)
      const errorChunk = chunks.find(c => c.type === 'error')

      expect(errorChunk).toBeDefined()
      expect(errorChunk.payload.error).toBe('Computation failed')
      expect(errorChunk.payload.type).toBe('computation_error')
    })

    it('should enforce HTTPS in production', async () => {
      const originalNodeEnv = process.env.NODE_ENV
      ;(process.env as any).NODE_ENV = 'production'

      try {
        const request = createRequest('POST', { a: {}, b: {} }, {
          'x-forwarded-proto': 'http'
        })
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('HTTPS required in production')
      } finally {
        ;(process.env as any).NODE_ENV = originalNodeEnv
      }
    })

    it('should allow HTTP in development', async () => {
      const originalNodeEnv = process.env.NODE_ENV
      ;(process.env as any).NODE_ENV = 'development'

      try {
        const request = createRequest('POST', { a: {}, b: {} })
        const response = await POST(request)

        expect(response.status).toBe(200)
      } finally {
        ;(process.env as any).NODE_ENV = originalNodeEnv
      }
    })

    it('should handle large valid payloads within limits', async () => {
      // Create a payload close to but under the limit (9MB)
      const largeArray = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        data: 'x'.repeat(9000) // ~9KB per item = ~9MB total
      }))

      const request = createRequest('POST', { a: largeArray, b: [] })
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('application/x-ndjson')

      const chunks = await parseNDJSONStream(response)
      const startChunk = chunks.find(c => c.type === 'start')
      
      expect(startChunk).toBeDefined()
      expect(startChunk.payload.payloadSize).toBeGreaterThan(8 * 1024 * 1024) // > 8MB
      expect(startChunk.payload.payloadSize).toBeLessThan(10 * 1024 * 1024) // < 10MB
    })

    it('should handle empty objects', async () => {
      const request = createRequest('POST', { a: {}, b: {} })
      const response = await POST(request)

      expect(response.status).toBe(200)
      
      const chunks = await parseNDJSONStream(response)
      const endChunk = chunks.find(c => c.type === 'end')
      
      expect(endChunk).toBeDefined()
      expect(endChunk.payload.totalChunks).toBeGreaterThanOrEqual(0)
    })

    it('should include proper diff options in computation', async () => {
      const customOptions = {
        arrayStrategy: 'keyed' as const,
        arrayKeyPath: 'id',
        ignoreRules: [
          {
            id: 'ignore-test',
            type: 'keyPath' as const,
            pattern: 'ignored',
            enabled: true
          }
        ],
        transformRules: [
          {
            id: 'transform-test',
            type: 'lowercase' as const,
            targetPath: 'name',
            enabled: true
          }
        ]
      }

      const request = createRequest('POST', {
        a: { name: 'JOHN', ignored: 'value' },
        b: { name: 'JANE', ignored: 'other' },
        options: customOptions
      })

      const response = await POST(request)
      expect(response.status).toBe(200)

      // Verify computeJsonDiff was called with correct options
      const { computeJsonDiff } = await import('@/engine/diff')
      expect(vi.mocked(computeJsonDiff)).toHaveBeenCalledWith(
        { name: 'JOHN', ignored: 'value' },
        { name: 'JANE', ignored: 'other' },
        expect.objectContaining(customOptions)
      )
    })
  })
})
