import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const item = await prisma.submission.findUnique({
      where: { id: params.id },
      include: { employments: { orderBy: { startDate: 'desc' } } },
    })
    if (!item) return NextResponse.json({ ok:false, error:'not_found' }, { status:404 })
    return NextResponse.json({ ok:true, item })
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e?.message || 'get error' }, { status:500 })
  }
}
