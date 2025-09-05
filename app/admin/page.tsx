'use client'
import { useEffect, useMemo, useState } from 'react'

export default function AdminPage() {
  const [items, setItems] = useState<any[]>([])
  const [q, setQ] = useState('')
  const [err, setErr] = useState<string>('')

  async function fetchData() {
    setErr('')
    try {
      const res = await fetch('/api/admin', { cache: 'no-store' })
      const text = await res.text()
      try {
        const json = JSON.parse(text)
        if (json.ok) setItems(json.items || [])
        else setErr(json.error || 'Sunucu hatası')
      } catch {
        setErr('Beklenmeyen yanıt: JSON değil')
        console.error('Admin API non-JSON response:', text)
      }
    } catch (e: any) {
      setErr(e?.message || 'Ağ hatası')
    }
  }

  useEffect(() => { fetchData() }, [])

  const filtered = useMemo(() => {
    if (!q) return items
    const s = q.toLowerCase()
    return items.filter((it:any) =>
      [
        it.fullName, it.phone, it.subject, it.message,
        it.positionApplied, it.prevCompany, it.prevTitle, it.address
      ]
      .filter(Boolean)
      .some((v:string) => v.toLowerCase().includes(s))
    )
  }, [items, q])

  async function deleteItem(id: string) {
    if (!confirm('Bu başvuruyu silmek istiyor musun?')) return
    const prev = items
    setItems(arr => arr.filter(x => x.id !== id))
    try {
      const res = await fetch(`/api/admin/${id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) {
        alert('Silme başarısız: ' + (data.error || res.statusText))
        setItems(prev)
      }
    } catch {
      alert('Ağ hatası')
      setItems(prev)
    }
  }

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Gönderimler</h1>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ara… (ad, telefon, mesaj, şirket vb.)"
          className="w-64 rounded-xl border border-neutral-300 bg-white px-3 py-2
                     focus:outline-none focus:ring-2 focus:ring-black/70 focus:ring-offset-2 focus:ring-offset-white"
        />
      </div>

      {err && (
        <div className="p-3 rounded-lg border border-red-300 bg-red-50 text-red-700 text-sm">
          {err}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow border border-neutral-200 divide-y divide-neutral-200">
        {filtered.map((it:any) => (
          <div key={it.id} className="py-4 px-4">
            <div className="flex items-center justify-between">
              <div className="text-xs text-neutral-500">
                {new Date(it.createdAt).toLocaleString('tr-TR')}
              </div>
              <button
                onClick={() => deleteItem(it.id)}
                className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm border border-red-300 text-red-700 hover:bg-red-50 transition"
              >
                Sil
              </button>
            </div>

            <div className="mt-1 font-semibold">
              {it.fullName} {it.phone ? `— ${it.phone}` : ''}
            </div>

            {it.address && <div className="text-sm text-neutral-700">Adres: {it.address}</div>}

            <div className="mt-2 text-neutral-800">
              Pozisyon: {it.positionApplied || '-'} | Tür: {it.employmentType || '-'}
            </div>
            <div className="text-sm text-neutral-600">
              Vardiya: {it.shiftAvailability || '-'}
            </div>

            <div className="mt-2 text-neutral-800">
              Eğitim: {it.educationLevel || '-'}
              {it.foreignLanguages ? ` • Dil: ${it.foreignLanguages}` : ''}
            </div>

            {(it.prevCompany || it.prevTitle) && (
              <div className="mt-2 text-neutral-800">
                Son İş: {it.prevCompany || '-'} — {it.prevTitle || '-'} ({it.prevDuration || '-'})
                {it.prevReason ? ` | Ayrılma: ${it.prevReason}` : ''}
              </div>
            )}

            <div className="mt-2 text-neutral-700 whitespace-pre-wrap">
              {it.subject} — {it.message}
            </div>

            <div className="mt-1 text-xs text-neutral-500">
              KVKK: {it.consent ? 'Evet' : 'Hayır'}
              {it.consentAt ? ` (${new Date(it.consentAt).toLocaleString('tr-TR')})` : ''}
              {it.gender ? ` • Cinsiyet: ${it.gender}` : ''}
              {it.birthDate ? ` • Doğum: ${it.birthDate}` : ''}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="py-10 text-center text-neutral-500">Kayıt bulunamadı.</div>
        )}
      </div>
    </main>
  )
}
