'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Scroll, Users, Shield, Map, StickyNote } from 'lucide-react'

const navLinks = [
  { href: '/sessions', label: 'Sesiones', icon: Scroll },
  { href: '/characters', label: 'Personajes', icon: Users },
  { href: '/party', label: 'Party', icon: Shield },
  { href: '/map', label: 'Mapa', icon: Map },
  { href: '/notes', label: 'Notas', icon: StickyNote },
]

const AUTH_PATHS = ['/login', '/register']

export function Navbar() {
  const pathname = usePathname()

  if (AUTH_PATHS.includes(pathname)) return null

  return (
    <nav className="sticky top-0 z-50 border-b border-[#3c3330]/50 bg-[#0c0a09]/88 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-[60px] items-center justify-between gap-6">

          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-amber-500/30 bg-amber-500/10">
              <span className="font-display text-sm font-bold text-amber-500">K</span>
            </div>
            <div className="leading-tight">
              <div className="font-display text-[1rem] font-bold tracking-[0.1em] text-stone-50">KMLog</div>
              <div className="text-[0.55rem] uppercase tracking-[0.12em] text-stone-600">King Maker</div>
            </div>
          </Link>

          {/* Nav links */}
          <div className="hidden items-center gap-0.5 md:flex">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-[0.8rem] transition-colors ${
                    active
                      ? 'bg-amber-500/10 text-amber-500'
                      : 'text-stone-400 hover:bg-stone-800/60 hover:text-stone-100'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Link>
              )
            })}
          </div>

          {/* Auth buttons */}
          <div className="flex shrink-0 items-center gap-2.5">
            <Link
              href="/login"
              className="hidden items-center rounded-md border border-[#3c3330] px-3.5 py-1.5 text-[0.78rem] font-medium text-stone-400 transition-colors hover:border-stone-600 hover:bg-[#181412] hover:text-stone-100 sm:inline-flex"
            >
              Ingresar
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center rounded-md bg-amber-500 px-3.5 py-1.5 text-[0.78rem] font-medium text-stone-950 transition-colors hover:bg-amber-400"
            >
              Unirse
            </Link>
          </div>

        </div>
      </div>
    </nav>
  )
}
