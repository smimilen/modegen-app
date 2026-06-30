import type { Metadata } from 'next'
import './globals.css'
export const metadata: Metadata = {
  title: 'Mode(gen) — AI-фотосессии для маркетплейсов',
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body style={{ fontFamily: 'Nunito, system-ui, sans-serif' }}>{children}</body>
    </html>
  )
}
