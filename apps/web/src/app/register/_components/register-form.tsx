'use client'

import { useState } from 'react'

type Role = 'gm' | 'player'

export function RegisterForm() {
  const [role, setRole] = useState<Role>('player')

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

        <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[0.7rem] font-medium uppercase tracking-[0.12em] text-stone-600">
                Nombre de usuario
              </label>
              <input
                type="text"
                placeholder="Valdris"
                autoComplete="username"
                className="w-full rounded-lg border border-[#3c3330] bg-[#181412] px-4 py-3 text-[0.9rem] text-stone-100 placeholder-stone-700 outline-none transition-all focus:border-amber-500/50 focus:bg-[#232120] focus:ring-2 focus:ring-amber-500/8"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[0.7rem] font-medium uppercase tracking-[0.12em] text-stone-600">
                Nombre real
              </label>
              <input
                type="text"
                placeholder="Martín"
                autoComplete="given-name"
                className="w-full rounded-lg border border-[#3c3330] bg-[#181412] px-4 py-3 text-[0.9rem] text-stone-100 placeholder-stone-700 outline-none transition-all focus:border-amber-500/50 focus:bg-[#232120] focus:ring-2 focus:ring-amber-500/8"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[0.7rem] font-medium uppercase tracking-[0.12em] text-stone-600">
              Correo electrónico
            </label>
            <input
              type="email"
              placeholder="nombre@ejemplo.com"
              autoComplete="email"
              className="w-full rounded-lg border border-[#3c3330] bg-[#181412] px-4 py-3 text-[0.9rem] text-stone-100 placeholder-stone-700 outline-none transition-all focus:border-amber-500/50 focus:bg-[#232120] focus:ring-2 focus:ring-amber-500/8"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[0.7rem] font-medium uppercase tracking-[0.12em] text-stone-600">
              Contraseña
            </label>
            <input
              type="password"
              placeholder="Mínimo 10 caracteres"
              autoComplete="new-password"
              className="w-full rounded-lg border border-[#3c3330] bg-[#181412] px-4 py-3 text-[0.9rem] text-stone-100 placeholder-stone-700 outline-none transition-all focus:border-amber-500/50 focus:bg-[#232120] focus:ring-2 focus:ring-amber-500/8"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[0.7rem] font-medium uppercase tracking-[0.12em] text-stone-600">
              Confirmar contraseña
            </label>
            <input
              type="password"
              placeholder="••••••••••••"
              autoComplete="new-password"
              className="w-full rounded-lg border border-[#3c3330] bg-[#181412] px-4 py-3 text-[0.9rem] text-stone-100 placeholder-stone-700 outline-none transition-all focus:border-amber-500/50 focus:bg-[#232120] focus:ring-2 focus:ring-amber-500/8"
            />
          </div>

          {role === 'gm' && (
            <p className="rounded-md border border-amber-500/15 bg-amber-500/5 px-3 py-2 font-body text-[0.85rem] italic text-amber-500/70">
              Los Dungeon Masters pueden acceder a información privada de NPCs, locations y notas de jugadores.
            </p>
          )}

          <button
            type="submit"
            className="mt-1 rounded-lg bg-amber-500 px-6 py-3.5 font-display text-[0.78rem] font-bold uppercase tracking-[0.2em] text-stone-950 transition-colors hover:bg-amber-400"
          >
            Crear cuenta
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
