'use client'

import { useState, useEffect } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

function getJwt() {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) return null
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return { token, sub: payload.sub as string }
  } catch { return null }
}

interface Props {
  characterId: string
  ownerId: string
  initialBio: string
}

export function PublicBioEditor({ characterId, ownerId, initialBio }: Props) {
  const [bio, setBio]       = useState(initialBio)
  const [canEdit, setCanEdit] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]   = useState(initialBio)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const jwt = getJwt()
    if (!jwt) return
    fetch(`${API_URL}/users/me`, { headers: { Authorization: `Bearer ${jwt.token}` } })
      .then(r => r.ok ? r.json() : null)
      .then((u: { role: string } | null) => {
        if (!u) return
        if (jwt.sub === ownerId || u.role === 'gm') setCanEdit(true)
      })
      .catch(() => null)
  }, [ownerId])

  async function handleSave() {
    const jwt = getJwt()
    if (!jwt) return
    setSaving(true)
    try {
      await fetch(`${API_URL}/characters/${characterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt.token}` },
        body: JSON.stringify({ public_bio: draft }),
      })
      setBio(draft)
      setEditing(false)
    } catch { /* ignore */ }
    finally { setSaving(false) }
  }

  if (!bio && !canEdit) return null

  if (editing) {
    return (
      <div className="mt-2 flex flex-col gap-2">
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          rows={3}
          autoFocus
          placeholder="Descripción pública del personaje…"
          className="w-full rounded-lg border border-[#3c3330] bg-[#0e0c0b]/80 px-3 py-2.5 font-body text-[0.9rem] italic leading-relaxed text-stone-300 placeholder-stone-700 outline-none focus:border-amber-500/40"
        />
        <div className="flex gap-2">
          <button
            onClick={() => { setEditing(false); setDraft(bio) }}
            className="rounded-lg border border-[#2a2826] px-3 py-1 text-[0.7rem] text-stone-500 transition-colors hover:text-stone-300"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[0.7rem] text-amber-400 transition-colors hover:bg-amber-500/20 disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="group mt-2 flex items-start gap-2">
      {bio ? (
        <p className="font-body text-[0.9rem] italic leading-relaxed text-stone-400">{bio}</p>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="text-[0.82rem] italic text-stone-700 transition-colors hover:text-stone-500"
        >
          Añadí una descripción pública…
        </button>
      )}
      {canEdit && bio && (
        <button
          onClick={() => setEditing(true)}
          className="mt-px shrink-0 text-[0.62rem] uppercase tracking-[0.1em] text-stone-700 opacity-0 transition-opacity group-hover:opacity-100 hover:text-amber-500"
        >
          Editar
        </button>
      )}
    </div>
  )
}
