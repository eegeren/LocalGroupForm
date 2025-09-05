export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params?.id
    if (!id) return NextResponse.json({ ok: false, error: 'missing id' }, { status: 400 })
    await prisma.submission.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[admin DELETE] error:', e)
    const msg = e?.code === 'P2025' ? 'not found' : (e?.message || 'server-error')
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
