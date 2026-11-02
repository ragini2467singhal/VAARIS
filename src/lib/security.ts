import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getRateLimitIdentifier, RATE_LIMITS } from '@/lib/rateLimit'

export const securityHeaders = (_req: NextRequest, res: NextResponse): NextResponse => {
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-XSS-Protection', '1; mode=block')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  return res
}

export function applySecurityHeaders(res: NextResponse): NextResponse {
  return securityHeaders(new NextRequest('http://localhost'), res)
}

export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  limitKey: keyof typeof RATE_LIMITS = 'SENSITIVE'
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const identifier = getRateLimitIdentifier(req)
    const result = checkRateLimit(identifier, RATE_LIMITS[limitKey])

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000)
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      )
    }

    return handler(req)
  }
}
