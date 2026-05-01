export const runtime = 'nodejs'

import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({}))
  const PASS = process.env.ADMIN_PASS || 'supersecret'

  if (!password || password !== PASS) {
    return NextResponse.json({ ok: false, error: 'Geçersiz parola' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  // Sadece /admin altında geçerli bir oturum çerezi bırak
  res.headers.append('Set-Cookie', [
    `admin_ok=1`,
    `Path=/admin`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Secure`,
    `Max-Age=${60 * 60 * 8}` // 8 saat
  ].join('; '))

  return res
}
