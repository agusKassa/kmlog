import type { Metadata } from 'next'
import { Cinzel, Crimson_Pro, DM_Sans } from 'next/font/google'
import './globals.css'
import { Navbar } from './_components/navbar'

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-cinzel',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

const crimsonPro = Crimson_Pro({
  subsets: ['latin'],
  variable: '--font-crimson',
  weight: ['300', '400', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'KMLog — King Maker Chronicles',
  description: 'Crónica digital de campaña Pathfinder 2e Remaster',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${cinzel.variable} ${crimsonPro.variable} ${dmSans.variable}`}
    >
      <body className="min-h-screen bg-[#0c0a09] text-stone-50 antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  )
}
