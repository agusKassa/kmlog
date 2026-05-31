'use client'

import { useState, useEffect, useRef } from 'react'
import { RefreshCw, Loader2, X } from 'lucide-react'

const API_URL   = process.env.NEXT_PUBLIC_API_URL   ?? 'http://localhost:3001/api'
const PB_URL    = 'https://pathbuilder2e.com/json.php'

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
  hasPbuilder: boolean
  lastSyncedAt: string | null
}

export function SyncButton({ characterId, ownerId, hasPbuilder, lastSyncedAt: initialSyncedAt }: Props) {
  const [canSync, setCanSync]   = useState(false)
  const [syncing, setSyncing]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [syncedAt, setSyncedAt] = useState(initialSyncedAt)
  const [modalOpen, setModalOpen] = useState(false)
  const [idInput, setIdInput]   = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => {
    if (modalOpen) setTimeout(() => inputRef.current?.focus(), 50)
  }, [modalOpen])

  if (!canSync) return null

  const fmtSync = syncedAt
    ? new Date(syncedAt).toLocaleDateString('es-AR', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
      })
    : null

  async function doSync(pathbuilderId: number, storeId: boolean) {
    setError(null)
    setSyncing(true)
    try {
      const pbRes = await fetch(`${PB_URL}?id=${pathbuilderId}`)
      if (!pbRes.ok) throw new Error('No se pudo conectar con Pathbuilder')
      const pbData = await pbRes.json() as { success: boolean; build: unknown }
      if (!pbData.success) throw new Error('ID no encontrado o el personaje no es público')

      const jwt = getJwt()
      if (!jwt) throw new Error('Sin sesión')

      const patch: Record<string, unknown> = {
        build: pbData.build,
        last_synced_at: new Date().toISOString(),
      }
      if (storeId) patch.pathbuilder_id = pathbuilderId

      const res = await fetch(`${API_URL}/characters/${characterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt.token}` },
        body: JSON.stringify(patch),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { message?: string }
        throw new Error(err.message ?? `Error ${res.status}`)
      }

      setSyncedAt(new Date().toISOString())
      setModalOpen(false)
      window.location.reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setSyncing(false)
    }
  }

  async function handleSyncClick() {
    if (!hasPbuilder) {
      setModalOpen(true)
      return
    }
    // Fetch the stored pathbuilder_id from the API (owner/GM can see it)
    const jwt = getJwt()
    if (!jwt) return
    setSyncing(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/characters/${characterId}`, {
        headers: { Authorization: `Bearer ${jwt.token}` },
      })
      if (!res.ok) throw new Error('No se pudo obtener el personaje')
      const char = await res.json() as { pathbuilder_id?: number | null }
      if (!char.pathbuilder_id) {
        setModalOpen(true)
        setSyncing(false)
        return
      }
      await doSync(char.pathbuilder_id, false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
      setSyncing(false)
    }
  }

  async function handleModalSubmit(e: React.FormEvent) {
    e.preventDefault()
    const id = parseInt(idInput, 10)
    if (isNaN(id) || id < 1) { setError('ID inválido'); return }
    await doSync(id, true)
  }

  return (
    <>
      <div className="flex flex-col items-center gap-0.5">
        <button
          onClick={handleSyncClick}
          disabled={syncing}
          title={fmtSync ? `Última sync: ${fmtSync}` : 'Sincronizar desde Pathbuilder'}
          className="rounded-lg border border-[#3c3330] bg-[#181412] p-1.5 text-stone-500 transition-colors hover:border-amber-500/30 hover:text-amber-400 disabled:opacity-50"
        >
          {syncing
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <RefreshCw className="h-4 w-4" />
          }
        </button>
        {error && <span className="max-w-[120px] text-center text-[0.58rem] leading-tight text-red-400">{error}</span>}
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => { setModalOpen(false); setError(null) }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <form
            className="relative w-full max-w-sm overflow-hidden rounded-xl border border-[#3c3330] bg-[#0e0c0b] shadow-2xl"
            style={{ animation: 'fade-up 0.18s ease both' }}
            onClick={e => e.stopPropagation()}
            onSubmit={handleModalSubmit}
          >
            <div className="flex items-center justify-between border-b border-[#2a2826] px-5 py-4">
              <span className="font-display text-[0.75rem] font-bold uppercase tracking-[0.2em] text-stone-300">
                Vincular Pathbuilder
              </span>
              <button
                type="button"
                onClick={() => { setModalOpen(false); setError(null) }}
                className="text-stone-600 transition-colors hover:text-stone-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 py-5">
              <label className="mb-2 block text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-stone-600">
                ID de Pathbuilder
              </label>
              <input
                ref={inputRef}
                type="number"
                value={idInput}
                onChange={e => setIdInput(e.target.value)}
                placeholder="ej: 123456"
                min={1}
                required
                className="w-full rounded-lg border border-[#3c3330] bg-[#181412] px-4 py-3 font-display text-[0.9rem] tracking-wide text-stone-100 placeholder-stone-700 outline-none transition-all focus:border-amber-500/50"
              />
              <p className="mt-1.5 text-[0.68rem] text-stone-700">
                Encontrá el ID al exportar desde Pathbuilder 2e. Se guardará para sincronizaciones futuras.
              </p>

              {error && (
                <p className="mt-3 rounded-lg border border-red-500/20 bg-red-500/8 px-3 py-2 text-[0.78rem] text-red-400">
                  {error}
                </p>
              )}

              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setModalOpen(false); setError(null) }}
                  className="flex-1 rounded-lg border border-[#3c3330] px-4 py-2 text-[0.78rem] text-stone-500 transition-colors hover:text-stone-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={syncing}
                  className="flex-1 rounded-lg bg-amber-500 px-4 py-2 font-display text-[0.78rem] font-bold text-stone-950 transition-colors hover:bg-amber-400 disabled:opacity-60"
                >
                  {syncing ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Sincronizar'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
