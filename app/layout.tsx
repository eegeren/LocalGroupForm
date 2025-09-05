import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Başvuru Formu",
  description: "Google Form benzeri başvuru formu",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="bg-gray-50 text-gray-800 antialiased">
        {children}
      </body>
    </html>
  );
}
