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
  isAlive: boolean
  inParty: boolean
  currentHp: number | null
  maxHp: number
}

export function CharacterControls({ characterId, ownerId, isAlive, inParty, currentHp, maxHp }: Props) {
  const [canEdit, setCanEdit] = useState(false)
  const [alive, setAlive]     = useState(isAlive)
  const [party, setParty]     = useState(inParty)
  const [hp, setHp]           = useState<number>(currentHp ?? maxHp)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    const jwt = getJwt()
    if (!jwt) return
    // Check ownership or GM role
    fetch(`${API_URL}/users/me`, { headers: { Authorization: `Bearer ${jwt.token}` } })
      .then(r => r.ok ? r.json() : null)
      .then((u: { role: string } | null) => {
        if (!u) return
        const isOwner = jwt.sub === ownerId
        const isGm = u.role === 'gm'
        setCanEdit(isOwner || isGm)
      })
      .catch(() => null)
  }, [ownerId])

  async function patch(data: Record<string, unknown>) {
    const jwt = getJwt()
    if (!jwt) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/characters/${characterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt.token}` },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setError(err.message ?? `Error ${res.status}`)
      }
    } catch { setError('Error de conexión') }
    finally { setSaving(false) }
  }

  async function handleAlive(val: boolean) {
    setAlive(val)
    await patch({ is_alive: val })
  }

  async function handleParty(val: boolean) {
    setParty(val)
    await patch({ in_party: val })
  }

  async function handleHpBlur() {
    await patch({ current_hp: hp })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* HP actual — visible always */}
      <div className="flex items-center gap-2 rounded-lg border border-[#2a2826] bg-[#181412] px-3 py-2">
        <span className="text-[0.58rem] uppercase tracking-[0.14em] text-stone-600">HP</span>
        {canEdit ? (
          <input
            type="number"
            value={hp}
            min={0}
            max={maxHp}
            onChange={e => setHp(Number(e.target.value))}
            onBlur={handleHpBlur}
            className="w-12 bg-transparent font-display text-[1.1rem] font-bold text-amber-400 outline-none"
          />
        ) : (
          <span className="font-display text-[1.1rem] font-bold text-amber-400">{hp}</span>
        )}
        <span className="text-[0.7rem] text-stone-600">/ {maxHp}</span>
      </div>

      {canEdit && (
        <>
          {/* Vivo / Muerto */}
          <button
            onClick={() => handleAlive(!alive)}
            disabled={saving}
            className={`rounded-lg border px-3 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.1em] transition-all disabled:opacity-50 ${
              alive
                ? 'border-emerald-500/30 bg-emerald-500/8 text-emerald-400 hover:bg-emerald-500/15'
                : 'border-stone-600/30 bg-stone-800/40 text-stone-500 hover:bg-stone-800/60'
            }`}
          >
            {alive ? '● Vivo' : '● Muerto'}
          </button>

          {/* En party */}
          <button
            onClick={() => handleParty(!party)}
            disabled={saving}
            className={`rounded-lg border px-3 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.1em] transition-all disabled:opacity-50 ${
              party
                ? 'border-amber-500/30 bg-amber-500/8 text-amber-400 hover:bg-amber-500/15'
                : 'border-stone-600/30 bg-stone-800/40 text-stone-500 hover:bg-stone-800/60'
            }`}
          >
            {party ? '⚔ En party' : '⚔ Fuera de party'}
          </button>

        </>
      )}

      {error && (
        <span className="text-[0.7rem] text-red-400">{error}</span>
      )}
    </div>
  )
}
