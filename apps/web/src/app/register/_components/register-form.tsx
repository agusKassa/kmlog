'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'
type Role = 'gm' | 'player'

export function RegisterForm() {
  const router = useRouter()

  const [role, setRole]           = useState<Role>('player')
  const [username, setUsername]   = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password, role }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        if (res.status === 409) setError('El email ya está en uso')
        else setError(data.message ?? `Error ${res.status}`)
        return
      }

      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)
      window.dispatchEvent(new Event('auth-changed'))
      router.push('/')
      router.refresh()
    } catch {
      setError('No se pudo conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-[#0c0a09] px-8 py-12">
      <div
        className="w-full max-w-[400px]"
        style={{ animation: 'fade-up 0.55s cubic-bezier(0.16,1,0.3,1) both' }}
      >
        <div className="mb-8">
          <h2 className="font-display mb-1 text-[1.6rem] font-semibold tracking-[0.07em] text-stone-50">
            Unirse a la campaña
          </h2>
          <p className="font-body text-[1rem] text-stone-400">
            Creá tu cuenta para acceder a la bitácora
          </p>
        </div>

        {/* Role toggle */}
        <div className="mb-6 grid grid-cols-2 gap-0 rounded-lg border border-[#3c3330] bg-[#181412] p-1">
          {(['player', 'gm'] as Role[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`flex items-center justify-center gap-1.5 rounded-md px-3 py-2.5 text-[0.75rem] font-medium uppercase tracking-[0.08em] transition-all ${
                role === r
                  ? 'border border-amber-500/20 bg-amber-500/10 text-amber-500'
                  : 'text-stone-600 hover:bg-stone-800/40 hover:text-stone-300'
              }`}
            >
              {r === 'gm' ? (
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              )}
              {r === 'gm' ? 'Dungeon Master' : 'Jugador'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-[0.7rem] font-medium uppercase tracking-[0.12em] text-stone-600">
              Nombre de usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Valdris"
              autoComplete="username"
              required
              minLength={2}
              className="w-full rounded-lg border border-[#3c3330] bg-[#181412] px-4 py-3 text-[0.9rem] text-stone-100 placeholder-stone-700 outline-none transition-all focus:border-amber-500/50 focus:bg-[#232120] focus:ring-2 focus:ring-amber-500/8"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[0.7rem] font-medium uppercase tracking-[0.12em] text-stone-600">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="nombre@ejemplo.com"
              autoComplete="email"
              required
              className="w-full rounded-lg border border-[#3c3330] bg-[#181412] px-4 py-3 text-[0.9rem] text-stone-100 placeholder-stone-700 outline-none transition-all focus:border-amber-500/50 focus:bg-[#232120] focus:ring-2 focus:ring-amber-500/8"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[0.7rem] font-medium uppercase tracking-[0.12em] text-stone-600">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full rounded-lg border border-[#3c3330] bg-[#181412] px-4 py-3 text-[0.9rem] text-stone-100 placeholder-stone-700 outline-none transition-all focus:border-amber-500/50 focus:bg-[#232120] focus:ring-2 focus:ring-amber-500/8"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[0.7rem] font-medium uppercase tracking-[0.12em] text-stone-600">
              Confirmar contraseña
            </label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="••••••••••••"
              autoComplete="new-password"
              required
              className="w-full rounded-lg border border-[#3c3330] bg-[#181412] px-4 py-3 text-[0.9rem] text-stone-100 placeholder-stone-700 outline-none transition-all focus:border-amber-500/50 focus:bg-[#232120] focus:ring-2 focus:ring-amber-500/8"
            />
          </div>

          {role === 'gm' && (
            <p className="rounded-md border border-amber-500/15 bg-amber-500/5 px-3 py-2 font-body text-[0.85rem] italic text-amber-500/70">
              Los Dungeon Masters pueden acceder a información privada de NPCs, locations y notas de jugadores.
            </p>
          )}

          {error && (
            <p className="rounded-lg border border-red-500/20 bg-red-500/8 px-3 py-2 text-[0.8rem] text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-lg bg-amber-500 px-6 py-3.5 font-display text-[0.78rem] font-bold uppercase tracking-[0.2em] text-stone-950 transition-colors hover:bg-amber-400 disabled:opacity-60"
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="font-body mt-6 text-center text-[0.95rem] text-stone-600">
          ¿Ya tenés cuenta?{' '}
          <a href="/login" className="font-semibold text-amber-500 transition-opacity hover:opacity-80">
            Ingresar
          </a>
        </p>
      </div>
    </div>
  )
}
