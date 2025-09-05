import { NextResponse } from 'next/server'
import prisma from '../../../lib/prisma'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q        = (searchParams.get('q') || '').trim().toLowerCase()
    const gender   = searchParams.get('gender') || ''
    const workType = searchParams.get('workType') || ''
    const status   = searchParams.get('status') || ''
    const archived = (searchParams.get('archived') || 'false') === 'true'
    const order    = (searchParams.get('order') || 'desc') as 'asc'|'desc'
    const from     = searchParams.get('from')
    const to       = searchParams.get('to')

    const page     = Math.max(1, Number(searchParams.get('page') || 1))
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') || 20)))
    const skip     = (page - 1) * pageSize
    const take     = pageSize

    const where: any = { archived }
    if (gender)   where.gender = gender
    if (workType) where.workType = workType
    if (status)   where.status = status
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from + 'T00:00:00Z')
      if (to)   where.createdAt.lte = new Date(to   + 'T23:59:59Z')
    }
    if (q) {
      where.OR = [
        { fullName:        { contains: q, mode: 'insensitive' } },
        { phone:           { contains: q, mode: 'insensitive' } },
        { positionApplied: { contains: q, mode: 'insensitive' } },
        { message:         { contains: q, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        orderBy: { createdAt: order },
        skip, take
      }),
      prisma.submission.count({ where })
    ])

    return NextResponse.json({ ok: true, items, total })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'server error' }, { status: 500 })
  }
}
