import { NextResponse } from 'next/server'

const USER = process.env.ADMIN_USER
const PASS = process.env.ADMIN_PASS

export function middleware(req: Request) {
  const url = new URL(req.url)

  // Sadece /admin altında çalışsın
  if (!url.pathname.startsWith('/admin')) return NextResponse.next()

  // Env yoksa koruma devre dışı (yanlış konfigürasyonda site kitlenmesin)
  if (!USER || !PASS) return NextResponse.next()

  const auth = req.headers.get('authorization') || ''
  if (!auth.startsWith('Basic ')) {
    return new NextResponse('Auth required', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Admin"' },
    })
  }

  const [u, p] = Buffer.from(auth.slice(6), 'base64').toString('utf8').split(':')
  if (u !== USER || p !== PASS) return new NextResponse('Forbidden', { status: 403 })
  return NextResponse.next()
}

export const config = { matcher: ['/admin/:path*'] }
