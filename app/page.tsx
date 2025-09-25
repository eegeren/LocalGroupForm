'use client'
import { useState } from 'react'
import Link from 'next/link'
import cities from '../cities.json'

type ShiftKeys = 'gunduz'|'aksam'|'gece'|'haftaSonu'|'parttime'
type WorkTypeKey = 'sabit'|'sezonluk'|'gunluk'|'parttime'

const WORK_TYPES: { v: WorkTypeKey; label: string }[] = [
  { v: 'sabit', label: 'Sabit' },
  { v: 'sezonluk', label: 'Sezonluk' },
  { v: 'gunluk', label: 'Günlük' },
  { v: 'parttime', label: 'Part-Time' },
]

const SHIFTS: {k: ShiftKeys, label: string}[] = [
  {k:'gunduz', label:'Gündüz'},
  {k:'aksam', label:'Akşam'},
  {k:'gece', label:'Gece'},
  {k:'haftaSonu', label:'Hafta Sonu'},
  {k:'parttime', label:'Part-Time'},
]

const DAYS = ['Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi','Pazar'] as const
type DayKey = typeof DAYS[number]

export default function Page() {
  const [step, setStep] = useState<1|2|3>(1)
  const [status, setStatus] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [consent, setConsent] = useState(false)

  // --- FORM STATE ---
  const [fullName, setFullName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [phone, setPhone] = useState('')
  const [gender, setGender] = useState('')

  // Adres: il + ilçe
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('')

  const [positionApplied, setPositionApplied] = useState('')

  // Çalışma Türü -> ÇOKLU seçim
  const [workTypes, setWorkTypes] = useState<Record<WorkTypeKey, boolean>>({
    sabit:false, sezonluk:false, gunluk:false, parttime:false
  })
  const toCsv = (obj: Record<string, boolean>) =>
    Object.entries(obj).filter(([,v])=>v).map(([k])=>k).join(',')

  const [educationLevel, setEducationLevel] = useState('')
  const [foreignLanguages, setForeignLanguages] = useState('')
  const [prevCompany, setPrevCompany] = useState('')
  const [prevTitle, setPrevTitle] = useState('')
  const [prevDuration, setPrevDuration] = useState('')
  const [prevReason, setPrevReason] = useState('')
  const [message, setMessage] = useState('')

  // Vardiya
  const [shift, setShift] = useState<Record<ShiftKeys, boolean>>({
    gunduz:false, aksam:false, gece:false, haftaSonu:false, parttime:false
  })
  const toShiftString = (obj: Record<string, boolean>) =>
    Object.entries(obj).filter(([,v])=>v).map(([k])=>k).join(',')

  // Maaş beklentisi
  const [salaryExpectation, setSalaryExpectation] = useState('')

  // Part-time detay: günler + saatler
  const [ptDays, setPtDays] = useState<Record<DayKey, boolean>>({
    Pazartesi:false, Salı:false, Çarşamba:false, Perşembe:false, Cuma:false, Cumartesi:false, Pazar:false
  })
  const [ptStart, setPtStart] = useState('') // "09:00"
  const [ptEnd, setPtEnd] = useState('')     // "17:00"
  const ptDaysCsv = toCsv(ptDays as unknown as Record<string, boolean>)

  const wpLinks: Record<string, string> = {
    female: 'https://chat.whatsapp.com/Cvk2uOq86aZKDYuLGhEk2v?mode=ems_copy_t',
    male: 'https://chat.whatsapp.com/BQLVl1fCfHNHvPZpiCrhWw?mode=ems_copy_t'
  }
  const [successData, setSuccessData] = useState<{gender?: string}>({})

  // --- VALIDATION HELPERS ---
  const isPhoneValid = (p: string) => {
    const digits = p.replace(/\D/g, '')
    return digits.length >= 10 && digits.length <= 11
  }

  // --- VALIDATION (hepsi zorunlu) ---
  function validateStep1() {
    if (!fullName.trim()) return 'Ad Soyad zorunludur.'
    if (!birthDate) return 'Doğum tarihi zorunludur.'
    if (!phone.trim() || !isPhoneValid(phone)) return 'Geçerli bir telefon giriniz.'
    if (!gender) return 'Cinsiyet seçiniz.'
    if (!city) return 'İl seçiniz.'
    if (!district) return 'İlçe seçiniz.'
    return ''
  }
  function validateStep2() {
    if (!positionApplied.trim()) return 'Başvurulan pozisyonu yazınız.'
    if (!salaryExpectation.trim()) return 'Maaş beklentisi zorunludur.'
    const anyWorkType = Object.values(workTypes).some(Boolean)
    if (!anyWorkType) return 'En az bir Çalışma Türü seçiniz.'
    const anyShift = Object.values(shift).some(Boolean)
    if (!anyShift) return 'En az bir Vardiya Türü seçiniz.'
    // Eğer part-time seçiliyse gün ve saat zorunlu
    if (workTypes.parttime) {
      const anyDay = Object.values(ptDays).some(Boolean)
      if (!anyDay) return 'Part-Time için en az bir gün seçiniz.'
      if (!ptStart || !ptEnd) return 'Part-Time için başlangıç ve bitiş saatlerini giriniz.'
    }
    return ''
  }
  function validateStep3() {
    if (!prevCompany.trim()) return 'Çalışılan işletme zorunludur.'
    if (!prevTitle.trim()) return 'Görev/Pozisyon zorunludur.'
    if (!prevDuration.trim()) return 'Çalışma süresi zorunludur.'
    if (!prevReason.trim()) return 'Ayrılma sebebi zorunludur.'
    if (message.trim().length < 5) return 'Ek Not en az 5 karakter olmalı.'
    if (!consent) return 'Lütfen KVKK aydınlatmasını onaylayın.'
    return ''
  }

  // --- SUBMIT ---
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const ve = validateStep3()
    if (ve) { setStatus(ve); return }

    setLoading(true); setStatus('Gönderiliyor…')

    const finalMessage = message.trim()

    const workTypesCsv = toCsv(workTypes)

    const payload: any = {
      fullName, birthDate, phone, gender,
      addressCity: city,
      addressDistrict: district,
      positionApplied,
      workTypes: workTypesCsv,
      workType: workTypesCsv, // geriye dönük uyumluluk
      salaryExpectation,
      partTimeDays: ptDaysCsv,
      partTimeStart: ptStart,
      partTimeEnd: ptEnd,
      educationLevel, foreignLanguages,
      prevCompany, prevTitle, prevDuration, prevReason,
      message: finalMessage,
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

  // --- SUCCESS VIEW ---
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

  // --- FORM ---
  return (
    <main className="min-h-screen relative bg-white">
      <div className="absolute inset-0 bg-watermark" />
      <div className="relative max-w-2xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-center">Başvuru Formu</h1>
          <p className="text-sm text-neutral-500 mt-1 text-center">
            Lütfen formu doldurun. <span className="font-medium">*</span> alanlar zorunludur.
          </p>

          <div className="mt-4 h-2 w-full bg-neutral-200 rounded-full overflow-hidden">
            <div className="h-full bg-black transition-all" style={{ width: progress + '%' }} />
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
                  <input required name="fullName" placeholder="Adınız Soyadınız"
                         value={fullName} onChange={(e)=>setFullName(e.target.value)}
                         className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"/>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-neutral-700">Doğum Tarihi *</label>
                  <input required type="date" name="birthDate"
                         value={birthDate} onChange={(e)=>setBirthDate(e.target.value)}
                         className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"/>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-neutral-700">Telefon *</label>
                  <input required name="phone" placeholder="5xx xxx xx xx"
                         value={phone} onChange={(e)=>setPhone(e.target.value)}
                         className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"/>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-neutral-700">Cinsiyet *</label>
                  <select required name="gender" value={gender} onChange={(e)=>setGender(e.target.value)}
                          className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2">
                    <option value="">Seçiniz</option>
                    <option value="female">Kadın</option>
                    <option value="male">Erkek</option>
                  </select>
                </div>

                {/* İl & İlçe */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-neutral-700">İl *</label>
                  <select required
                    value={city}
                    onChange={(e)=>{ setCity(e.target.value); setDistrict('') }}
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"
                  >
                    <option value="">İl seçiniz</option>
                    {Object.keys(cities as Record<string,string[]>).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-neutral-700">İlçe *</label>
                  <select required
                    value={district}
                    onChange={(e)=>setDistrict(e.target.value)}
                    disabled={!city}
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 disabled:bg-neutral-100"
                  >
                    <option value="">{city ? 'İlçe seçiniz' : 'Önce il seçiniz'}</option>
                    {city && (cities as Record<string,string[]>)[city]?.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="text-sm min-h-5 text-red-600">{status && step===1 ? status : ''}</div>

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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="block text-sm font-medium mb-1 text-neutral-700">Başvurulan Pozisyon *</label>
                  <input required name="positionApplied" placeholder="Örn: Garson, Kasiyer, Barista"
                         value={positionApplied} onChange={(e)=>setPositionApplied(e.target.value)}
                         className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"/>

                  {/* Çalışma Türü pills */}
                  <div>
                    <label className="block text-sm font-bold mb-2 text-black">Çalışma Türü *</label>
                    <div className="flex flex-wrap gap-2">
                      {WORK_TYPES.map(t => {
                        const active = workTypes[t.v]
                        return (
                          <button
                            key={t.v}
                            type="button"
                            onClick={() => setWorkTypes(s => ({ ...s, [t.v]: !s[t.v] }))}
                            className={
                              "px-3 py-1.5 rounded-full border transition " +
                              (active
                                ? "bg-black text-white border-black shadow"
                                : "bg-white text-neutral-700 border-neutral-300 hover:border-neutral-400")
                            }
                          >
                            {t.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Vardiya Türü SOLA hizalı, SAĞDA maaş */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-800 mb-2">Vardiya Türü *</h3>
                    <div className="flex flex-wrap gap-2">
                      {SHIFTS.map(opt => {
                        const checked = shift[opt.k]
                        return (
                          <button
                            key={opt.k}
                            type="button"
                            onClick={()=> setShift(s=>({ ...s, [opt.k]: !s[opt.k] }))}
                            className={
                              "px-3 py-1.5 rounded-full border text-sm transition " +
                              (checked
                                ? "bg-black text-white border-black shadow"
                                : "bg-white text-neutral-700 border-neutral-300 hover:border-neutral-400")
                            }
                          >
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-neutral-700">Maaş Beklentisi (₺) *</label>
                    <input
                      required
                      name="salaryExpectation"
                      placeholder="Örn: 25.000"
                      value={salaryExpectation}
                      onChange={(e)=>setSalaryExpectation(e.target.value)}
                      className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"
                      inputMode="numeric"
                    />
                  </div>
                </div>
              </div>

              {/* Part-Time detayları */}
              {workTypes.parttime && (
                <div className="rounded-xl border border-neutral-200 p-4 space-y-3 bg-neutral-50">
                  <h4 className="font-medium">Part-Time Uygunluk</h4>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map(d => {
                      const checked = ptDays[d]
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={()=> setPtDays(s => ({ ...s, [d]: !s[d] }))}
                          className={
                            "px-3 py-1.5 rounded-full border text-sm transition " +
                            (checked
                              ? "bg-black text-white border-black shadow"
                              : "bg-white text-neutral-700 border-neutral-300 hover:border-neutral-400")
                          }
                        >
                          {d}
                        </button>
                      )
                    })}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm mb-1">Başlangıç Saati *</label>
                      <input type="time" value={ptStart} onChange={e=>setPtStart(e.target.value)}
                             className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"/>
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Bitiş Saati *</label>
                      <input type="time" value={ptEnd} onChange={e=>setPtEnd(e.target.value)}
                             className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"/>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-600">Seçtiğiniz günlerde bu saat aralığında çalışabilirsiniz.</p>
                </div>
              )}

              <div className="text-sm min-h-5 text-red-600">{status && step===2 ? status : ''}</div>

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
                <h2 className="text-lg font-semibold">Eğitim</h2>
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
                <div>
                  <h2 className="text-lg font-semibold">Deneyim</h2>
                  <p className="text-sm text-neutral-500">Çalıştığınız son işletme hakkında bilgi ekleyin.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-neutral-700">Çalışılan İşletme *</label>
                    <input required name="prevCompany" placeholder="Örn: Local Group Cafe"
                           value={prevCompany} onChange={(e)=>setPrevCompany(e.target.value)}
                           className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-neutral-700">Görev / Pozisyon *</label>
                    <input required name="prevTitle" placeholder="Örn: Garson"
                           value={prevTitle} onChange={(e)=>setPrevTitle(e.target.value)}
                           className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-neutral-700">Çalışma Süresi *</label>
                    <input required name="prevDuration" placeholder="Örn: 6 ay, 2022-2023"
                           value={prevDuration} onChange={(e)=>setPrevDuration(e.target.value)}
                           className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-neutral-700">Ayrılma Sebebi *</label>
                    <input required name="prevReason" placeholder="Örn: Okul dönemi bitti"
                           value={prevReason} onChange={(e)=>setPrevReason(e.target.value)}
                           className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"/>
                  </div>
                </div>
              </section>

              <section className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">Ek Not *</label>
                <textarea
                  name="message"
                  rows={4}
                  placeholder="Özellikle belirtmek istediklerinizi buraya ekleyin."
                  value={message}
                  onChange={(e)=>setMessage(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  En az 5 karakter.
                </p>
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

              <div className="text-sm min-h-5 text-red-600">{status && step===3 ? status : ''}</div>

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

          <input type="hidden" name="fullName" value={fullName} />
          <input type="hidden" name="phone" value={phone} />
          <input type="hidden" name="birthDate" value={birthDate} />
          <input type="hidden" name="gender" value={gender} />
          <input type="hidden" name="addressCity" value={city} />
          <input type="hidden" name="addressDistrict" value={district} />
          <input type="hidden" name="positionApplied" value={positionApplied} />
          <input type="hidden" name="workType" value={toCsv(workTypes)} />
          <input type="hidden" name="salaryExpectation" value={salaryExpectation} />
          <input type="hidden" name="partTimeDays" value={ptDaysCsv} />
          <input type="hidden" name="partTimeStart" value={ptStart} />
          <input type="hidden" name="partTimeEnd" value={ptEnd} />
          <input type="hidden" name="educationLevel" value={educationLevel} />
          <input type="hidden" name="foreignLanguages" value={foreignLanguages} />
          <input type="hidden" name="prevCompany" value={prevCompany} />
          <input type="hidden" name="prevTitle" value={prevTitle} />
          <input type="hidden" name="prevDuration" value={prevDuration} />
          <input type="hidden" name="prevReason" value={prevReason} />
          <input type="hidden" name="message" value={message} />
        </form>

        <footer className="relative mt-10 py-6 text-center text-xs text-neutral-600/80">
          © {new Date().getFullYear()} Local Group •{' '}
          <a
            href="https://www.cortexaai.net"
            target="_blank"
            className="font-semibold underline-offset-2 hover:underline"
          >
            Cortexa Labs.
          </a>
        </footer>
      </div>
    </main>
  )
}
