'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Scroll, Users, Shield, Map, StickyNote } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

const navLinks = [
  { href: '/sessions',   label: 'Sesiones',   icon: Scroll },
  { href: '/characters', label: 'Personajes',  icon: Users },
  { href: '/party',      label: 'Party',       icon: Shield },
  { href: '/map',        label: 'Mapa',        icon: Map },
  { href: '/notes',      label: 'Notas',       icon: StickyNote },
]

const AUTH_PATHS = ['/login', '/register']

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading, isGm, isAuthenticated } = useAuth()

  if (AUTH_PATHS.includes(pathname)) return null

  function handleLogout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    router.push('/')
    router.refresh()
  }

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

            {/* GM link — solo si es gm */}
            {!loading && isGm && (
              <Link
                href="/gm"
                className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-[0.8rem] transition-colors ${
                  pathname.startsWith('/gm')
                    ? 'bg-red-500/10 text-red-400'
                    : 'text-stone-600 hover:bg-stone-800/60 hover:text-red-400'
                }`}
              >
                <span className="text-[0.7rem]">⚙</span>
                GM
              </Link>
            )}
          </div>

          {/* Auth area */}
          <div className="flex shrink-0 items-center gap-2.5">
            {loading ? (
              <div className="h-7 w-16 animate-pulse rounded-md bg-[#181412]" />
            ) : isAuthenticated ? (
              <>
                {/* User badge */}
                <div className="hidden items-center gap-2 sm:flex">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#3c3330] bg-[#181412] font-display text-[0.65rem] font-bold text-amber-500">
                    {user!.email.charAt(0).toUpperCase()}
                  </div>
                  {isGm && (
                    <span className="rounded border border-red-500/20 bg-red-500/8 px-1.5 py-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.1em] text-red-400">
                      GM
                    </span>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-md border border-[#3c3330] px-3.5 py-1.5 text-[0.75rem] text-stone-500 transition-colors hover:border-stone-600 hover:bg-[#181412] hover:text-stone-300"
                >
                  Salir
                </button>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>

        </div>
      </div>
    </nav>
  )
}
