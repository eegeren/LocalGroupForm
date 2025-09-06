import { NextResponse } from 'next/server'
import prisma from '../../../lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Basit zorunlu alan kontrolü
    const fullName = (body.fullName ?? '').trim()
    if (!fullName) {
      return NextResponse.json({ ok: false, error: 'fullName_required' }, { status: 400 })
    }

    // Frontend "workType" gönderiyor; DB kolonun adı "employmentType"
    const employmentType = body.workType ?? body.employmentType ?? null

    // Sadece şemada olan alanları topla (fazlalıkları kırpıyoruz)
    const data: any = {
      fullName,
      phone: body.phone ?? null,
      message: body.message ?? null,
      gender: body.gender ?? null,
      subject: body.subject ?? null,            // opsiyonelse null kalır
      consent: !!body.consent,
      consentAt: body.consent ? new Date() : null,

      birthDate: body.birthDate ?? null,
      address: body.address ?? null,

      positionApplied: body.positionApplied ?? null,
      employmentType,                           // <-- map edilmiş alan
      shiftAvailability: body.shiftAvailability ?? null,

      educationLevel: body.educationLevel ?? null,
      foreignLanguages: body.foreignLanguages ?? null,

      prevCompany: body.prevCompany ?? null,
      prevTitle: body.prevTitle ?? null,
      prevDuration: body.prevDuration ?? null,
      prevReason: body.prevReason ?? null,
    }

    // Boş stringleri null’a çevir (DB daha temiz kalsın)
    for (const k of Object.keys(data)) {
      if (typeof data[k] === 'string' && data[k].trim() === '') data[k] = null
    }

    const created = await prisma.submission.create({ data })
    return NextResponse.json({ ok: true, id: created.id })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? 'create_failed' },
      { status: 500 }
    )
  }
}