import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || 'vaaris_jwt_secret_secure_key_2026_production_grade'
const COOKIE_NAME = 'vaaris_session'

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [
  'https://virasat-theta.vercel.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]

const PUBLIC_PATHS = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/nominee',
  '/nominee/login',
  '/terms',
  '/privacy',
  '/disclaimer',
  '/legal',
  '/beta',
  '/pricing',
  '/recovery',
  '/recovery/cancel',
  '/checkin',
  '/checkin/confirm',
  '/executor',
  '/delivery',
  '/impact',
]

async function verifyToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, new TextEncoder().encode(JWT_SECRET))
    return true
  } catch {
    return false
  }
}

function isOriginAllowed(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return true
  return ALLOWED_ORIGINS.includes(origin)
}

function setCorsHeaders(request: NextRequest, response: NextResponse): NextResponse {
  const origin = request.headers.get('origin')
  if (!origin) return response

  response.headers.set('Access-Control-Allow-Origin', origin)
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set('Access-Control-Max-Age', '86400')
  return response
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/_next/static') || pathname.startsWith('/_next/image') || pathname === '/favicon.ico') {
    return NextResponse.next()
  }

  if (pathname.startsWith('/api/')) {
    if (!isOriginAllowed(request)) {
      return new NextResponse('Origin not allowed', { status: 403 })
    }

    if (request.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 204 })
      return setCorsHeaders(request, response)
    }

    const response = NextResponse.next()
    return setCorsHeaders(request, response)
  }

  const isPublic = PUBLIC_PATHS.some(path => {
    if (pathname === path) return true
    if (path.endsWith('/')) return pathname.startsWith(path)
    return pathname.startsWith(path + '/')
  })

  if (isPublic) {
    return NextResponse.next()
  }

  const token = request.cookies.get(COOKIE_NAME)?.value || request.cookies.get('virasat_session')?.value
  if (!token) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  const isValid = await verifyToken(token)
  if (!isValid) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon\\.ico).*)',
}
