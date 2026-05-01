import { NextResponse } from 'next/server'

export async function middleware(req: Request) {
  const url = new URL(req.url)

  // Sadece /admin altında koruma uygula
  if (!url.pathname.startsWith('/admin')) return NextResponse.next()

  // Login sayfasına ve login API'sine kısıt uygulama
  if (url.pathname === '/admin/login' || url.pathname.startsWith('/api/admin/login')) {
    return NextResponse.next()
  }

  // Cookie kontrolü
  const cookie = (req.headers.get('cookie') || '')
    .split(';')
    .map(s => s.trim())
    .find(s => s.startsWith('admin_ok='))

  const ok = cookie?.split('=')[1] === '1'
  if (ok) return NextResponse.next()

  // Yetkisi yoksa login sayfasına yönlendir
  url.pathname = '/admin/login'
  return NextResponse.redirect(url)
}

// Yalnızca /admin altı
export const config = { matcher: ['/admin/:path*'] }
