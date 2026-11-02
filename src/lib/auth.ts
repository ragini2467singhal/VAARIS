import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { AuthUser } from '@/types'

const JWT_SECRET = process.env.JWT_SECRET || 'vaaris_jwt_secret_secure_key_2026_production_grade'
const COOKIE_NAME = 'vaaris_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

// ─── PASSWORD ────────────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// ─── JWT ─────────────────────────────────────────────────────────────────────

export function signToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser
  } catch {
    return null
  }
}

// ─── COOKIES ─────────────────────────────────────────────────────────────────

export function setAuthCookie(token: string): void {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })
}

export function getAuthCookie(): string | undefined {
  return cookies().get(COOKIE_NAME)?.value || cookies().get('virasat_session')?.value
}

export function clearAuthCookie(): void {
  cookies().delete(COOKIE_NAME)
  cookies().delete('virasat_session')
}

// ─── GET CURRENT USER ────────────────────────────────────────────────────────

export function getCurrentUser(): AuthUser | null {
  const token = getAuthCookie()
  if (!token) return null
  return verifyToken(token)
}

// ─── MIDDLEWARE HELPER ────────────────────────────────────────────────────────

export function requireAuth(): AuthUser {
  const user = getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}
