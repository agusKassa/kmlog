'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import type { ApiNpc, ApiSession } from '@/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

type NpcRole = 'ally' | 'enemy' | 'neutral' | 'unknown'

const ROLE_OPTIONS: { value: NpcRole; label: string }[] = [
  { value: 'ally',    label: 'Aliado' },
  { value: 'enemy',   label: 'Enemigo' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'unknown', label: 'Desconocido' },
]

interface NpcFormProps {
  npc?: ApiNpc
  sessions: ApiSession[]
}

export function NpcForm({ npc, sessions }: NpcFormProps) {
  const router = useRouter()
  const { token } = useAuth()
  const [isPending, startTransition] = useTransition()

  const isEdit = !!npc

  const [name, setName]               = useState(npc?.name ?? '')
  const [role, setRole]               = useState<NpcRole>(npc?.role ?? 'unknown')
  const [publicDesc, setPublicDesc]   = useState(npc?.public_description ?? '')
  const [sessionId, setSessionId]     = useState(npc?.first_seen_session_id ?? '')
  const [error, setError]             = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) { setError('Sesión expirada. Volvé a ingresar.'); return }

    const body = {
      name,
      role,
      public_description: publicDesc,
      first_seen_session_id: sessionId || null,
    }

    startTransition(async () => {
      try {
        const url    = isEdit ? `${API_URL}/npcs/${npc._id}` : `${API_URL}/npcs`
        const method = isEdit ? 'PATCH' : 'POST'
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError((data as { message?: string }).message ?? 'Error al guardar.')
          return
        }

        const saved = await res.json() as { _id: string }
        router.push(`/npcs/${saved._id}`)
        router.refresh()
      } catch {
        setError('Error de red. Verificá tu conexión.')
      }
    })
  }

  const inputCls = 'w-full rounded-lg border border-[#2a2826] bg-[#141210] px-3.5 py-2.5 text-[0.85rem] text-stone-200 placeholder-stone-700 outline-none transition-colors focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20'
  const labelCls = 'mb-1.5 block text-[0.68rem] font-medium uppercase tracking-[0.15em] text-stone-500'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Name + Role */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className={labelCls}>Nombre *</label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="ej: Maegar Varn"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Rol</label>
          <select value={role} onChange={e => setRole(e.target.value as NpcRole)} className={inputCls}>
            {ROLE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Public description */}
      <div>
        <label className={labelCls}>Descripción pública</label>
        <textarea
          value={publicDesc}
          onChange={e => setPublicDesc(e.target.value)}
          rows={5}
          placeholder="Lo que los jugadores saben sobre este personaje..."
          className={inputCls + ' resize-y'}
        />
      </div>

      {/* First seen session */}
      <div>
        <label className={labelCls}>Primera sesión en que apareció</label>
        <select value={sessionId} onChange={e => setSessionId(e.target.value)} className={inputCls}>
          <option value="">— Sin asignar —</option>
          {sessions
            .filter(s => s.status === 'published' || s.status === 'played')
            .sort((a, b) => a.session_number - b.session_number)
            .map(s => (
              <option key={s._id} value={s._id}>
                Sesión #{s.session_number} — {s.title}
              </option>
            ))}
        </select>
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/20 bg-red-500/8 px-4 py-3 text-[0.8rem] text-red-400">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3 border-t border-[#2a2826] pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-amber-500 px-5 py-2.5 text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-stone-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear NPC'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2.5 text-[0.75rem] font-medium uppercase tracking-[0.12em] text-stone-500 transition-colors hover:text-stone-300"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
