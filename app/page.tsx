'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function Page() {
  const [status, setStatus] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [consent, setConsent] = useState(false)
  const [gender, setGender] = useState<string>('')

  const [shift, setShift] = useState<{ [k: string]: boolean }>({
    gunduz: false,
    aksam: false,
    gece: false,
    haftaSonu: false,
    parttime: false,
  })
  const toShiftString = (obj: Record<string, boolean>) =>
    Object.entries(obj)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(',')

  const wpLinks: Record<string, string> = {
    female: 'https://chat.whatsapp.com/Cvk2uOq86aZKDYuLGhEk2v?mode=ems_copy_t',
    male: 'https://chat.whatsapp.com/BQLVl1fCfHNHvPZpiCrhWw?mode=ems_copy_t',
  }

  const [successData, setSuccessData] = useState<{ gender?: string }>({})

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!consent) {
      setStatus('Lütfen KVKK aydınlatmasını onaylayın.')
      return
    }
    setLoading(true)
    setStatus('Gönderiliyor…')

    const form = e.currentTarget
    const formData = new FormData(form)
    const payload: any = Object.fromEntries(formData.entries())
    payload.consent = consent
    payload.shiftAvailability = toShiftString(shift)

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (json.ok) {
        setSuccessData({ gender: payload.gender })
        setStatus('')
        form.reset()
        setConsent(false)
        setShift({
          gunduz: false,
          aksam: false,
          gece: false,
          haftaSonu: false,
          parttime: false,
        })
      } else {
        setStatus('⚠️ Hata: ' + (json.error ?? 'Geçersiz veri veya sunucu hatası.'))
      }
    } catch {
      setStatus('⛔ Ağ hatası, lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  if (successData.gender) {
    const link = wpLinks[successData.gender] || ''
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-6 rounded-2xl shadow max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">Başvurunuz Alındı ✅</h1>
          {link ? (
            <>
              <p className="text-neutral-700">
                Katılmanız için WhatsApp grubunuzun linki aşağıdadır:
              </p>
              <a
                href={link}
                target="_blank"
                className="inline-block bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition"
              >
                WhatsApp Grubuna Katıl
              </a>
            </>
          ) : (
            <p className="text-neutral-500">Grup linki tanımlı değil.</p>
          )}
          <button
            onClick={() => location.reload()}
            className="block mx-auto mt-2 text-sm text-neutral-600 underline"
          >
            Yeni başvuru yap
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Başvuru Formu</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Lütfen formu doldurun. <span className="font-medium">*</span> alanlar zorunludur.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="bg-white rounded-2xl shadow p-6 space-y-8 border border-neutral-200"
        >
          {/* Kişisel Bilgiler */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Kişisel Bilgiler</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-700">
                  Ad Soyad *
                </label>
                <input
                  name="fullName"
                  required
                  placeholder="Adınız Soyadınız"
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-700">
                  Doğum Tarihi
                </label>
                <input
                  type="date"
                  name="birthDate"
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-700">Telefon</label>
                <input
                  name="phone"
                  placeholder="5xx xxx xx xx"
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-700">Cinsiyet</label>
                <select
                  name="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"
                >
                  <option value="">Seçiniz</option>
                  <option value="female">Kadın</option>
                  <option value="male">Erkek</option>
                  <option value="other">Belirtmek istemiyorum</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 text-neutral-700">Adres</label>
                <input
                  name="address"
                  placeholder="İl/İlçe, mahalle, adres"
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"
                />
              </div>
            </div>
          </section>

          {/* Çalışma Bilgileri */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Çalışma Bilgileri</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-700">
                  Başvurulan Pozisyon
                </label>
                <input
                  name="positionApplied"
                  placeholder="Örn: Garson, Kasiyer, Barista"
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">Çalışma Türü</label>
                <select
                  name="workType"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Seçiniz</option>
                  <option value="sabit">Sabit</option>
                  <option value="sezonluk">Sezonluk</option>
                  <option value="gunluk">Günlük</option>
                  <option value="parttime">Part-Time</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { k: 'gunduz', label: 'Gündüz' },
                { k: 'aksam', label: 'Akşam' },
                { k: 'gece', label: 'Gece' },
                { k: 'haftaSonu', label: 'Hafta Sonu' },
                { k: 'parttime', label: 'Part-Time' },
              ].map((opt) => (
                <label key={opt.k} className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={shift[opt.k as keyof typeof shift]}
                    onChange={(e) =>
                      setShift((s) => ({
                        ...s,
                        [opt.k]: e.target.checked,
                      }))
                    }
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </section>

          {/* Eğitim Bilgileri */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Eğitim Bilgileri</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-700">
                  Eğitim Durumu
                </label>
                <input
                  name="educationLevel"
                  placeholder="Lise, Ön Lisans, Lisans vb."
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-700">Yabancı Dil</label>
                <input
                  name="foreignLanguages"
                  placeholder="Örn: İngilizce B2; Almanca A2"
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"
                />
              </div>
            </div>
          </section>

          {/* Deneyim */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Deneyim</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-700">
                  Çalışılan İşletme
                </label>
                <input
                  name="prevCompany"
                  placeholder="Örn: Local Group Cafe"
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-700">Görev / Pozisyon</label>
                <input
                  name="prevTitle"
                  placeholder="Örn: Garson"
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-700">Çalışma Süresi</label>
                <input
                  name="prevDuration"
                  placeholder="Örn: 6 ay, 2022-2023"
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-700">Ayrılma Sebebi</label>
                <input
                  name="prevReason"
                  placeholder="Örn: Okul dönemi bitti"
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"
                />
              </div>
            </div>
          </section>

          {/* Diğer */}
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Diğer</h2>
            <label className="block text-sm font-medium mb-1 text-neutral-700">Ek Not</label>
            <textarea
              name="message"
              required
              rows={4}
              placeholder="Mesajınız"
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"
            />
            <p className="text-xs text-neutral-500 mt-1">En az 5 karakter olmalı.</p>
          </section>

          {/* KVKK */}
          <div className="flex items-start gap-3">
            <input
              id="kvkk"
              type="checkbox"
              required
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-neutral-300"
            />
            <label htmlFor="kvkk" className="text-sm text-neutral-700">
              <span className="font-medium">KVKK Aydınlatmasını</span> okudum ve kişisel verilerimin
              iletişim amacıyla işlenmesine onay veriyorum.{' '}
              <Link href="/kvkk" className="underline">
                (Metni gör)
              </Link>
            </label>
          </div>

          {/* Durum Mesajı */}
          <div className="text-sm min-h-5">{status}</div>

          {/* --- Butonlar (Gönder + Admin) --- */}
          <div className="flex flex-col md:flex-row gap-3 justify-end">
            <button
              disabled={loading}
              className="inline-flex items-center justify-center rounded-xl bg-black text-white px-5 py-2.5
                         font-medium disabled:opacity-60 hover:bg-neutral-800 transition w-full md:w-auto"
            >
              {loading ? 'Gönderiliyor…' : 'Gönder'}
            </button>

            <Link
              href="/admin"
              className="inline-flex items-center justify-center rounded-xl bg-gray-700 text-white px-5 py-2.5
                         font-medium hover:bg-gray-600 transition w-full md:w-auto"
            >
              Yönetici Girişi
            </Link>
          </div>
        </form>
      </div>
    </main>
  )
}