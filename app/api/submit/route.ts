import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    // --- Content-Type kontrolü ---
    if (req.headers.get('content-type')?.includes('application/json') !== true) {
      return NextResponse.json({ ok: false, error: 'invalid_content_type' }, { status: 415 })
    }

    const body = await req.json()

    // --- Basit doğrulama ---
    if (!body?.fullName || String(body.fullName).trim().length < 2) {
      return NextResponse.json({ ok: false, error: 'fullName_required' }, { status: 400 })
    }

    // --- Sadece şemada olan alanları al ---
    const data: any = {
      fullName: body.fullName,
      phone: body.phone ?? null,
      subject: body.subject ?? null,
      message: body.message ?? '',
      consent: !!body.consent,
      consentAt: body.consent ? new Date() : null,

      // kişisel
      birthDate: body.birthDate ?? null,
      gender: body.gender ?? null,
      address: body.address ?? null,

      // iş tarafı
      positionApplied: body.positionApplied ?? null,
      workType: body.workType ?? null,
      employmentType: body.employmentType ?? null,
      shiftAvailability: body.shiftAvailability ?? null,
      salaryExpectation: body.salaryExpectation ?? null,
      insurancePreference: body.insurancePreference ?? null,
      partTimeDays: body.partTimeDays ?? null,
      partTimeStart: body.partTimeStart ?? null,
      partTimeEnd: body.partTimeEnd ?? null,
      educationLevel: body.educationLevel ?? null,
      foreignLanguages: body.foreignLanguages ?? null,

      // geçmiş
      prevCompany: body.prevCompany ?? null,
      prevTitle: body.prevTitle ?? null,
      prevDuration: body.prevDuration ?? null,
      prevReason: body.prevReason ?? null,
    }

    // --- DB'ye kaydet ---
    const saved = await prisma.submission.create({ data })

    // --- Admin’e mail (best-effort) ---
    try {
      const to =
        process.env.EMAIL_TO
          ? process.env.EMAIL_TO.split(',').map(s => s.trim()).filter(Boolean)
          : []

      if (to.length && process.env.EMAIL_FROM && process.env.RESEND_API_KEY) {
        const resp = await resend.emails.send({
          from: process.env.EMAIL_FROM!,
          to,
          subject: `Yeni Başvuru: ${saved.fullName}${saved.positionApplied ? ` • ${saved.positionApplied}` : ''}`,
          html: `
            <h2>Yeni Başvuru</h2>
            <p><b>Ad Soyad:</b> ${saved.fullName}</p>
            <p><b>Telefon:</b> ${saved.phone ?? '-'}</p>
            <p><b>Pozisyon:</b> ${saved.positionApplied ?? '-'}</p>
            <p><b>Çalışma Türü:</b> ${saved.workType ?? '-'}</p>
            <p><b>Vardiya:</b> ${saved.shiftAvailability ?? '-'}</p>
            <p><b>Mesaj:</b> ${saved.message ?? '-'}</p>
            <hr/>
            <small>Bu mail Local Group form sisteminden otomatik gönderildi.</small>
          `,
        })

        console.log('Resend send result:', resp)
      }
    } catch (mailErr) {
      console.error('Resend send error:', mailErr)
      // mail patlasa bile kullanıcıya başarılı dönüyoruz (DB kaydı yapıldı)
    }

    return NextResponse.json({ ok: true, id: saved.id })
  } catch (err: any) {
    console.error('submit error:', err)
    return NextResponse.json({ ok: false, error: err?.message ?? 'server_error' }, { status: 500 })
  }
}
