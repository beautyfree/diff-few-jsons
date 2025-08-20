import { NextRequest, NextResponse } from 'next/server'
import { computeJsonDiff } from '@/engine/diff'
import type { DiffOptions, DiffResult, DiffNode } from '@/types/domain'

/**
 * Configuration for the diff API
 */
function getApiConfig() {
  return {
    // Enable API only if environment variable is set
    enabled: process.env.ENABLE_DIFF_API === 'true',
    // Maximum payload size (10MB)
    maxPayloadSize: 10 * 1024 * 1024,
    // Maximum chunk size for streaming (64KB)
    chunkSize: 64 * 1024,
    // Request timeout (30 seconds)
    timeout: 30000,
  }
}

/**
 * API request body interface
 */
interface DiffApiRequest {
  a: unknown
  b: unknown
  options?: DiffOptions
}

/**
 * API response chunk interface for streaming
 */
interface DiffApiChunk {
  type: 'start' | 'progress' | 'data' | 'error' | 'end'
  timestamp: string
  payload?: any
}

/**
 * Create a streaming response chunk
 */
function createChunk(type: DiffApiChunk['type'], payload?: any): string {
  const chunk: DiffApiChunk = {
    type,
    timestamp: new Date().toISOString(),
    payload
  }
  return JSON.stringify(chunk) + '\n'
}

/**
 * Validate request size and structure
 */
function validateRequest(body: any): { valid: boolean; error?: string; size?: number } {
  try {
    const bodyStr = JSON.stringify(body)
    const size = Buffer.byteLength(bodyStr, 'utf8')
    
    const config = getApiConfig()
    if (size > config.maxPayloadSize) {
      return {
        valid: false,
        error: `Request payload too large: ${size} bytes (max: ${config.maxPayloadSize} bytes)`,
        size
      }
    }

    if (!body || typeof body !== 'object') {
      return { valid: false, error: 'Invalid request body: must be a JSON object' }
    }

    if (!('a' in body) || !('b' in body)) {
      return { valid: false, error: 'Invalid request body: missing required fields "a" and "b"' }
    }

    return { valid: true, size }
  } catch (error) {
    return { 
      valid: false, 
      error: `Invalid JSON: ${error instanceof Error ? error.message : String(error)}` 
    }
  }
}

/**
 * Serialize diff node tree in chunks to avoid memory issues
 */
function* serializeDiffNodeChunks(node: DiffNode, chunkSize: number): Generator<string> {
  const chunks: string[] = []
  let buffer = ''
  
  function serializeNode(n: DiffNode, depth: number = 0): void {
    const indent = '  '.repeat(depth)
    const nodeData = {
      path: n.path,
      kind: n.kind,
      ...(n.before !== undefined && { before: n.before }),
      ...(n.after !== undefined && { after: n.after }),
      ...(n.meta && { meta: n.meta })
    }
    
    const nodeStr = `${indent}${JSON.stringify(nodeData)}`
    
    if (buffer.length + nodeStr.length > chunkSize) {
      if (buffer.length > 0) {
        chunks.push(buffer)
        buffer = ''
      }
    }
    
    buffer += nodeStr
    
    if (n.children && n.children.length > 0) {
      buffer += ',\n' + indent + '"children": [\n'
      
      for (let i = 0; i < n.children.length; i++) {
        serializeNode(n.children[i], depth + 1)
        if (i < n.children.length - 1) {
          buffer += ',\n'
        }
      }
      
      buffer += '\n' + indent + ']'
    }
  }
  
  serializeNode(node)
  
  if (buffer.length > 0) {
    chunks.push(buffer)
  }
  
  // Yield all chunks
  for (const chunk of chunks) {
    yield chunk
  }
}

/**
 * POST /api/diff - Compute JSON diff with streaming response
 */
export async function POST(request: NextRequest) {
  const config = getApiConfig()
  
  // Check if API is enabled
  if (!config.enabled) {
    return NextResponse.json(
      { error: 'Diff API is not enabled' },
      { status: 503 }
    )
  }

  // Verify HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    if (protocol !== 'https') {
      return NextResponse.json(
        { error: 'HTTPS required in production' },
        { status: 400 }
      )
    }
  }

  try {
    // Parse request body
    const body = await request.json() as DiffApiRequest
    
    // Validate request
    const validation = validateRequest(body)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Create streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send start chunk
          controller.enqueue(
            encoder.encode(createChunk('start', { 
              message: 'Starting diff computation',
              payloadSize: validation.size 
            }))
          )

          // Prepare diff options with defaults
          const options: DiffOptions = {
            arrayStrategy: 'index',
            arrayKeyPath: undefined,
            ignoreRules: [],
            transformRules: [],
            ...body.options
          }

          // Send progress chunk
          controller.enqueue(
            encoder.encode(createChunk('progress', { 
              message: 'Computing diff...',
              progress: 25 
            }))
          )

          // Compute diff
          const startTime = Date.now()
          const result = computeJsonDiff(body.a, body.b, options)
          const computeTime = Date.now() - startTime

          // Send progress chunk
          controller.enqueue(
            encoder.encode(createChunk('progress', { 
              message: 'Serializing result...',
              progress: 75 
            }))
          )

          // Stream result metadata first
          const metadata = {
            versionA: result.versionA,
            versionB: result.versionB,
            optionsKey: result.optionsKey,
            stats: result.stats,
            computeTime,
            meta: {
              apiVersion: '1.0.0',
              chunked: true,
              timestamp: new Date().toISOString()
            }
          }

          controller.enqueue(
            encoder.encode(createChunk('data', { 
              type: 'metadata',
              data: metadata 
            }))
          )

          // Stream diff tree in chunks
          let chunkIndex = 0
          const chunkGenerator = serializeDiffNodeChunks(result.root, config.chunkSize)
          for (const chunk of Array.from(chunkGenerator)) {
            controller.enqueue(
              encoder.encode(createChunk('data', {
                type: 'diff_chunk',
                index: chunkIndex++,
                data: chunk
              }))
            )
          }

          // Send completion chunk
          controller.enqueue(
            encoder.encode(createChunk('end', { 
              message: 'Diff computation completed',
              totalChunks: chunkIndex,
              totalTime: Date.now() - startTime
            }))
          )

        } catch (error) {
          // Send error chunk
          const errorMessage = error instanceof Error ? error.message : String(error)
          controller.enqueue(
            encoder.encode(createChunk('error', { 
              error: errorMessage,
              type: 'computation_error'
            }))
          )
        } finally {
          controller.close()
        }
      },

      cancel() {
        // Handle client disconnect
        console.log('Diff API stream cancelled by client')
      }
    })

    // Return streaming response with proper headers
    return new NextResponse(stream, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      }
    })

  } catch (error) {
    console.error('Diff API error:', error)
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/diff - API information and health check
 */
export async function GET() {
  const config = getApiConfig()
  
  if (!config.enabled) {
    return NextResponse.json(
      { 
        enabled: false,
        message: 'Diff API is not enabled. Set ENABLE_DIFF_API=true to enable.'
      },
      { status: 503 }
    )
  }

  return NextResponse.json({
    enabled: true,
    version: '1.0.0',
    limits: {
      maxPayloadSize: config.maxPayloadSize,
      chunkSize: config.chunkSize,
      timeout: config.timeout
    },
    features: [
      'streaming_response',
      'chunked_serialization',
      'size_validation',
      'https_enforcement',
      'progress_reporting'
    ],
    usage: {
      endpoint: '/api/diff',
      method: 'POST',
      contentType: 'application/json',
      responseType: 'application/x-ndjson'
    }
  })
}

/**
 * OPTIONS /api/diff - CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    }
  })
}
