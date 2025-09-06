'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ColumnDef, flexRender,
  getCoreRowModel, getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'

type Item = {
  id: string
  fullName: string
  phone?: string | null
  gender?: string | null
  address?: string | null
  birthDate?: string | null
  positionApplied?: string | null
  workType?: string | null
  shiftAvailability?: string | null
  educationLevel?: string | null
  foreignLanguages?: string | null
  prevCompany?: string | null
  prevTitle?: string | null
  prevDuration?: string | null
  prevReason?: string | null
  message: string
  status?: 'PENDING'|'REVIEWING'|'ACCEPTED'|'REJECTED'
  archived?: boolean
  consent?: boolean
  createdAt: string
}

type Event = {
  id: string
  type: 'NOTE'|'STATUS_CHANGE'|'ARCHIVE_CHANGE'|'FIELD_CHANGE'
  note?: string | null
  field?: string | null
  oldValue?: string | null
  newValue?: string | null
  createdAt: string
}

const DEFAULT_PAGESIZE = 20

export default function AdminPage() {
  // data
  const [rows, setRows] = useState<Item[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  // filters (sadece arama)
  const [q, setQ] = useState('')

  // pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGESIZE)

  // detail panel
  const [open, setOpen] = useState(false)
  const [detail, setDetail] = useState<{item: Item, events: Event[]} | null>(null)
  const [note, setNote] = useState('')

  // fetch
  const load = useCallback(async () => {
    setLoading(true); setErr('')
    try {
      const params = new URLSearchParams({
        q,
        page: String(page),
        pageSize: String(pageSize)
      })
      const res = await fetch(`/api/admin?${params.toString()}`, { cache: 'no-store' })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || 'server error')
      setRows(json.items || [])
      setTotal(json.total || 0)
    } catch (e:any) {
      setErr(e?.message || 'Yükleme hatası')
    } finally { setLoading(false) }
  }, [q, page, pageSize])

  useEffect(() => { load() }, [load])

  // columns
  const columns = useMemo<ColumnDef<Item>[]>(() => [
    { header: 'Ad Soyad', accessorKey: 'fullName',
      cell: info => <span className="font-medium">{info.getValue() as string}</span> },
    { header: 'Telefon', accessorKey: 'phone',
      cell: ({getValue}) => <span className="whitespace-nowrap">{getValue() as string || '-'}</span> },
    { header: 'Pozisyon', accessorKey: 'positionApplied',
      cell: ({getValue}) => getValue() as string || '-' },
    { header: 'Tür', accessorKey: 'workType',
      cell: ({ getValue }) => {
        const v = (getValue() as string) || ''
        const map: Record<string,string> = {
          sabit: 'bg-blue-100 text-blue-700',
          sezonluk: 'bg-green-100 text-green-700',
          gunluk: 'bg-yellow-100 text-yellow-700',
          parttime: 'bg-purple-100 text-purple-700'
        }
        const cls = map[v] || 'bg-neutral-100 text-neutral-700'
        return <span className={`px-2 py-0.5 rounded-md text-[11px] ${cls}`}>{v || '-'}</span>
      } },
    { header: 'Cinsiyet', accessorKey: 'gender',
      cell: ({ getValue }) => {
        const g = getValue() as string
        return g === 'female' ? 'Kadın' : g === 'male' ? 'Erkek' : g ? 'Belirtmek istemiyor' : '-'
      } },
    { header: 'Durum', accessorKey: 'status',
      cell: ({ row }) => {
        const s = row.original.status || 'PENDING'
        const cls: any = {
          PENDING: 'bg-neutral-100 text-neutral-700',
          REVIEWING: 'bg-amber-100 text-amber-700',
          ACCEPTED: 'bg-emerald-100 text-emerald-700',
          REJECTED: 'bg-rose-100 text-rose-700',
        }
        return <span className={`px-2 py-0.5 rounded-md text-[11px] ${cls[s]}`}>{s}</span>
      } },
    { header: 'Tarih', accessorKey: 'createdAt',
      cell: ({ getValue }) =>
        <span className="whitespace-nowrap">{new Date(getValue() as string).toLocaleString()}</span> },
    { header: 'İşlem',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-2 justify-end">
          <button
            onClick={() => openDetails(row.original.id)}
            className="border rounded-lg px-2 py-1 text-sm"
          >
            Detay
          </button>
          <button
            onClick={() => patch(row.original.id, { archived: !row.original.archived })}
            className="border rounded-lg px-2 py-1 text-sm"
          >
            {row.original.archived ? 'Arşivden Çıkar' : 'Arşivle'}
          </button>
          <button
            onClick={() => onDelete(row.original.id)}
            className="border rounded-lg px-2 py-1 text-sm hover:bg-red-50 hover:border-red-400"
          >
            Sil
          </button>
        </div>
      ) },
  ], [])

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  // actions
  async function onDelete(id: string) {
    if (!confirm('Bu başvuruyu silmek istiyor musun?')) return
    const res = await fetch(`/api/admin/${id}`, { method: 'DELETE' })
    const json = await res.json().catch(()=>({}))
    if (!res.ok || !json.ok) return alert('Silinemedi')
    load()
  }
  async function patch(id: string, body: any) {
    const res = await fetch(`/api/admin/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const json = await res.json().catch(()=>({}))
    if (!res.ok || !json.ok) return alert('Güncellenemedi')
    if (detail?.item.id === id) await openDetails(id)
    load()
  }

  async function openDetails(id: string) {
    try {
      const res = await fetch(`/api/admin/${id}`)
      const json = await res.json()
      if (!json.ok) { alert(json.error || 'detay hatası'); return }
      setDetail({ item: json.item, events: json.events })
      setOpen(true)
    } catch {
      alert('Detay getirilemedi')
    }
  }

  async function addNote() {
    if (!detail?.item?.id) return
    const text = note.trim()
    if (text.length < 2) return
    const res = await fetch(`/api/admin/${detail.item.id}/note`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: text })
    })
    const json = await res.json()
    if (!res.ok || !json.ok) { alert('Not eklenemedi'); return }
    setNote('')
    await openDetails(detail.item.id)
  }

  // export
  function toCSV(data: Item[]) {
    const esc = (v:any) => `"${(v??'').toString().replace(/"/g,'""')}"`
    const header = ['id','Ad Soyad','Telefon','Cinsiyet','Pozisyon','Tür','Durum','Not','Tarih']
    const lines = [header.join(',')]
    for (const r of data) {
      lines.push([
        r.id, r.fullName, r.phone??'', r.gender??'', r.positionApplied??'',
        r.workType??'', r.status??'PENDING', r.message??'',
        new Date(r.createdAt).toLocaleString()
      ].map(esc).join(','))
    }
    return lines.join('\n')
  }
  function downloadCSV() {
    const csv = toCSV(rows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `basvurular_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }
  async function downloadXLSX() {
    const XLSX = await import('xlsx')
    const mapped = rows.map(r => ({
      ID: r.id,
      'Ad Soyad': r.fullName,
      Telefon: r.phone ?? '',
      Cinsiyet: r.gender === 'female' ? 'Kadın' : r.gender === 'male' ? 'Erkek' : (r.gender ? 'Belirtmek istemiyor' : ''),
      Pozisyon: r.positionApplied ?? '',
      'Çalışma Türü': r.workType ?? '',
      Durum: r.status ?? 'PENDING',
      Not: r.message ?? '',
      Tarih: new Date(r.createdAt).toLocaleString(),
    }))
    const ws = XLSX.utils.json_to_sheet(mapped)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Başvurular')
    const ab = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([ab], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `basvurular_${new Date().toISOString().slice(0,10)}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  // logout
  const logout = useCallback(async () => {
    try { await fetch('/api/admin/logout', { method: 'POST' }) } catch {}
    try { await fetch('/api/logout', { method: 'POST' }) } catch {}
    document.cookie = 'admin=; Max-Age=0; path=/'
    document.cookie = 'token=; Max-Age=0; path=/'
    document.cookie = 'lg_admin=; Max-Age=0; path=/'
    window.location.href = '/'
  }, [])

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="rounded-2xl bg-white border shadow-sm p-4 md:p-6">

          {/* Üst satır: başlık + sağda çıkış */}
          <div className="mb-4 flex items-center justify-between gap-3">
            <h1 className="text-2xl font-bold">Başvurular</h1>
            <button
              onClick={logout}
              className="rounded-lg border px-3 py-2 bg-white hover:bg-neutral-50"
            >
              Çıkış Yap
            </button>
          </div>

          {/* Araç çubuğu */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <input
              value={q}
              onChange={e=>{ setQ(e.target.value); setPage(1)}}
              placeholder="İsim, telefon veya pozisyon ara…"
              className="w-full sm:w-[380px] rounded-lg border px-3 py-2 bg-white"
            />

            <div className="flex items-center gap-2">
              <button onClick={load} className="rounded-lg border px-3 py-2 bg-white hover:bg-neutral-50">Yenile</button>
              <button onClick={downloadCSV} className="rounded-lg border px-3 py-2 bg-white hover:bg-neutral-50">CSV</button>
              <button onClick={downloadXLSX} className="rounded-lg bg-black text-white px-3 py-2 hover:bg-neutral-800">Excel</button>
            </div>
          </div>

          {/* Tablo */}
          <div className="overflow-x-auto">
            <table className="min-w-[1000px] table-auto text-sm">
              <thead className="bg-neutral-50 border-b">
                {table.getHeaderGroups().map(hg => (
                  <tr key={hg.id}>
                    {hg.headers.map(h => (
                      <th key={h.id} className="text-left px-4 py-3 whitespace-nowrap">
                        {flexRender(h.column.columnDef.header, h.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-neutral-500">Yükleniyor…</td></tr>
                ) : err ? (
                  <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-red-600">Hata: {err}</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-neutral-500">Kayıt yok</td></tr>
                ) : table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="border-b last:border-0 odd:bg-white even:bg-neutral-50/60">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-4 py-3 align-middle whitespace-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sayfalama */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <button onClick={() => setPage(p => Math.max(1, p-1))}
                    disabled={page<=1}
                    className="rounded-lg border px-3 py-2 bg-white disabled:opacity-50">
              ‹ Önceki
            </button>

            <div className="flex items-center gap-3 text-sm">
              <div>Sayfa <b>{page}</b> / {pageCount}</div>
              <select
                value={String(pageSize)}
                onChange={e=>{ setPageSize(Number(e.target.value)); setPage(1)}}
                className="rounded-lg border px-2 py-1 bg-white"
              >
                {[10,20,50,100].map(n => <option key={n} value={n}>{n}/sayfa</option>)}
              </select>
            </div>

            <button onClick={() => setPage(p => Math.min(pageCount, p+1))}
                    disabled={page>=pageCount}
                    className="rounded-lg border px-3 py-2 bg-white disabled:opacity-50">
              Sonraki ›
            </button>
          </div>
        </div>
      </div>

      {/* Detay Paneli */}
      {open && detail && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-xl p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold">Başvuru Detayı</h2>
              <button onClick={() => setOpen(false)} className="border rounded-lg px-3 py-1.5">Kapat</button>
            </div>

            {/* Alanlar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 text-sm">
              {([
                ['Ad Soyad', detail.item.fullName],
                ['Telefon', detail.item.phone || '-'],
                ['Cinsiyet', detail.item.gender === 'female' ? 'Kadın' : detail.item.gender === 'male' ? 'Erkek' : (detail.item.gender ? 'Belirtmek istemiyor' : '-')],
                ['Adres', detail.item.address || '-'],
                ['Doğum Tarihi', detail.item.birthDate ? new Date(detail.item.birthDate).toLocaleDateString() : '-'],
                ['Pozisyon', detail.item.positionApplied || '-'],
                ['Çalışma Türü', detail.item.workType || '-'],
                ['Vardiya', detail.item.shiftAvailability || '-'],
                ['Eğitim Durumu', detail.item.educationLevel || '-'],
                ['Yabancı Diller', detail.item.foreignLanguages || '-'],
                ['Önceki İşletme', detail.item.prevCompany || '-'],
                ['Görev/Ünvan', detail.item.prevTitle || '-'],
                ['Çalışma Süresi', detail.item.prevDuration || '-'],
                ['Ayrılma Sebebi', detail.item.prevReason || '-'],
                ['Durum', detail.item.status || 'PENDING'],
                ['Arşiv', detail.item.archived ? 'Evet' : 'Hayır'],
                ['KVKK Onayı', detail.item.consent ? 'Evet' : 'Hayır'],
                ['Kayıt Tarihi', new Date(detail.item.createdAt).toLocaleString()],
              ] as [string,string][]).map(([k,v]) => (
                <div key={k} className="border rounded-lg p-2">
                  <div className="text-neutral-500">{k}</div>
                  <div className="font-medium">{v}</div>
                </div>
              ))}
              <div className="sm:col-span-2 border rounded-lg p-2">
                <div className="text-neutral-500">Ek Not (Başvuran)</div>
                <div className="font-medium whitespace-pre-wrap">{detail.item.message || '-'}</div>
              </div>
            </div>

            {/* Not Ekle */}
            <div className="mb-6">
              <div className="text-sm font-semibold mb-2">Admin Notu Ekle</div>
              <div className="flex gap-2">
                <textarea rows={2} value={note} onChange={e=>setNote(e.target.value)}
                          placeholder="Not yazın…" className="flex-1 border rounded-lg p-2" />
                <button onClick={addNote} className="border rounded-lg px-3 py-2 bg-black text-white">Ekle</button>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <div className="text-sm font-semibold mb-2">Geçmiş / Timeline</div>
              <div className="space-y-2">
                {detail.events.length === 0 ? (
                  <div className="text-sm text-neutral-500">Henüz geçmiş yok.</div>
                ) : detail.events.map(ev => (
                  <div key={ev.id} className="border rounded-lg p-2 text-sm">
                    <div className="text-neutral-500">{new Date(ev.createdAt).toLocaleString()}</div>
                    {ev.type === 'NOTE' && (
                      <div><b>Not:</b> {ev.note}</div>
                    )}
                    {ev.type !== 'NOTE' && (
                      <div>
                        <b>{ev.type}</b>{ev.field ? ` (${ev.field})` : ''}: {ev.oldValue ?? '-'} → {ev.newValue ?? '-'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </main>
  )
}