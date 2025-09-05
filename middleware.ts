import { NextResponse } from 'next/server'

const USER = process.env.ADMIN_USER || 'admin'
const PASS = process.env.ADMIN_PASS || 'supersecret'

export function middleware(req: Request) {
  const url = new URL(req.url)
  if (!url.pathname.startsWith('/admin')) return NextResponse.next()

  const auth = req.headers.get('authorization') || ''
  if (!auth.startsWith('Basic ')) {
    return new NextResponse('Auth required', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Admin"' } })
  }

  const [u, p] = Buffer.from(auth.slice(6), 'base64').toString('utf8').split(':')
  if (u !== USER || p !== PASS) return new NextResponse('Forbidden', { status: 403 })

  return NextResponse.next()
}
export const config = { matcher: ['/admin/:path*'] }
