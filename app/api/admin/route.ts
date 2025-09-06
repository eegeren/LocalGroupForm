import { NextResponse } from 'next/server'
import prisma from '../../../lib/prisma'

/**
 * GET /api/admin?q=&gender=&workType=&sort=&page=&pageSize=
 * - q: ad/telefon/pozisyon araması (case-insensitive)
 * - gender: 'male' | 'female' | ...
 * - workType: 'sabit' | 'sezonluk' | 'gunluk' | 'parttime'
 * - sort: 'new' | 'old'
 * - page, pageSize: sayfalama
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const q = (url.searchParams.get('q') || '').trim()
    const gender = (url.searchParams.get('gender') || '').trim()
    const workType = (url.searchParams.get('workType') || '').trim()
    const sort = (url.searchParams.get('sort') || 'new').trim()
    const page = Math.max(1, Number(url.searchParams.get('page') || '1'))
    const pageSize = Math.min(200, Math.max(1, Number(url.searchParams.get('pageSize') || '50')))
    const skip = (page - 1) * pageSize

    const where: any = {}

    if (q) {
      where.OR = [
        { fullName: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { positionApplied: { contains: q, mode: 'insensitive' } },
      ]
    }

    if (gender) where.gender = gender

    // DB'de 'employmentType' var; bazı kurulumlarda 'workType' kolonu da olabilir.
    if (workType) {
      // her iki senaryoyu da destekle
      where.AND = [
        {
          OR: [
            { employmentType: workType },
            { workType: workType },
          ],
        },
      ]
    }

    const total = await prisma.submission.count({ where })

    const itemsRaw = await prisma.submission.findMany({
      where,
      orderBy: { createdAt: sort === 'old' ? 'asc' : 'desc' },
      skip,
      take: pageSize,
      select: {
        id: true,
        fullName: true,
        phone: true,
        positionApplied: true,
        gender: true,
        createdAt: true,
        employmentType: true,
        workType: true,
      },
    })

    // UI için tek "type" alanı döndür (employmentType || workType)
    const items = itemsRaw.map((r) => ({
      ...r,
      type: r.employmentType ?? r.workType ?? null,
    }))

    return NextResponse.json({ ok: true, total, items, page, pageSize })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'admin_list_failed' }, { status: 500 })
  }
}
