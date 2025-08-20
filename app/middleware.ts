import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware to enforce security headers and consent-based API access
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Add security headers
  const securityHeaders = {
    // Content Security Policy - already set in next.config.js, but ensure it's applied
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    // Additional security headers
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
  }

  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Handle API consent for /api/diff endpoint
  if (request.nextUrl.pathname === '/api/diff') {
    // Check if API is enabled via environment variable
    const apiEnabled = process.env.ENABLE_DIFF_API === 'true'
    
    if (!apiEnabled) {
      return NextResponse.json(
        { 
          error: 'Diff API is not enabled',
          message: 'Server-side diffing is disabled for privacy. All processing happens locally in your browser.',
          code: 'API_DISABLED'
        },
        { status: 503 }
      )
    }

    // Check for consent header (custom header indicating user consent)
    const consentHeader = request.headers.get('x-user-consent')
    const hasConsent = consentHeader === 'true'
    
    if (!hasConsent) {
      return NextResponse.json(
        { 
          error: 'User consent required',
          message: 'Explicit consent is required to send data to the server for processing.',
          code: 'CONSENT_REQUIRED',
          privacy: {
            dataRetention: 'none',
            dataSharing: 'none',
            processing: 'server-side'
          }
        },
        { status: 403 }
      )
    }

    // Verify HTTPS in production
    if (process.env.NODE_ENV === 'production') {
      const protocol = request.headers.get('x-forwarded-proto') || 'http'
      if (protocol !== 'https') {
        return NextResponse.json(
          { 
            error: 'HTTPS required',
            message: 'Secure connection required for server-side processing.',
            code: 'HTTPS_REQUIRED'
          },
          { status: 400 }
        )
      }
    }

    // Add consent verification header to the request
    response.headers.set('x-consent-verified', 'true')
  }

  return response
}

/**
 * Configure which paths the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
