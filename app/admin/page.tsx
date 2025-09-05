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
  positionApplied?: string | null
  workType?: string | null
  message: string
  status?: 'PENDING'|'REVIEWING'|'ACCEPTED'|'REJECTED'
  archived?: boolean
  createdAt: string
}

const DEFAULT_PAGESIZE = 20

export default function AdminPage() {
  const [rows, setRows] = useState<Item[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  // filters
  const [q, setQ] = useState('')
  const [gender, setGender] = useState('')
  const [workType, setWorkType] = useState('')
  const [status, setStatus] = useState('')
  const [archived, setArchived] = useState(false)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [order, setOrder] = useState<'desc'|'asc'>('desc')

  // pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGESIZE)

  const load = useCallback(async () => {
    setLoading(true); setErr('')
    try {
      const params = new URLSearchParams({
        q, gender, workType, status,
        archived: String(archived),
        from, to, order,
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
  }, [q, gender, workType, status, archived, from, to, order, page, pageSize])

  useEffect(() => { load() }, [load])

  const columns = useMemo<ColumnDef<Item>[]>(() => [
    { header: 'Ad Soyad', accessorKey: 'fullName',
      cell: info => <span className="font-medium">{info.getValue() as string}</span> },
    { header: 'Telefon', accessorKey: 'phone' },
    { header: 'Pozisyon', accessorKey: 'positionApplied' },
    { header: 'Tür', accessorKey: 'workType',
      cell: ({ getValue }) => {
        const v = (getValue() as string) || ''
        const map: any = { sabit:'bg-blue-100 text-blue-700',
          sezonluk:'bg-green-100 text-green-700',
          gunluk:'bg-yellow-100 text-yellow-700',
          parttime:'bg-purple-100 text-purple-700' }
        const cls = map[v] || 'bg-neutral-100 text-neutral-700'
        return <span className={`px-2 py-0.5 rounded-md text-xs ${cls}`}>{v || '-'}</span>
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
        return <span className={`px-2 py-0.5 rounded-md text-xs ${cls[s]}`}>{s}</span>
      } },
    { header: 'Tarih', accessorKey: 'createdAt',
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleString() },
    { header: 'İşlem',
      cell: ({ row }) => (
        <div className="flex gap-2 justify-end">
          <select
            defaultValue={row.original.status || 'PENDING'}
            onChange={e => patch(row.original.id, { status: e.target.value })}
            className="border rounded-lg px-2 py-1 text-sm"
          >
            <option value="PENDING">Beklemede</option>
            <option value="REVIEWING">İnceleniyor</option>
            <option value="ACCEPTED">Kabul</option>
            <option value="REJECTED">Reddet</option>
          </select>

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
    load()
  }

  // Export
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

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h1 className="text-2xl font-bold">Başvurular</h1>
          <div className="flex gap-2">
            <button onClick={load} className="rounded-lg border px-3 py-2 bg-white hover:bg-neutral-50">Yenile</button>
            <button onClick={downloadCSV} className="rounded-lg border px-3 py-2 bg-white hover:bg-neutral-50">CSV</button>
            <button onClick={downloadXLSX} className="rounded-lg bg-black text-white px-3 py-2 hover:bg-neutral-800">Excel</button>
          </div>
        </div>

        {/* Filtreler */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input value={q} onChange={e=>{ setQ(e.target.value); setPage(1)}}
                 placeholder="Ara: ad, tel, pozisyon, not…" className="rounded-lg border px-3 py-2 bg-white" />
          <select value={gender} onChange={e=>{ setGender(e.target.value); setPage(1)}}
                  className="rounded-lg border px-3 py-2 bg-white">
            <option value="">Cinsiyet (tümü)</option>
            <option value="female">Kadın</option>
            <option value="male">Erkek</option>
            <option value="other">Belirtmek istemiyor</option>
          </select>
          <select value={workType} onChange={e=>{ setWorkType(e.target.value); setPage(1)}}
                  className="rounded-lg border px-3 py-2 bg-white">
            <option value="">Tür (tümü)</option>
            <option value="sabit">Sabit</option>
            <option value="sezonluk">Sezonluk</option>
            <option value="gunluk">Günlük</option>
            <option value="parttime">Part-Time</option>
          </select>
          <select value={status} onChange={e=>{ setStatus(e.target.value); setPage(1)}}
                  className="rounded-lg border px-3 py-2 bg-white">
            <option value="">Durum (tümü)</option>
            <option value="PENDING">Beklemede</option>
            <option value="REVIEWING">İnceleniyor</option>
            <option value="ACCEPTED">Kabul</option>
            <option value="REJECTED">Reddet</option>
          </select>
        </div>

        {/* Tarih + sırala + arşiv */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <input type="date" value={from} onChange={e=>{ setFrom(e.target.value); setPage(1)}}
                 className="rounded-lg border px-3 py-2 bg-white" />
          <input type="date" value={to} onChange={e=>{ setTo(e.target.value); setPage(1)}}
                 className="rounded-lg border px-3 py-2 bg-white" />
          <select value={order} onChange={e=>{ setOrder(e.target.value as any); setPage(1)}}
                  className="rounded-lg border px-3 py-2 bg-white">
            <option value="desc">Tarih: Yeni → Eski</option>
            <option value="asc">Tarih: Eski → Yeni</option>
          </select>
          <select value={String(archived)} onChange={e=>{ setArchived(e.target.value==='true'); setPage(1)}}
                  className="rounded-lg border px-3 py-2 bg-white">
            <option value="false">Aktif</option>
            <option value="true">Arşiv</option>
          </select>
          <select value={String(pageSize)} onChange={e=>{ setPageSize(Number(e.target.value)); setPage(1)}}
                  className="rounded-lg border px-3 py-2 bg-white">
            {[10,20,50,100].map(n => <option key={n} value={n}>{n}/sayfa</option>)}
          </select>
          <div className="flex items-center text-sm text-neutral-600">Toplam: <b className="ml-1">{total}</b></div>
        </div>

        {/* Tablo */}
        <div className="overflow-x-auto bg-white border rounded-xl">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 border-b sticky top-0">
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id}>
                  {hg.headers.map(h => (
                    <th key={h.id} className="text-left px-3 py-2">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={columns.length} className="px-3 py-8 text-center text-neutral-500">Yükleniyor…</td></tr>
              ) : err ? (
                <tr><td colSpan={columns.length} className="px-3 py-8 text-center text-red-600">Hata: {err}</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={columns.length} className="px-3 py-8 text-center text-neutral-500">Kayıt yok</td></tr>
              ) : table.getRowModel().rows.map(row => (
                <tr key={row.id} className="border-b last:border-0">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-3 py-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sayfalama */}
        <div className="flex items-center justify-between gap-3">
          <button onClick={() => setPage(p => Math.max(1, p-1))}
                  disabled={page<=1}
                  className="rounded-lg border px-3 py-2 bg-white disabled:opacity-50">
            ‹ Önceki
          </button>
          <div className="text-sm">
            Sayfa <b>{page}</b> / {pageCount}
          </div>
          <button onClick={() => setPage(p => Math.min(pageCount, p+1))}
                  disabled={page>=pageCount}
                  className="rounded-lg border px-3 py-2 bg-white disabled:opacity-50">
            Sonraki ›
          </button>
        </div>
      </div>
    </main>
  )
}
