'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

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
}

export function BackstorySection({ characterId, ownerId }: Props) {
  const [canView, setCanView] = useState(false)
  const [canEdit, setCanEdit] = useState(false)
  const [open, setOpen]       = useState(false)
  const [backstory, setBackstory] = useState('')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState('')
  const [saving, setSaving]   = useState(false)
  const [loaded, setLoaded]   = useState(false)

  useEffect(() => {
    const jwt = getJwt()
    if (!jwt) return
    fetch(`${API_URL}/users/me`, { headers: { Authorization: `Bearer ${jwt.token}` } })
      .then(r => r.ok ? r.json() : null)
      .then((u: { role: string } | null) => {
        if (!u) return
        const isOwner = jwt.sub === ownerId
        const isGm    = u.role === 'gm'
        if (isOwner || isGm) {
          setCanView(true)
          setCanEdit(true)
        }
      })
      .catch(() => null)
  }, [ownerId])

  async function handleOpen() {
    setOpen(true)
    if (loaded) return
    const jwt = getJwt()
    if (!jwt) return
    const res = await fetch(`${API_URL}/characters/${characterId}`, {
      headers: { Authorization: `Bearer ${jwt.token}` },
    })
    if (!res.ok) return
    const char = await res.json() as { backstory?: string }
    setBackstory(char.backstory ?? '')
    setDraft(char.backstory ?? '')
    setLoaded(true)
  }

  function handleClose() {
    setOpen(false)
    setEditing(false)
    setDraft(backstory)
  }

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

  if (!canView) return null

  return (
    <>
      <div className="flex justify-center py-6">
        <button
          onClick={handleOpen}
          className="rounded-xl border border-[#3c3330] bg-[#181412] px-8 py-3 font-display text-[0.75rem] font-semibold uppercase tracking-[0.18em] text-stone-400 transition-colors hover:border-amber-500/30 hover:text-amber-400"
        >
          Ver Trasfondo
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

          <div
            className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-[#3c3330] bg-[#0e0c0b] shadow-2xl"
            style={{ animation: 'fade-up 0.18s ease both' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#2a2826] px-6 py-4">
              <span className="font-display text-[0.75rem] font-bold uppercase tracking-[0.2em] text-stone-300">
                Trasfondo
              </span>
              <button
                onClick={handleClose}
                className="text-stone-600 transition-colors hover:text-stone-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="max-h-[65vh] overflow-y-auto px-6 py-5">
              {!loaded ? (
                <p className="text-center text-[0.8rem] text-stone-600">Cargando…</p>
              ) : editing ? (
                <div className="flex flex-col gap-3">
                  <textarea
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    rows={12}
                    autoFocus
                    placeholder="Escribe el trasfondo del personaje…"
                    className="w-full rounded-xl border border-[#3c3330] bg-[#181412] px-4 py-3 font-body text-[0.95rem] italic leading-relaxed text-stone-300 placeholder-stone-700 outline-none focus:border-amber-500/40"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => { setEditing(false); setDraft(backstory) }}
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
                <p className="font-body whitespace-pre-wrap text-[1rem] italic leading-[1.85] text-stone-300">
                  {backstory}
                </p>
              ) : (
                <button
                  onClick={() => canEdit && setEditing(true)}
                  className="w-full rounded-xl border border-dashed border-[#2a2826] bg-[#181412]/50 px-6 py-8 text-center text-[0.82rem] italic text-stone-700 transition-all hover:border-amber-500/20 hover:text-stone-500"
                >
                  {canEdit ? 'Añadí un trasfondo…' : 'Sin trasfondo registrado.'}
                </button>
              )}
            </div>

            {/* Footer */}
            {loaded && !editing && backstory && canEdit && (
              <div className="flex justify-end border-t border-[#2a2826] px-6 py-3">
                <button
                  onClick={() => setEditing(true)}
                  className="text-[0.65rem] uppercase tracking-[0.12em] text-stone-600 transition-colors hover:text-amber-500"
                >
                  Editar trasfondo
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
