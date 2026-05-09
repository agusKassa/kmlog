'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Scroll, Users, Map, StickyNote, Ghost } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

const navLinks = [
  { href: '/sessions',   label: 'Sesiones',   icon: Scroll },
  { href: '/characters', label: 'Personajes',  icon: Users },
  { href: '/map',        label: 'Mapa',        icon: Map },
  { href: '/npcs',       label: 'NPCs',        icon: Ghost },
  { href: '/notes',      label: 'Notas',       icon: StickyNote },
]

const AUTH_PATHS = ['/login', '/register']

export function Navbar() {
  const pathname = usePathname()
  const router   = useRouter()
  const { user, token, loading, isGm, isAuthenticated, username } = useAuth()

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [characterId, setCharacterId]   = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch user profile to get character_id
  useEffect(() => {
    if (!isAuthenticated || !token) { setCharacterId(null); return }
    fetch(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then((u: { character_id: string | null } | null) => setCharacterId(u?.character_id ?? null))
      .catch(() => null)
  }, [isAuthenticated, token])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Close dropdown on route change
  useEffect(() => { setDropdownOpen(false) }, [pathname])

  if (AUTH_PATHS.includes(pathname)) return null

  function handleLogout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    window.dispatchEvent(new Event('auth-changed'))
    setDropdownOpen(false)
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
                <Link key={href} href={href}
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

            {!loading && isGm && (
              <Link href="/gm"
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

              /* ── User dropdown ── */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(o => !o)}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-[#181412]"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#3c3330] bg-[#181412] font-display text-[0.65rem] font-bold text-amber-500">
                    {username.charAt(0).toUpperCase()}
                  </div>
                  {isGm && (
                    <span className="rounded border border-red-500/20 bg-red-500/8 px-1.5 py-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.1em] text-red-400">
                      GM
                    </span>
                  )}
                  <svg className={`h-3 w-3 text-stone-600 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                    viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div
                    className="absolute right-0 top-full mt-1.5 w-52 overflow-hidden rounded-xl border border-[#2a2826] bg-[#0e0c0b] shadow-2xl"
                    style={{ animation: 'fade-up 0.15s ease both' }}
                  >
                    {/* Header */}
                    <div className="border-b border-[#1e1c1a] px-4 py-3">
                      <p className="font-display text-[0.82rem] font-semibold tracking-[0.04em] text-stone-200">
                        {username}
                      </p>
                      <p className="mt-0.5 truncate text-[0.7rem] text-stone-600">{user?.email}</p>
                    </div>

                    {/* Links */}
                    <div className="py-1">
                      {characterId ? (
                        <Link href={`/characters/${characterId}`}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-[0.8rem] text-stone-400 transition-colors hover:bg-[#141210] hover:text-stone-100"
                        >
                          <Users className="h-3.5 w-3.5 text-amber-500/70" />
                          Mi ficha
                        </Link>
                      ) : (
                        <Link href="/characters"
                          className="flex items-center gap-2.5 px-4 py-2.5 text-[0.8rem] text-stone-400 transition-colors hover:bg-[#141210] hover:text-stone-100"
                        >
                          <Users className="h-3.5 w-3.5 text-amber-500/70" />
                          Personajes
                        </Link>
                      )}
                    </div>

                    {/* Logout */}
                    <div className="border-t border-[#1e1c1a] py-1">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[0.8rem] text-stone-500 transition-colors hover:bg-[#141210] hover:text-red-400"
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd" />
                          <path fillRule="evenodd" d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-.943a.75.75 0 10-1.004-1.114l-2.5 2.25a.75.75 0 000 1.114l2.5 2.25a.75.75 0 101.004-1.114l-1.048-.943h9.546A.75.75 0 0019 10z" clipRule="evenodd" />
                        </svg>
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>

            ) : (
              <>
                <Link href="/login"
                  className="hidden items-center rounded-md border border-[#3c3330] px-3.5 py-1.5 text-[0.78rem] font-medium text-stone-400 transition-colors hover:border-stone-600 hover:bg-[#181412] hover:text-stone-100 sm:inline-flex"
                >
                  Ingresar
                </Link>
                <Link href="/register"
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
