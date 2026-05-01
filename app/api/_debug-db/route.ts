export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
export async function GET() {
  const url = process.env.DATABASE_URL || ''
  try {
    const u = new URL(url)
    return NextResponse.json({
      host: u.hostname,
      port: u.port || '5432',
      protocol: u.protocol.replace(':',''),
      provider: 'prisma'
    })
  } catch {
    return NextResponse.json({ host: '(parse-failed)', raw: url ? url.slice(0,20)+'…' : '(empty)' })
  }
}
