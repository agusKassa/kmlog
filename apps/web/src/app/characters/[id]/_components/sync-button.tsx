'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Loader2 } from 'lucide-react'

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
  lastSyncedAt: string | null
}

export function SyncButton({ characterId, ownerId, lastSyncedAt: initialSyncedAt }: Props) {
  const [canSync, setCanSync] = useState(false)
  const [syncing, setSyncing]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [syncedAt, setSyncedAt] = useState(initialSyncedAt)

  useEffect(() => {
    const jwt = getJwt()
    if (!jwt) return
    fetch(`${API_URL}/users/me`, { headers: { Authorization: `Bearer ${jwt.token}` } })
      .then(r => r.ok ? r.json() : null)
      .then((u: { role: string } | null) => {
        if (!u) return
        if (jwt.sub === ownerId || u.role === 'gm') setCanSync(true)
      })
      .catch(() => null)
  }, [ownerId])

  if (!canSync) return null

  const fmtSync = syncedAt
    ? new Date(syncedAt).toLocaleDateString('es-AR', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
      })
    : null

  async function handleSync() {
    const jwt = getJwt()
    if (!jwt) return
    setSyncing(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/characters/${characterId}/sync`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${jwt.token}` },
      })
      if (res.ok) {
        const updated = await res.json()
        setSyncedAt(updated.last_synced_at ?? new Date().toISOString())
        window.location.reload()
      } else {
        const err = await res.json().catch(() => ({})) as { message?: string }
        setError(err.message ?? 'Error')
      }
    } catch { setError('Error de conexión') }
    finally { setSyncing(false) }
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        onClick={handleSync}
        disabled={syncing}
        title={fmtSync ? `Última sync: ${fmtSync}` : 'Sincronizar desde Pathbuilder'}
        className="rounded-lg border border-[#3c3330] bg-[#181412] p-1.5 text-stone-500 transition-colors hover:border-amber-500/30 hover:text-amber-400 disabled:opacity-50"
      >
        {syncing
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : <RefreshCw className="h-4 w-4" />
        }
      </button>
      {error && <span className="text-[0.58rem] text-red-400">{error}</span>}
    </div>
  )
}
