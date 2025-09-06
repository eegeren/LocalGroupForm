'use client'
import { useState } from 'react'
import Link from 'next/link'

type ShiftKeys = 'gunduz'|'aksam'|'gece'|'haftaSonu'|'parttime'

export default function Page() {
  const [step, setStep] = useState<1|2|3>(1)
  const [status, setStatus] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [consent, setConsent] = useState(false)

  // --- FORM STATE (SSR güvenli) ---
  const [fullName, setFullName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [phone, setPhone] = useState('')
  const [gender, setGender] = useState('')
  const [address, setAddress] = useState('')

  const [positionApplied, setPositionApplied] = useState('')
  const [workType, setWorkType] = useState('')

  const [educationLevel, setEducationLevel] = useState('')
  const [foreignLanguages, setForeignLanguages] = useState('')
  const [prevCompany, setPrevCompany] = useState('')
  const [prevTitle, setPrevTitle] = useState('')
  const [prevDuration, setPrevDuration] = useState('')
  const [prevReason, setPrevReason] = useState('')
  const [message, setMessage] = useState('')

  const [shift, setShift] = useState<Record<ShiftKeys, boolean>>({
    gunduz:false, aksam:false, gece:false, haftaSonu:false, parttime:false
  })
  const toShiftString = (obj: Record<string, boolean>) =>
    Object.entries(obj).filter(([,v])=>v).map(([k])=>k).join(',')

  const wpLinks: Record<string, string> = {
    female: 'https://chat.whatsapp.com/Cvk2uOq86aZKDYuLGhEk2v?mode=ems_copy_t',
    male: 'https://chat.whatsapp.com/BQLVl1fCfHNHvPZpiCrhWw?mode=ems_copy_t'
  }
  const [successData, setSuccessData] = useState<{gender?: string}>({})

  function validateStep1() {
    if (!fullName.trim()) return 'Ad Soyad zorunludur.'
    return ''
  }
  function validateStep2() {
    if (!workType) return 'Çalışma Türü seçiniz.'
    return ''
  }
  function validateStep3() {
    if (message.trim().length < 5) return 'Ek Not en az 5 karakter olmalı.'
    if (!consent) return 'Lütfen KVKK aydınlatmasını onaylayın.'
    return ''
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const ve = validateStep3()
    if (ve) { setStatus(ve); return }

    setLoading(true); setStatus('Gönderiliyor…')

    const payload: any = {
      fullName, birthDate, phone, gender, address,
      positionApplied, workType,
      educationLevel, foreignLanguages,
      prevCompany, prevTitle, prevDuration, prevReason,
      message,
      consent,
      shiftAvailability: toShiftString(shift),
    }

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const json = await res.json()
      if (json.ok) {
        setSuccessData({ gender })
        setStatus('')
        setStep(1)
      } else {
        setStatus('⚠️ Hata: ' + (json.error ?? 'Geçersiz veri veya sunucu hatası.'))
      }
    } catch {
      setStatus('⛔ Ağ hatası, lütfen tekrar deneyin.')
    } finally { setLoading(false) }
  }

  if (successData.gender) {
    const link = wpLinks[successData.gender] || ''
    return (
      <main className="min-h-screen flex items-center justify-center relative bg-white">
        <div className="absolute inset-0 bg-watermark" />
        <div className="relative">
          <div className="bg-white p-6 rounded-2xl shadow max-w-md text-center space-y-4">
            <h1 className="text-2xl font-bold">Başvurunuz Alındı ✅</h1>
            {link ? (
              <>
                <p className="text-neutral-700">Katılmanız için WhatsApp grubunuzun linki aşağıdadır:</p>
                <a href={link} target="_blank"
                  className="inline-block bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition">
                  WhatsApp Grubuna Katıl
                </a>
              </>
            ) : (
              <p className="text-neutral-500">Grup linki tanımlı değil.</p>
            )}
            <button onClick={() => location.reload()} className="block mx-auto mt-2 text-sm text-neutral-600 underline">
              Yeni başvuru yap
            </button>
          </div>
        </div>
      </main>
    )
  }

  const progress = step === 1 ? 33 : step === 2 ? 66 : 100

  return (
    <main className="min-h-screen relative bg-white">
      {/* Watermark layer */}
      <div className="absolute inset-0 bg-watermark" />
      {/* İçerik layer */}
      <div className="relative max-w-2xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-center">Başvuru Formu</h1>
          <p className="text-sm text-neutral-500 mt-1 text-center">
            Lütfen formu doldurun. <span className="font-medium">*</span> alanlar zorunludur.
          </p>

        <div className="mt-4 h-2 w-full bg-neutral-200 rounded-full overflow-hidden">
            <div className="h-full bg-black transition-all" style={{width: progress + '%'}} />
          </div>
          <div className="mt-1 text-xs text-neutral-600 text-right">{progress}%</div>
        </div>

        <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow p-6 space-y-8 border border-neutral-200">
          {step === 1 && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Kişisel Bilgiler</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-neutral-700">Ad Soyad *</label>
                  <input name="fullName" required placeholder="Adınız Soyadınız"
                    value={fullName} onChange={(e)=>setFullName(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"/>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-neutral-700">Doğum Tarihi</label>
                  <input type="date" name="birthDate"
                    value={birthDate} onChange={(e)=>setBirthDate(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"/>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-neutral-700">Telefon</label>
                  <input name="phone" placeholder="5xx xxx xx xx"
                    value={phone} onChange={(e)=>setPhone(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"/>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-neutral-700">Cinsiyet</label>
                  <select name="gender" value={gender} onChange={(e)=>setGender(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2">
                    <option value="">Seçiniz</option>
                    <option value="female">Kadın</option>
                    <option value="male">Erkek</option>
                    <option value="other">Belirtmek istemiyorum</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1 text-neutral-700">Adres</label>
                  <input name="address" placeholder="İl/İlçe, mahalle, adres"
                    value={address} onChange={(e)=>setAddress(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"/>
                </div>
              </div>

              <div className="flex justify-between">
                <span />
                <button
                  type="button"
                  onClick={()=>{
                    const e = validateStep1()
                    if (e) { setStatus(e); return }
                    setStatus(''); setStep(2)
                  }}
                  className="rounded-xl bg-black text-white px-5 py-2.5 hover:bg-neutral-800"
                >İleri</button>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Çalışma Bilgileri</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-neutral-700">Başvurulan Pozisyon</label>
                  <input name="positionApplied" placeholder="Örn: Garson, Kasiyer, Barista"
                    value={positionApplied} onChange={(e)=>setPositionApplied(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"/>
                </div>
                <div>
                  {/* >>> Burayı kalın & siyah yaptık <<< */}
                  <label className="block text-sm font-bold mb-2 text-black">Çalışma Türü *</label>
                  <select name="workType"
                    value={workType} onChange={(e)=>setWorkType(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
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
                  {k:'gunduz', label:'Gündüz'},
                  {k:'aksam', label:'Akşam'},
                  {k:'gece', label:'Gece'},
                  {k:'haftaSonu', label:'Hafta Sonu'},
                  {k:'parttime', label:'Part-Time'},
                ].map(opt => (
                  <label key={opt.k} className="inline-flex items-center gap-2 text-sm">
                    <input type="checkbox"
                      checked={shift[opt.k as ShiftKeys]}
                      onChange={(e)=> setShift(s=>({ ...s, [opt.k]: e.target.checked }))}/>
                    {opt.label}
                  </label>
                ))}
              </div>

              <div className="flex justify-between">
                <button type="button" onClick={()=>setStep(1)} className="rounded-xl border px-5 py-2.5">Geri</button>
                <button
                  type="button"
                  onClick={()=>{
                    const e = validateStep2()
                    if (e) { setStatus(e); return }
                    setStatus(''); setStep(3)
                  }}
                  className="rounded-xl bg-black text-white px-5 py-2.5 hover:bg-neutral-800"
                >İleri</button>
              </div>
            </section>
          )}

          {step === 3 && (
            <>
              <section className="space-y-4">
                <h2 className="text-lg font-semibold">Eğitim & Deneyim</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-neutral-700">Eğitim Durumu</label>
                    <input name="educationLevel" placeholder="Lise, Ön Lisans, Lisans vb."
                      value={educationLevel} onChange={(e)=>setEducationLevel(e.target.value)}
                      className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-neutral-700">Yabancı Dil</label>
                    <input name="foreignLanguages" placeholder="Örn: İngilizce B2; Almanca A2"
                      value={foreignLanguages} onChange={(e)=>setForeignLanguages(e.target.value)}
                      className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"/>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-neutral-700">Çalışılan İşletme</label>
                    <input name="prevCompany" placeholder="Örn: Local Group Cafe"
                      value={prevCompany} onChange={(e)=>setPrevCompany(e.target.value)}
                      className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-neutral-700">Görev / Pozisyon</label>
                    <input name="prevTitle" placeholder="Örn: Garson"
                      value={prevTitle} onChange={(e)=>setPrevTitle(e.target.value)}
                      className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-neutral-700">Çalışma Süresi</label>
                    <input name="prevDuration" placeholder="Örn: 6 ay, 2022-2023"
                      value={prevDuration} onChange={(e)=>setPrevDuration(e.target.value)}
                      className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-neutral-700">Ayrılma Sebebi</label>
                    <input name="prevReason" placeholder="Örn: Okul dönemi bitti"
                      value={prevReason} onChange={(e)=>setPrevReason(e.target.value)}
                      className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"/>
                  </div>
                </div>
              </section>

              <section className="space-y-2">
                <label className="block text-sm font-medium mb-1 text-neutral-700">Ek Not *</label>
                <textarea name="message" required rows={4} placeholder="Mesajınız"
                  value={message} onChange={(e)=>setMessage(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"/>
                <p className="text-xs text-neutral-500 mt-1">En az 5 karakter olmalı.</p>
              </section>

              <div className="flex items-start gap-3">
                <input id="kvkk" type="checkbox" required checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-neutral-300"/>
                <label htmlFor="kvkk" className="text-sm text-neutral-700">
                  <span className="font-medium">KVKK Aydınlatmasını</span> okudum ve kişisel verilerimin
                  iletişim amacıyla işlenmesine onay veriyorum.{' '}
                  <Link href="/kvkk" className="underline">(Metni gör)</Link>
                </label>
              </div>

              <div className="text-sm min-h-5">{status}</div>

              <div className="flex gap-3 justify-between">
                <button type="button" onClick={()=>setStep(2)} className="rounded-xl border px-5 py-2.5">Geri</button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-xl bg-black text-white px-5 py-2.5
                             font-medium disabled:opacity-60 hover:bg-neutral-800 transition"
                >
                  {loading ? 'Gönderiliyor…' : 'Gönder'}
                </button>
              </div>
            </>
          )}

          {/* Hidden alanlar */}
          <input type="hidden" name="fullName" value={fullName} />
          <input type="hidden" name="phone" value={phone} />
          <input type="hidden" name="birthDate" value={birthDate} />
          <input type="hidden" name="gender" value={gender} />
          <input type="hidden" name="address" value={address} />
          <input type="hidden" name="positionApplied" value={positionApplied} />
          <input type="hidden" name="workType" value={workType} />
          <input type="hidden" name="educationLevel" value={educationLevel} />
          <input type="hidden" name="foreignLanguages" value={foreignLanguages} />
          <input type="hidden" name="prevCompany" value={prevCompany} />
          <input type="hidden" name="prevTitle" value={prevTitle} />
          <input type="hidden" name="prevDuration" value={prevDuration} />
          <input type="hidden" name="prevReason" value={prevReason} />
          <input type="hidden" name="message" value={message} />
        </form>
      </div>
    </main>
  )
}