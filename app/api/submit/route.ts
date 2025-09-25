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
    const normalize = (value: any) => {
      if (value === undefined || value === null) return null
      if (typeof value === 'string') {
        const trimmed = value.trim()
        return trimmed.length ? trimmed : null
      }
      return value
    }

    const data: any = {
      fullName: body.fullName,
      phone: normalize(body.phone),
      subject: normalize(body.subject),
      message: normalize(body.message) ?? '',
      consent: !!body.consent,
      consentAt: body.consent ? new Date() : null,

      // kişisel
      birthDate: normalize(body.birthDate),
      gender: normalize(body.gender),
      address: normalize(body.address),

      // iş tarafı
      positionApplied: normalize(body.positionApplied),
      workType: normalize(body.workType),
      employmentType: normalize(body.employmentType),
      shiftAvailability: normalize(body.shiftAvailability),
      salaryExpectation: normalize(body.salaryExpectation),
      insurancePreference: normalize(body.insurancePreference),
      partTimeDays: normalize(body.partTimeDays),
      partTimeStart: normalize(body.partTimeStart),
      partTimeEnd: normalize(body.partTimeEnd),
      educationLevel: normalize(body.educationLevel),
      foreignLanguages: normalize(body.foreignLanguages),

      // geçmiş
      prevCompany: normalize(body.prevCompany),
      prevTitle: normalize(body.prevTitle),
      prevDuration: normalize(body.prevDuration),
      prevReason: normalize(body.prevReason),
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
        const format = (value: string | null | undefined) => (value && String(value).trim()) || '-'
        const insuranceMap: Record<string, string> = {
          istiyorum: 'Sigorta istiyorum',
          istemiyorum: 'Sigorta istemiyorum',
          farketmez: 'Fark etmez',
        }
        const genderMap: Record<string, string> = {
          female: 'Kadın',
          male: 'Erkek',
        }

        const partTimeDays = saved.partTimeDays
          ? saved.partTimeDays.split(',').map(s => s.trim()).filter(Boolean).join(', ')
          : null
        const partTimeHours = saved.partTimeStart || saved.partTimeEnd
          ? `${saved.partTimeStart ?? ''}${saved.partTimeStart && saved.partTimeEnd ? ' – ' : ''}${saved.partTimeEnd ?? ''}`.trim()
          : null
        const createdAt = saved.createdAt ? new Date(saved.createdAt).toLocaleString() : null

        const details: { label: string; value: string }[] = [
          { label: 'Ad Soyad', value: format(saved.fullName) },
          { label: 'Telefon', value: format(saved.phone) },
          { label: 'Pozisyon', value: format(saved.positionApplied) },
          { label: 'Çalışma Türü', value: format(saved.workType ?? saved.employmentType) },
          { label: 'Vardiya', value: format(saved.shiftAvailability) },
          { label: 'Sigorta Tercihi', value: insuranceMap[saved.insurancePreference ?? ''] || format(saved.insurancePreference) },
          { label: 'Maaş Beklentisi', value: format(saved.salaryExpectation) },
          { label: 'Part-Time Günler', value: partTimeDays ? partTimeDays : '-' },
          { label: 'Part-Time Saat', value: partTimeHours ? partTimeHours : '-' },
          { label: 'Eğitim Durumu', value: format(saved.educationLevel) },
          { label: 'Yabancı Diller', value: format(saved.foreignLanguages) },
          { label: 'Önceki İşletme', value: format(saved.prevCompany) },
          { label: 'Görev/Ünvan', value: format(saved.prevTitle) },
          { label: 'Çalışma Süresi', value: format(saved.prevDuration) },
          { label: 'Ayrılma Sebebi', value: format(saved.prevReason) },
          { label: 'Doğum Tarihi', value: format(saved.birthDate) },
          { label: 'Cinsiyet', value: genderMap[saved.gender ?? ''] || format(saved.gender) },
          { label: 'Adres', value: format(saved.address) },
          { label: 'KVKK Onayı', value: saved.consent ? 'Evet' : 'Hayır' },
          { label: 'Başvuru Tarihi', value: format(createdAt) },
        ]

        const detailRows = details
          .map(({ label, value }) => `
            <tr>
              <td style="padding:4px 8px;font-weight:600;border-bottom:1px solid #e5e7eb;">${label}</td>
              <td style="padding:4px 8px;border-bottom:1px solid #e5e7eb;">${value}</td>
            </tr>
          `)
          .join('')

        const messageBlock = saved.message
          ? `<h3 style="margin-top:16px;font-size:15px;">Ek Not</h3>
             <pre style="background:#f9fafb;padding:12px;border-radius:8px;font-family:inherit;white-space:pre-wrap;">${saved.message}</pre>`
          : ''

        const resp = await resend.emails.send({
          from: process.env.EMAIL_FROM!,
          to,
          subject: `Yeni Başvuru: ${saved.fullName}${saved.positionApplied ? ` • ${saved.positionApplied}` : ''}`,
          html: `
            <div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#111827;">
              <h2 style="font-size:18px;margin-bottom:12px;">Yeni Başvuru</h2>
              <table style="width:100%;border-collapse:collapse;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                <tbody>
                  ${detailRows}
                </tbody>
              </table>
              ${messageBlock}
              <p style="margin-top:24px;font-size:12px;color:#6b7280;">Bu mail Local Group form sisteminden otomatik gönderildi.</p>
            </div>
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
