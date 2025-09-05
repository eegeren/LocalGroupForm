export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
export async function GET() {
  const res = NextResponse.redirect(new URL('/admin/login', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'))
  res.headers.append('Set-Cookie', 'admin_ok=; Path=/admin; HttpOnly; SameSite=Lax; Secure; Max-Age=0')
  return res
}
