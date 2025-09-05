'use client'
import { useEffect, useMemo, useState } from 'react'

type Item = {
  id: string
  fullName: string
  phone?: string | null
  gender?: string | null
  positionApplied?: string | null
  workType?: string | null
  message: string
  createdAt: string
}

export default function AdminPage() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string>('')

  // UI state
  const [q, setQ] = useState('')
  const [gender, setGender] = useState('')
  const [workType, setWorkType] = useState('')
  const [order, setOrder] = useState<'desc'|'asc'>('desc')

  async function load() {
    setLoading(true); setErr('')
    try {
      const res = await fetch('/api/admin', { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json?.error || 'server error')
      setItems(json.items || [])
    } catch (e:any) {
      setErr(e?.message || 'Yükleme hatası')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    let data = [...items]
    if (q.trim()) {
      const s = q.trim().toLowerCase()
      data = data.filter(it =>
        (it.fullName||'').toLowerCase().includes(s) ||
        (it.phone||'').toLowerCase().includes(s) ||
        (it.positionApplied||'').toLowerCase().includes(s) ||
        (it.message||'').toLowerCase().includes(s)
      )
    }
    if (gender) data = data.filter(it => (it.gender||'') === gender)
    if (workType) data = data.filter(it => (it.workType||'') === workType)
    data.sort((a,b) => {
      const da = new Date(a.createdAt).getTime()
      const db = new Date(b.createdAt).getTime()
      return order === 'desc' ? db - da : da - db
    })
    return data
  }, [items, q, gender, workType, order])

  async function onDelete(id: string) {
    if (!confirm('Bu başvuruyu silmek istiyor musun?')) return
    const res = await fetch(`/api/admin/${id}`, { method: 'DELETE' })
    const json = await res.json().catch(()=>({}))
    if (!res.ok || !json.ok) {
      alert('Silinemedi: ' + (json?.error || 'server-error'))
      return
    }
    setItems(s => s.filter(x => x.id !== id))
  }

  // --- CSV (mevcut) ---
  function toCSV(rows: Item[]) {
    const esc = (v: any) => {
      const s = (v ?? '').toString().replace(/"/g,'""')
      return `"${s}"`
    }
    const header = [
      'id','Ad Soyad','Telefon','Cinsiyet','Pozisyon','Çalışma Türü','Not','Tarih'
    ]
    const lines = [header.join(',')]
    for (const r of rows) {
      lines.push([
        r.id, r.fullName, r.phone ?? '', r.gender ?? '', r.positionApplied ?? '',
        r.workType ?? '', r.message ?? '', new Date(r.createdAt).toLocaleString()
      ].map(esc).join(','))
    }
    return lines.join('\n')
  }

  function downloadCSV() {
    const csv = toCSV(filtered)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `basvurular_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // --- XLSX (yeni) ---
  async function downloadXLSX() {
    // Dinamik import: bundle’ı şişirmemek ve SSR sorunlarını önlemek için
    const XLSX = await import('xlsx')
    const rows = filtered.map(r => ({
      ID: r.id,
      'Ad Soyad': r.fullName,
      Telefon: r.phone ?? '',
      Cinsiyet: r.gender === 'female' ? 'Kadın' : r.gender === 'male' ? 'Erkek' :
                r.gender ? 'Belirtmek istemiyor' : '',
      'Pozisyon': r.positionApplied ?? '',
      'Çalışma Türü': r.workType ?? '',
      Not: r.message ?? '',
      Tarih: new Date(r.createdAt).toLocaleString(),
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Başvurular')
    const ab = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([ab], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `basvurular_${new Date().toISOString().slice(0,10)}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="max-w-5xl mx-auto p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <h1 className="text-2xl font-bold">Başvurular</h1>
          <div className="flex gap-2">
            <button onClick={load} className="rounded-lg border px-3 py-2 bg-white hover:bg-neutral-50">Yenile</button>
            <button onClick={downloadCSV} className="rounded-lg border px-3 py-2 bg-white hover:bg-neutral-50">CSV İndir</button>
            <button onClick={downloadXLSX} className="rounded-lg bg-black text-white px-3 py-2 hover:bg-neutral-800">Excel İndir</button>
          </div>
        </div>

        {/* Filtreler */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <input
            value={q} onChange={e=>setQ(e.target.value)}
            placeholder="Ara: ad, telefon, pozisyon, not…"
            className="rounded-lg border px-3 py-2 bg-white"
          />
          <select value={gender} onChange={e=>setGender(e.target.value)}
                  className="rounded-lg border px-3 py-2 bg-white">
            <option value="">Cinsiyet (tümü)</option>
            <option value="female">Kadın</option>
            <option value="male">Erkek</option>
            <option value="other">Belirtmek istemiyor</option>
          </select>
          <select value={workType} onChange={e=>setWorkType(e.target.value)}
                  className="rounded-lg border px-3 py-2 bg-white">
            <option value="">Çalışma Türü (tümü)</option>
            <option value="sabit">Sabit</option>
            <option value="sezonluk">Sezonluk</option>
            <option value="gunluk">Günlük</option>
            <option value="parttime">Part-Time</option>
          </select>
          <select value={order} onChange={e=>setOrder(e.target.value as any)}
                  className="rounded-lg border px-3 py-2 bg-white">
            <option value="desc">Tarih: Yeni → Eski</option>
            <option value="asc">Tarih: Eski → Yeni</option>
          </select>
        </div>

        {/* Sayım */}
        <div className="text-sm text-neutral-600 mb-2">
          Toplam: <b>{items.length}</b> · Filtrelenmiş: <b>{filtered.length}</b>
        </div>

        {/* Tablo */}
        <div className="overflow-x-auto bg-white border rounded-xl">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 border-b">
              <tr>
                <th className="text-left px-3 py-2">Ad Soyad</th>
                <th className="text-left px-3 py-2">Telefon</th>
                <th className="text-left px-3 py-2">Pozisyon</th>
                <th className="text-left px-3 py-2">Tür</th>
                <th className="text-left px-3 py-2">Cinsiyet</th>
                <th className="text-left px-3 py-2">Tarih</th>
                <th className="text-right px-3 py-2">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-neutral-500">Yükleniyor…</td></tr>
              ) : err ? (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-red-600">Hata: {err}</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-neutral-500">Kayıt yok</td></tr>
              ) : filtered.map(it => (
                <tr key={it.id} className="border-b last:border-0">
                  <td className="px-3 py-2">{it.fullName}</td>
                  <td className="px-3 py-2">{it.phone || '-'}</td>
                  <td className="px-3 py-2">{it.positionApplied || '-'}</td>
                  <td className="px-3 py-2">{it.workType || '-'}</td>
                  <td className="px-3 py-2">
                    {it.gender === 'female' ? 'Kadın' :
                     it.gender === 'male' ? 'Erkek' :
                     it.gender ? 'Belirtmek istemiyor' : '-'}
                  </td>
                  <td className="px-3 py-2">{new Date(it.createdAt).toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={()=>onDelete(it.id)}
                            className="rounded-lg border px-3 py-1.5 hover:bg-red-50 hover:border-red-400">
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </main>
  )
}