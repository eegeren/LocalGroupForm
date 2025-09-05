'use client'
import { useState } from 'react'

export default function AdminLogin() {
  const [pwd, setPwd] = useState('')
  const [err, setErr] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pwd })
    })
    if (res.ok) {
      location.href = '/admin'
    } else {
      const data = await res.json().catch(() => ({}))
      setErr(data?.error || 'Geçersiz parola')
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50">
      <form onSubmit={onSubmit} className="bg-white p-6 rounded-2xl shadow border border-neutral-200 w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold text-center">Admin Girişi</h1>
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <input
          type="password"
          value={pwd}
          onChange={(e)=>setPwd(e.target.value)}
          placeholder="Parola"
          className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"
          required
        />
        <button
          type="submit"
          className="w-full rounded-xl bg-black text-white px-4 py-2.5 hover:bg-neutral-800"
        >
          Giriş Yap
        </button>
      </form>
    </main>
  )
}
