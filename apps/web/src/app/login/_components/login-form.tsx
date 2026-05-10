'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message ?? 'Error al ingresar')
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
        className="w-full max-w-[380px]"
        style={{ animation: 'fade-up 0.55s cubic-bezier(0.16,1,0.3,1) both' }}
      >
        <div className="mb-9">
          <h2 className="font-display mb-1 text-[1.6rem] font-semibold tracking-[0.07em] text-stone-50">
            Ingresar
          </h2>
          <p className="font-body text-[1rem] text-stone-400">
            Accedé a la bitácora de campaña
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-[0.7rem] font-medium uppercase tracking-[0.12em] text-stone-600">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@ejemplo.com"
              autoComplete="email"
              required
              className="w-full rounded-lg border border-[#3c3330] bg-[#181412] px-4 py-3 text-[0.9rem] text-stone-100 placeholder-stone-700 outline-none transition-all focus:border-amber-500/50 focus:bg-[#232120] focus:ring-2 focus:ring-amber-500/8"
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-[0.7rem] font-medium uppercase tracking-[0.12em] text-stone-600">
                Contraseña
              </label>
              <a href="#" className="text-[0.7rem] text-stone-600 transition-colors hover:text-amber-500">
                ¿Olvidaste tu contraseña?
              </a>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              autoComplete="current-password"
              required
              className="w-full rounded-lg border border-[#3c3330] bg-[#181412] px-4 py-3 text-[0.9rem] text-stone-100 placeholder-stone-700 outline-none transition-all focus:border-amber-500/50 focus:bg-[#232120] focus:ring-2 focus:ring-amber-500/8"
            />
          </div>

          {error && (
            <p className="rounded-md border border-red-500/20 bg-red-500/8 px-3 py-2 text-[0.82rem] text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group relative mt-1 overflow-hidden rounded-lg bg-amber-500 px-6 py-3.5 font-display text-[0.78rem] font-bold uppercase tracking-[0.2em] text-stone-950 transition-colors hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Ingresando...' : 'Ingresar a la bitácora'}
          </button>
        </form>

        <p className="font-body mt-7 text-center text-[0.95rem] text-stone-600">
          ¿Primera vez en la campaña?{' '}
          <a href="/register" className="font-semibold text-amber-500 transition-opacity hover:opacity-80">
            Crear cuenta
          </a>
        </p>
      </div>
    </div>
  )
}
