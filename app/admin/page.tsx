'use client'
import { useEffect, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender
} from '@tanstack/react-table'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"

type Item = {
  id: string
  fullName: string
  phone?: string
  gender?: string
  workType?: string
  createdAt: string
}

export default function AdminPage() {
  const [data, setData] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin')
      .then(r => r.json())
      .then(json => { if (json.ok) setData(json.items) })
      .finally(() => setLoading(false))
  }, [])

  const columns = [
    {
      header: "Ad Soyad",
      accessorKey: "fullName",
    },
    {
      header: "Telefon",
      accessorKey: "phone",
    },
    {
      header: "Cinsiyet",
      accessorKey: "gender",
      cell: ({ row }: any) => {
        const g = row.original.gender
        return g === 'female' ? <Badge variant="pink">Kadın</Badge>
          : g === 'male' ? <Badge variant="blue">Erkek</Badge>
          : <Badge variant="secondary">Belirtmek istemiyor</Badge>
      }
    },
    {
      header: "Tür",
      accessorKey: "workType",
      cell: ({ row }: any) => {
        const type = row.original.workType
        const colors: Record<string, string> = {
          sabit: "default",
          sezonluk: "green",
          gunluk: "yellow",
          parttime: "purple"
        }
        return <Badge variant={colors[type] || "secondary"}>{type}</Badge>
      }
    },
    {
      header: "Tarih",
      accessorKey: "createdAt",
      cell: ({ row }: any) => new Date(row.original.createdAt).toLocaleDateString()
    }
  ]

  const table = useReactTable({
    data, columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Başvurular</h1>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(hg => (
              <TableRow key={hg.id}>
                {hg.headers.map(h => (
                  <TableHead key={h.id}>
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5}>Yükleniyor…</TableCell></TableRow>
            ) : table.getRowModel().rows.map(row => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center mt-4">
        <Button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Önceki
        </Button>
        <span>Sayfa {table.getState().pagination.pageIndex + 1}</span>
        <Button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Sonraki
        </Button>
      </div>
    </div>
  )
}