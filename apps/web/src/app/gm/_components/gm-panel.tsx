'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { SessionsTab } from './sessions-tab'
import { PartyTab } from './party-tab'

type Tab = 'sessions' | 'party'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'sessions', label: 'Sesiones',         icon: '📜' },
  { id: 'party',    label: 'Estado del Grupo',  icon: '⚔️' },
]

function LoadingScreen() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#3c3330] border-t-amber-500" />
        <span className="text-[0.75rem] uppercase tracking-[0.15em] text-stone-600">Verificando acceso...</span>
      </div>
    </div>
  )
}

function AccessDenied() {
  const router = useRouter()
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mb-4 text-4xl opacity-30">🔒</div>
        <div className="font-display mb-2 text-[1rem] font-semibold tracking-[0.06em] text-stone-400">
          Acceso restringido
        </div>
        <p className="font-body mb-6 text-[0.9rem] italic text-stone-600">
          Este panel es exclusivo para el Dungeon Master.
        </p>
        <button
          onClick={() => router.push('/login')}
          className="rounded-lg bg-amber-500 px-5 py-2.5 font-display text-[0.72rem] font-bold uppercase tracking-[0.15em] text-stone-950 transition-colors hover:bg-amber-400"
        >
          Ingresar
        </button>
      </div>
    </div>
  )
}

export function GmPanel() {
  const { user, loading, isGm, token } = useAuth()
  const [tab, setTab] = useState<Tab>('sessions')

  if (loading) return <LoadingScreen />
  if (!isGm) return <AccessDenied />

  return (
    <main>
      {/* Hero */}
      <section
        className="relative overflow-hidden border-b border-[#3c3330]/40 px-6 pb-8 pt-10"
        style={{ background: 'radial-gradient(ellipse 70% 100% at 20% -10%, #1a0a0a 0%, #0c0a09 60%)' }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(rgba(245,158,11,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.02) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="relative mx-auto max-w-7xl">
          <div className="mb-1 text-[0.62rem] font-medium uppercase tracking-[0.22em] text-red-700/60">
            Acceso GM
          </div>
          <h1 className="font-display mb-2 text-[clamp(1.4rem,3vw,2.2rem)] font-bold tracking-[0.06em] text-stone-50">
            Panel del Dungeon Master
          </h1>
          <p className="font-body text-[0.88rem] italic text-stone-600">
            Bienvenido, <span className="text-amber-500">{user?.email}</span>. Gestioná la campaña desde aquí.
          </p>
        </div>
      </section>

      {/* Tab bar */}
      <div className="border-b border-[#2a2826] bg-[#0e0c0b] px-6">
        <div className="mx-auto flex max-w-7xl gap-0">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3.5 text-[0.78rem] font-medium transition-colors ${
                tab === t.id
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-stone-600 hover:text-stone-300'
              }`}
            >
              <span className="text-[0.85rem]">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-6 py-10">
        {tab === 'sessions' && <SessionsTab token={token!} />}
        {tab === 'party'    && <PartyTab    token={token!} />}
      </div>
    </main>
  )
}
