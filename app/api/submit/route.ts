import { NextResponse } from "next/server"
import { Resend } from "resend"
import NewApplicationEmail from "@/app/emails/NewApplication"

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const saved = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...body,
    }

    const from = process.env.EMAIL_FROM || "Local Group <no-reply@onresend.com>"
    const toRaw = process.env.EMAIL_TO || ""
    const recipients = toRaw.split(",").map((s) => s.trim()).filter(Boolean)

    if (recipients.length > 0) {
      try {
        // Önce React template ile dene
        await resend.emails.send({
          from,
          to: recipients,
          subject: `Yeni Başvuru: ${saved.fullName || ""} • ${saved.positionApplied || ""}`.trim(),
          react: NewApplicationEmail(saved),
        })
      } catch (e) {
        console.error("React email gönderilemedi, fallback HTML kullanılacak", e)

        // React template hata verirse fallback html
        await resend.emails.send({
          from,
          to: recipients,
          subject: "Yeni Başvuru Geldi 🎉",
          html: `
            <h2>Yeni Başvuru</h2>
            <p><b>Ad Soyad:</b> ${saved.fullName}</p>
            <p><b>Telefon:</b> ${saved.phone || "-"}</p>
            <p><b>Pozisyon:</b> ${saved.positionApplied || "-"}</p>
            <p><b>Çalışma Türü:</b> ${saved.workType || "-"}</p>
            <p><b>Mesaj:</b> ${saved.message || "-"}</p>
            <hr/>
            <small>Bu mail Local Group form sisteminden otomatik gönderildi.</small>
          `,
        })
      }
    }

    return NextResponse.json({ ok: true, id: saved.id })
  } catch (err: any) {
    console.error("Mail gönderim hatası", err)
    return NextResponse.json(
      { ok: false, error: "Mail gönderilemedi" },
      { status: 500 }
    )
  }
}