import { NextResponse } from 'next/server'

export function ok<T>(data: T, message?: string) {
  return NextResponse.json({ success: true, data, message }, { status: 200 })
}

export function created<T>(data: T, message?: string) {
  return NextResponse.json({ success: true, data, message }, { status: 201 })
}

export function badRequest(error: string) {
  return NextResponse.json({ success: false, error }, { status: 400 })
}

export function unauthorized(error = 'Unauthorized') {
  return NextResponse.json({ success: false, error }, { status: 401 })
}

export function forbidden(error = 'Forbidden') {
  return NextResponse.json({ success: false, error }, { status: 403 })
}

export function notFound(error = 'Not found') {
  return NextResponse.json({ success: false, error }, { status: 404 })
}

export function serverError(error: unknown) {
  console.error('Server error:', error)
  const message = error instanceof Error ? error.message : 'Internal server error'
  return NextResponse.json({ success: false, error: message }, { status: 500 })
}

export function withAuth(handler: Function) {
  return async (req: Request, context: unknown) => {
    try {
      const { getCurrentUser } = await import('@/lib/auth')
      const user = getCurrentUser()
      if (!user) return unauthorized()
      return handler(req, context, user)
    } catch (err) {
      return serverError(err)
    }
  }
}
