import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Local Group",
  description: "Başvuru Formu",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className="h-full">
      <body className="min-h-[100svh] flex flex-col bg-white text-black">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
          <div className="mx-auto max-w-5xl px-4 min-h-[96px] h-24 flex items-center justify-between">
            <a href="/" className="inline-flex items-center gap-3">
              {/* Sol üst logo */}
              <img
                src="/logo.png"
                alt="Local Group"
                height={80}
                style={{
                  height: 80,
                  width: "auto",
                  display: "block",
                  objectFit: "contain",
                }}
              />
              <span className="sr-only">Local Group</span>
            </a>

            <a
              href="/admin"
              className="inline-flex items-center rounded-lg border px-3 py-1.5 text-sm hover:bg-neutral-50"
            >
              Yönetici Girişi
            </a>
          </div>
        </header>

        {/* İçerik */}
        <main className="grow pb-12">
          {children}
        </main>
      </body>
    </html>
  )
}
