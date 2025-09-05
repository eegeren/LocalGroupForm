export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export async function GET() {
  try {
    const items = await prisma.submission.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ ok: true, items }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e: any) {
    console.error('[admin GET] error:', e)
    return NextResponse.json({ ok: false, error: e?.message || 'server-error' }, { status: 500 })
  }
}
