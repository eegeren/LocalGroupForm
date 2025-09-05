import { NextResponse } from 'next/server'
import prisma from '../../../lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const fullName = String(body.fullName ?? '').trim()
    const message  = String(body.message  ?? '').trim()
    const consent  = Boolean(body.consent)

    // --- minimum kurallar: ad soyad, mesaj(>=5), KVKK ---
    if (!fullName) {
      return NextResponse.json({ ok: false, error: 'fullName_required' }, { status: 400 })
    }
    if (message.length < 5) {
      return NextResponse.json({ ok: false, error: 'message_too_short' }, { status: 400 })
    }
    if (!consent) {
      return NextResponse.json({ ok: false, error: 'consent_required' }, { status: 400 })
    }

    // opsiyonelleri temizle
    const data: any = {
      fullName,
      message,
      consent: true,

      phone: (body.phone ? String(body.phone).trim() : null) || null,
      gender: body.gender ? String(body.gender) : null,
      positionApplied: body.positionApplied ? String(body.positionApplied).trim() : null,
      workType: body.workType ? String(body.workType) : null,
      // İstersen diğer alanları da burada map’le (address, birthDate vs.)
    }

    const created = await prisma.submission.create({ data })
    return NextResponse.json({ ok: true, id: created.id })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'server_error' }, { status: 500 })
  }
}
