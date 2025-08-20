/**
 * Consent management utilities for API calls
 */

export interface ConsentState {
  serverProcessing: boolean
  dataRetention: boolean
  analytics: boolean
  timestamp: string
}

/**
 * Get current consent state from localStorage
 */
export function getConsentState(): ConsentState | null {
  try {
    const saved = localStorage.getItem('user-consent')
    if (!saved) return null
    
    const parsed = JSON.parse(saved) as ConsentState
    return parsed
  } catch (error) {
    console.warn('Failed to parse consent state:', error)
    return null
  }
}

/**
 * Check if server processing is consented
 */
export function hasServerProcessingConsent(): boolean {
  const consent = getConsentState()
  return consent?.serverProcessing === true
}

/**
 * Check if data retention is consented
 */
export function hasDataRetentionConsent(): boolean {
  const consent = getConsentState()
  return consent?.dataRetention === true
}

/**
 * Check if analytics is consented
 */
export function hasAnalyticsConsent(): boolean {
  const consent = getConsentState()
  return consent?.analytics === true
}

/**
 * Create headers for API calls based on consent
 */
export function createConsentHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Add consent header if server processing is enabled
  if (hasServerProcessingConsent()) {
    headers['x-user-consent'] = 'true'
  }

  return headers
}

/**
 * Make a consent-aware API call
 */
export async function makeConsentAwareApiCall<T>(
  url: string,
  data: any,
  options: RequestInit = {}
): Promise<T> {
  const consent = getConsentState()
  
  // If no consent for server processing, throw error
  if (!consent?.serverProcessing) {
    throw new Error('Server processing consent required. Please enable server-side processing in privacy settings.')
  }

  const headers = {
    ...createConsentHeaders(),
    ...options.headers,
  }

  const response = await fetch(url, {
    ...options,
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(errorData.error || `API call failed: ${response.status}`)
  }

  return response.json()
}

/**
 * Check if API is available (enabled and consented)
 */
export function isApiAvailable(): boolean {
  // Check if API is enabled via environment (this would be set by the server)
  // For now, we'll assume it's enabled if consent is given
  return hasServerProcessingConsent()
}

/**
 * Get privacy status information
 */
export function getPrivacyStatus() {
  const consent = getConsentState()
  
  return {
    serverProcessing: consent?.serverProcessing || false,
    dataRetention: consent?.dataRetention || false,
    analytics: consent?.analytics || false,
    apiAvailable: isApiAvailable(),
    lastUpdated: consent?.timestamp || null,
  }
}

/**
 * Validate consent state
 */
export function validateConsentState(consent: any): consent is ConsentState {
  return (
    consent &&
    typeof consent === 'object' &&
    typeof consent.serverProcessing === 'boolean' &&
    typeof consent.dataRetention === 'boolean' &&
    typeof consent.analytics === 'boolean' &&
    typeof consent.timestamp === 'string'
  )
}
