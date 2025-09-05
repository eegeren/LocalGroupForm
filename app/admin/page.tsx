'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type Submission = {
  id: string
  fullName: string
  phone?: string | null
  gender?: string | null
  birthDate?: string | null
  address?: string | null
  educationLevel?: string | null
  foreignLanguages?: string | null
  positionApplied?: string | null
  workType?: string | null
  shiftAvailability?: string | null
  prevCompany?: string | null
  prevTitle?: string | null
  prevDuration?: string | null
  prevReason?: string | null
  message: string
  createdAt: string
}

export default function AdminPage() {
  const [items, setItems] = useState<Submission[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  async function fetchData() {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/admin', { cache: 'no-store' })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || 'fetch error')
      setItems(json.items || [])
    } catch (e:any) {
      setError(e?.message || 'fetch error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  async function handleDelete(id: string) {
    if (!confirm('Bu başvuruyu silmek istediğinize emin misiniz?')) return
    try {
      const res = await fetch(`/api/admin/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || 'delete error')
      setItems(prev => prev.filter(x => x.id !== id))
    } catch (e:any) {
      alert('Silme hatası: ' + (e?.message || 'delete error'))
    }
  }

  // CSV dışa aktarım
  const csvText = useMemo(() => {
    if (!items.length) return ''
    const headers = [
      'id','fullName','phone','gender','birthDate','address',
      'educationLevel','foreignLanguages',
      'positionApplied','workType','shiftAvailability',
      'prevCompany','prevTitle','prevDuration','prevReason',
      'message','createdAt'
    ]
    const rows = items.map(it => headers.map(h => {
      const v = (it as any)[h] ?? ''
      // CSV güvenli: çift tırnakla sar, içteki tırnakları kaçır
      const s = String(v).replace(/"/g, '""')
      return `"${s}"`
    }).join(','))
    return [headers.join(','), ...rows].join('\n')
  }, [items])

  function downloadCSV() {
    if (!csvText) return
    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const date = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')
    a.download = `submissions-${date}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      {/* Üst bar */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="font-semibold">Yönetici Paneli</div>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadCSV}
              className="text-sm px-3 py-1.5 rounded-lg border bg-white hover:bg-neutral-50"
              disabled={!items.length}
              title={items.length ? 'CSV indir' : 'Kayıt yok'}
            >
              CSV Dışa Aktar
            </button>
            <Link href="/" className="text-sm px-3 py-1.5 rounded-lg border bg-white hover:bg-neutral-50">
              Forma Dön
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Başvurular</h1>
          <button
            onClick={fetchData}
            className="px-4 py-2 rounded-lg bg-black text-white hover:bg-neutral-800 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? 'Yükleniyor…' : 'Yenile'}
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 text-red-700 p-3">
            Hata: {error}
          </div>
        )}

        {!items.length && !loading ? (
          <div className="text-neutral-500">Kayıt bulunamadı.</div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-2xl border">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-neutral-100 text-neutral-700">
                  <th className="px-3 py-2 text-left">Ad Soyad</th>
                  <th className="px-3 py-2 text-left">Pozisyon</th>
                  <th className="px-3 py-2 text-left">Tür</th>
                  <th className="px-3 py-2 text-left">Telefon</th>
                  <th className="px-3 py-2 text-left">Tarih</th>
                  <th className="px-3 py-2 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map(it => (
                  <tr key={it.id} className="hover:bg-neutral-50 align-top">
                    <td className="px-3 py-2">
                      <div className="font-medium">{it.fullName}</div>
                      <div className="text-xs text-neutral-500">{it.address || '-'}</div>
                    </td>
                    <td className="px-3 py-2">{it.positionApplied || '-'}</td>
                    <td className="px-3 py-2">{it.workType || '-'}</td>
                    <td className="px-3 py-2">{it.phone || '-'}</td>
                    <td className="px-3 py-2">
                      {new Date(it.createdAt).toLocaleString('tr-TR')}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-2">
                        <details className="group">
                          <summary className="cursor-pointer select-none text-blue-600 hover:underline text-sm">
                            Detay
                          </summary>
                          <div className="mt-2 p-3 bg-white border rounded-xl shadow-sm w-[80vw] max-w-3xl">
                            <h3 className="font-semibold mb-2">Başvuru Detayı</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <Field label="Cinsiyet" value={it.gender}/>
                              <Field label="Doğum Tarihi" value={it.birthDate}/>
                              <Field label="Eğitim Durumu" value={it.educationLevel}/>
                              <Field label="Yabancı Dil" value={it.foreignLanguages}/>
                              <Field label="Çalışma Türü" value={it.workType}/>
                              <Field label="Vardiya Uygunluğu" value={it.shiftAvailability}/>
                              <Field label="Çalışılan İşletme" value={it.prevCompany}/>
                              <Field label="Görev / Pozisyon" value={it.prevTitle}/>
                              <Field label="Çalışma Süresi" value={it.prevDuration}/>
                              <Field label="Ayrılma Sebebi" value={it.prevReason}/>
                              <div className="md:col-span-2">
                                <Field label="Adres" value={it.address}/>
                              </div>
                              <div className="md:col-span-2">
                                <Field label="Mesaj" value={it.message}/>
                              </div>
                            </div>
                          </div>
                        </details>

                        <button
                          onClick={() => handleDelete(it.id)}
                          className="px-3 py-1.5 rounded-lg border text-red-600 hover:bg-red-50"
                          title="Sil"
                        >
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}

function Field({ label, value }:{ label:string, value:any }) {
  return (
    <div className="space-y-1">
      <div className="text-neutral-500 text-xs">{label}</div>
      <div className="text-neutral-900 text-sm">{value || '-'}</div>
    </div>
  )
}
