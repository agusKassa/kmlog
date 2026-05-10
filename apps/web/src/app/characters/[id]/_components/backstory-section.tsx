'use client'

import { useState, useEffect } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

function getJwt(): { token: string; sub: string } | null {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) return null
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return { token, sub: payload.sub as string, ...payload }
  } catch { return null }
}

interface Props {
  characterId: string
  ownerId: string
}

export function BackstorySection({ characterId, ownerId }: Props) {
  const [backstory, setBackstory]   = useState<string | null>(null)
  const [isOwner, setIsOwner]       = useState(false)
  const [editing, setEditing]       = useState(false)
  const [draft, setDraft]           = useState('')
  const [saving, setSaving]         = useState(false)
  const [loaded, setLoaded]         = useState(false)

  useEffect(() => {
    const jwt = getJwt()
    if (!jwt) return

    fetch(`${API_URL}/users/me`, { headers: { Authorization: `Bearer ${jwt.token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(async (u: { role: string } | null) => {
        if (!u) return
        const owner = jwt.sub === ownerId
        const gm    = u.role === 'gm'
        if (!owner && !gm) return

        setIsOwner(owner)

        const res = await fetch(`${API_URL}/characters/${characterId}`, {
          headers: { Authorization: `Bearer ${jwt.token}` },
        })
        if (!res.ok) return
        const char = await res.json() as { backstory?: string }
        setBackstory(char.backstory ?? '')
        setDraft(char.backstory ?? '')
        setLoaded(true)
      })
      .catch(() => null)
  }, [characterId, ownerId])

  if (!loaded) return null

  async function handleSave() {
    const jwt = getJwt()
    if (!jwt) return
    setSaving(true)
    try {
      await fetch(`${API_URL}/characters/${characterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt.token}` },
        body: JSON.stringify({ backstory: draft }),
      })
      setBackstory(draft)
      setEditing(false)
    } catch { /* ignore */ }
    finally { setSaving(false) }
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-[#2a2826]" />
        <span className="font-display text-[0.7rem] font-bold uppercase tracking-[0.2em] text-stone-400">
          Trasfondo
        </span>
        {isOwner && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-[0.65rem] uppercase tracking-[0.12em] text-stone-600 transition-colors hover:text-amber-500"
          >
            Editar
          </button>
        )}
        <div className="h-px flex-1 bg-[#2a2826]" />
      </div>

      {editing ? (
        <div className="flex flex-col gap-3">
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            rows={6}
            placeholder="Escribe el trasfondo de tu personaje..."
            className="w-full rounded-xl border border-[#3c3330] bg-[#181412] px-4 py-3 font-body text-[0.95rem] italic leading-relaxed text-stone-300 placeholder-stone-700 outline-none focus:border-amber-500/40"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setEditing(false); setDraft(backstory ?? '') }}
              className="rounded-lg border border-[#2a2826] px-3 py-1.5 text-[0.72rem] text-stone-500 transition-colors hover:text-stone-300"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[0.72rem] text-amber-400 transition-colors hover:bg-amber-500/20 disabled:opacity-50"
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      ) : backstory ? (
        <div className="rounded-xl border border-[#2a2826] bg-[#181412] px-6 py-5">
          <p className="font-body whitespace-pre-wrap text-[1rem] italic leading-[1.85] text-stone-300">
            {backstory}
          </p>
        </div>
      ) : isOwner ? (
        <button
          onClick={() => setEditing(true)}
          className="w-full rounded-xl border border-dashed border-[#2a2826] bg-[#181412]/50 px-6 py-5 text-center text-[0.82rem] italic text-stone-700 transition-all hover:border-amber-500/20 hover:text-stone-500"
        >
          Añadí un trasfondo para tu personaje…
        </button>
      ) : null}
    </div>
  )
}
