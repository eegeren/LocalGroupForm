'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type Row = {
  id: string
  fullName: string
  phone?: string | null
  positionApplied?: string | null
  gender?: string | null
  createdAt: string | Date
  employmentType?: string | null
  workType?: string | null
  // Derlenmiş alan (UI tarafında hesaplayacağız)
  type?: string | null
}

type AdminListResp = {
  ok: boolean
  total: number
  items: Row[]
  page: number
  pageSize: number
  error?: string
}

type DetailResp = {
  ok: boolean
  item?: any
  error?: string
}

export default function AdminPage() {
  // ------- UI state
  const [q, setQ] = useState('')
  const [gender, setGender] = useState('')
  const [workType, setWorkType] = useState('')
  const [sort, setSort] = useState<'new' | 'old'>('new')

  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<Row[]>([])
  const [total, setTotal] = useState(0)

  const [detail, setDetail] = useState<any | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // ------- helpers
  const typeOfRow = (r: Row) => r.type ?? r.employmentType ?? r.workType ?? '-'
  const fmtDate = (d: string | Date) => {
    const dt = new Date(d)
    const p2 = (n: number) => n.toString().padStart(2, '0')
    return `${p2(dt.getDate())}.${p2(dt.getMonth() + 1)}.${dt.getFullYear()} ${p2(dt.getHours())}:${p2(dt.getMinutes())}:${p2(dt.getSeconds())}`
  }

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (gender) params.set('gender', gender)
      if (workType) params.set('workType', workType)
      params.set('sort', sort)

      const res = await fetch(`/api/admin?${params.toString()}`, { cache: 'no-store' })
      const json: AdminListResp = await res.json()

      if (!json.ok) throw new Error(json.error || 'Liste okunamadı')

      // UI tarafında tip alanını normalize et
      const normalized = json.items.map((r) => ({ ...r, type: r.employmentType ?? r.workType ?? null }))
      setRows(normalized)
      setTotal(json.total)
    } catch (e) {
      console.error(e)
      // Hata olsa da UX'i bloklamayalım
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // ilk açılış

  // Arama / filtre değişince anında getir
  useEffect(() => {
    const t = setTimeout(load, 200)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, gender, workType, sort])

  async function onDelete(id: string) {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    const prev = rows
    setRows((s) => s.filter((x) => x.id !== id))
    try {
      const res = await fetch(`/api/admin/${id}`, { method: 'DELETE' })
      const j = await res.json()
      if (!j.ok) throw new Error(j.error || 'Silme başarısız')
    } catch (e) {
      alert('Silinemedi, tekrar deneyin.')
      setRows(prev) // geri al
    }
  }

  async function openDetail(id: string) {
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/admin/${id}`, { cache: 'no-store' })
      const json: DetailResp = await res.json()
      if (!json.ok) throw new Error(json.error || 'Detay okunamadı')
      setDetail(json.item || null)
    } catch (e) {
      alert('Detay alınamadı.')
    } finally {
      setDetailLoading(false)
    }
  }

  function exportCSV() {
    const header = [
      'id',
      'Ad Soyad',
      'Telefon',
      'Pozisyon',
      'Tür',
      'Cinsiyet',
      'Tarih',
    ]
    const lines = rows.map((r) => [
      r.id,
      r.fullName ?? '',
      r.phone ?? '',
      r.positionApplied ?? '',
      typeOfRow(r) ?? '',
      r.gender ?? '',
      fmtDate(r.createdAt),
    ])
    const csv = [header, ...lines].map((arr) =>
      arr.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
    ).join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `basvurular-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredCountText = useMemo(() => {
    // total backend'den geliyor; rows şu an gösterilen sayfa (biz tek sayfa getiriyoruz)
    if (!total) return 'Toplam: 0'
    if (rows.length === total && !q && !gender && !workType) return `Toplam: ${total}`
    return `Toplam: ${total} • Görüntülenen: ${rows.length}`
  }, [rows, total, q, gender, workType])

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-6xl p-4 sm:p-6">
        {/* Üst bar */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">Başvurular</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-neutral-100"
            >
              CSV Dışa Aktar
            </button>
            <Link
              href="/"
              className="rounded-lg bg-black px-3 py-2 text-sm text-white hover:bg-neutral-800"
            >
              Forma Dön
            </Link>
            <button
              onClick={load}
              className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-neutral-100"
            >
              Yenile
            </button>
          </div>
        </div>

        {/* Filtre bar */}
        <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ara: ad, telefon, pozisyon…"
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
          />
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Cinsiyet (tümü)</option>
            <option value="female">Kadın</option>
            <option value="male">Erkek</option>
            <option value="other">Diğer</option>
          </select>
          <select
            value={workType}
            onChange={(e) => setWorkType(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Çalışma Türü (tümü)</option>
            <option value="sabit">Sabit</option>
            <option value="sezonluk">Sezonluk</option>
            <option value="gunluk">Günlük</option>
            <option value="parttime">Part-Time</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as 'new' | 'old')}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
          >
            <option value="new">Tarih: Yeni → Eski</option>
            <option value="old">Tarih: Eski → Yeni</option>
          </select>
        </div>

        <div className="mb-2 text-xs text-neutral-500">{filteredCountText}</div>

        {/* Tablo */}
        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-100 text-left text-neutral-700">
                <tr>
                  <th className="sticky left-0 z-10 bg-neutral-100 px-4 py-3">Ad Soyad</th>
                  <th className="px-4 py-3">Pozisyon</th>
                  <th className="px-4 py-3">Tür</th>
                  <th className="px-4 py-3">Telefon</th>
                  <th className="px-4 py-3">Tarih</th>
                  <th className="px-4 py-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((r, idx) => (
                  <tr key={r.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}>
                    <td className="sticky left-0 z-10 bg-inherit px-4 py-3 font-medium">{r.fullName || '-'}</td>
                    <td className="px-4 py-3">{r.positionApplied || '-'}</td>
                    <td className="px-4 py-3">{typeOfRow(r) || '-'}</td>
                    <td className="px-4 py-3">{r.phone || '-'}</td>
                    <td className="px-4 py-3">{fmtDate(r.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openDetail(r.id)}
                          className="rounded-lg border px-2.5 py-1.5 hover:bg-neutral-100"
                        >
                          Detay
                        </button>
                        <button
                          onClick={() => onDelete(r.id)}
                          className="rounded-lg border border-red-300 bg-red-50 px-2.5 py-1.5 text-red-700 hover:bg-red-100"
                        >
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-neutral-500">
                      {loading ? 'Yükleniyor…' : 'Kayıt bulunamadı.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detay Paneli (slide-over) */}
      {(detailLoading || detail) && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDetail(null)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-lg font-semibold">Başvuru Detayı</h2>
              <button
                onClick={() => setDetail(null)}
                className="rounded-lg border px-3 py-1.5 text-sm hover:bg-neutral-50"
              >
                Kapat
              </button>
            </div>

            <div className="h-[calc(100%-56px)] overflow-y-auto p-5">
              {detailLoading && <div className="text-sm text-neutral-500">Yükleniyor…</div>}
              {detail && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {([
                    ['Ad Soyad', detail.fullName],
                    ['Telefon', detail.phone],
                    ['Cinsiyet', detail.gender],
                    ['Doğum Tarihi', detail.birthDate],
                    ['Adres', detail.address],
                    ['Pozisyon', detail.positionApplied],
                    ['Çalışma Türü', detail.workType ?? detail.employmentType],
                    ['Vardiya Uygunluğu', detail.shiftAvailability],
                    ['Eğitim Durumu', detail.educationLevel],
                    ['Yabancı Dil', detail.foreignLanguages],
                    ['Çalışılan İşletme', detail.prevCompany],
                    ['Görev / Pozisyon', detail.prevTitle],
                    ['Çalışma Süresi', detail.prevDuration],
                    ['Ayrılma Sebebi', detail.prevReason],
                    ['Mesaj', detail.message],
                    ['Tarih', fmtDate(detail.createdAt)],
                  ] as [string, any][]).map(([label, val]) => (
                    <div key={label} className="rounded-lg border bg-white p-3">
                      <div className="text-xs text-neutral-500">{label}</div>
                      <div className="mt-1 text-sm">{val ? String(val) : '-'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
