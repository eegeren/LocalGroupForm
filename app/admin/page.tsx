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
      let json: any = {}
      try { json = JSON.parse(text) } catch { throw new Error('JSON parse') }
      if (!res.ok || !json.ok) throw new Error(json.error || res.statusText)
      setItems(json.items || [])
    } catch (e: any) {
      setErr(e?.message || 'Sunucu hatası')
    }
  }

  useEffect(() => { fetchData() }, [])

  const filtered = useMemo(() => {
    if (!q) return items
    const s = q.toLowerCase()
    return items.filter((it:any) =>
      [it.fullName, it.phone, it.subject, it.message, it.positionApplied, it.address]
        .filter(Boolean).some((v:string) => v.toLowerCase().includes(s))
    )
  }, [items, q])

  async function deleteItem(id: string) {
    if (!id) return alert('Kayıt id bulunamadı.')
    if (!confirm('Bu başvuruyu silmek istiyor musun?')) return

    const prev = items
    setItems(prev => prev.filter(x => x.id !== id))
    try {
      const res = await fetch(`/api/admin/${encodeURIComponent(id)}`, { method: 'DELETE' })
      const text = await res.text()
      let json:any = {}
      try { json = JSON.parse(text) } catch {}
      if (!res.ok || !json.ok) throw new Error(json.error || res.statusText)
    } catch (e:any) {
      alert('Silme başarısız: ' + (e?.message || 'hata'))
      setItems(prev) // geri al
    }
  }

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Gönderimler</h1>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ara…"
          className="w-64 rounded-xl border border-neutral-300 bg-white px-3 py-2"
        />
      </div>

      {err && <div className="p-3 rounded-md border border-red-300 bg-red-50 text-red-700 text-sm">{err}</div>}

      <div className="bg-white rounded-2xl shadow border border-neutral-200 divide-y">
        {filtered.map((it:any) => (
          <div key={it.id} className="py-4 px-4">
            <div className="flex items-center justify-between">
              <div className="text-xs text-neutral-500">{new Date(it.createdAt).toLocaleString('tr-TR')}</div>
              <button onClick={() => deleteItem(it.id)} className="rounded-lg px-3 py-1.5 text-sm border border-red-300 text-red-700 hover:bg-red-50">
                Sil
              </button>
            </div>
            <div className="mt-1 font-semibold">{it.fullName} {it.phone ? `— ${it.phone}` : ''}</div>
            <div className="mt-2 text-neutral-700 whitespace-pre-wrap">{it.subject} — {it.message}</div>
          </div>
        ))}
        {filtered.length === 0 && <div className="py-10 text-center text-neutral-500">Kayıt bulunamadı.</div>}
      </div>
    </main>
  )
}
