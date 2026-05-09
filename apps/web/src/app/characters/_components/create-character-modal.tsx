'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

type Tab = 'pathbuilder' | 'json'

export function CreateCharacterButton() {
  const [open, setOpen]         = useState(false)
  const [tab, setTab]           = useState<Tab>('pathbuilder')
  const [pbId, setPbId]         = useState('')
  const [jsonText, setJsonText] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const router = useRouter()
  const overlayRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  function handleOpen() { setOpen(true); setError(null); setPbId(''); setJsonText('') }
  function handleClose() { if (!loading) setOpen(false) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const token = localStorage.getItem('access_token')
    if (!token) { setError('Debés estar autenticado'); setLoading(false); return }

    try {
      let build: unknown

      if (tab === 'pathbuilder') {
        const id = parseInt(pbId, 10)
        if (isNaN(id) || id < 1) { setError('ID de Pathbuilder inválido'); setLoading(false); return }

        // Fetch directly from the browser — avoids Railway→Pathbuilder connectivity issues
        let pbRes: Response
        try {
          pbRes = await fetch(`https://pathbuilder2e.com/json.php?id=${id}`)
          if (!pbRes.ok) throw new Error(`HTTP ${pbRes.status}`)
        } catch {
          setError('No se pudo conectar con Pathbuilder. Exportá el JSON manualmente desde la app y usá la pestaña JSON.')
          setLoading(false)
          return
        }
        const pbData = await pbRes.json() as { success: boolean; build: unknown }
        if (!pbData.success) {
          setError('ID no encontrado o el personaje no es público en Pathbuilder.')
          setLoading(false)
          return
        }
        build = pbData.build
      } else {
        try { build = JSON.parse(jsonText) } catch { setError('JSON inválido'); setLoading(false); return }
      }

      const res = await fetch(`${API_URL}/characters/import/json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ build }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setError(err.message ?? `Error ${res.status}`)
        return
      }

      const character = await res.json()
      setOpen(false)
      router.push(`/characters/${character._id}`)
      router.refresh()
    } catch {
      setError('No se pudo conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 font-display text-[0.78rem] font-semibold tracking-[0.06em] text-amber-400 transition-all hover:border-amber-500/50 hover:bg-amber-500/15 hover:text-amber-300"
      >
        <Plus className="h-4 w-4" />
        Crear personaje
      </button>

      {open && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          onClick={e => { if (e.target === overlayRef.current) handleClose() }}
          style={{ animation: 'fade-up 0.18s ease both' }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#2a2826] bg-[#0e0c0b] shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#1e1c1a] px-6 py-4">
              <h2 className="font-display text-[1rem] font-bold tracking-[0.06em] text-stone-100">
                Nuevo personaje
              </h2>
              <button onClick={handleClose} disabled={loading}
                className="rounded-md p-1.5 text-stone-600 transition-colors hover:bg-[#1a1816] hover:text-stone-300 disabled:opacity-40">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#1e1c1a]">
              {([
                { id: 'pathbuilder', label: 'Pathbuilder ID' },
                { id: 'json',        label: 'JSON' },
              ] as { id: Tab; label: string }[]).map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex-1 px-4 py-3 text-[0.78rem] font-medium transition-colors ${
                    tab === t.id
                      ? 'border-b-2 border-amber-500 text-amber-400'
                      : 'text-stone-600 hover:text-stone-300'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-5">
              {tab === 'pathbuilder' ? (
                <div>
                  <label className="mb-2 block text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-stone-600">
                    ID de Pathbuilder
                  </label>
                  <input
                    type="number"
                    value={pbId}
                    onChange={e => setPbId(e.target.value)}
                    placeholder="ej: 123456"
                    min={1}
                    required
                    autoFocus
                    className="w-full rounded-lg border border-[#3c3330] bg-[#181412] px-4 py-3 font-display text-[0.9rem] tracking-wide text-stone-100 placeholder-stone-700 outline-none transition-all focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10"
                  />
                  <p className="mt-2 text-[0.7rem] text-stone-700">
                    Encontrá el ID al exportar tu personaje desde Pathbuilder 2e.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="mb-2 block text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-stone-600">
                    JSON del build
                  </label>
                  <textarea
                    value={jsonText}
                    onChange={e => setJsonText(e.target.value)}
                    placeholder='{"name": "...", "class": "...", ...}'
                    rows={7}
                    required
                    autoFocus
                    className="w-full resize-none rounded-lg border border-[#3c3330] bg-[#181412] px-4 py-3 font-mono text-[0.78rem] text-stone-100 placeholder-stone-700 outline-none transition-all focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10"
                  />
                </div>
              )}

              {error && (
                <p className="mt-3 rounded-lg border border-red-500/20 bg-red-500/8 px-3 py-2 text-[0.8rem] text-red-400">
                  {error}
                </p>
              )}

              <div className="mt-5 flex gap-3">
                <button type="button" onClick={handleClose} disabled={loading}
                  className="flex-1 rounded-lg border border-[#3c3330] px-4 py-2.5 text-[0.8rem] text-stone-500 transition-colors hover:bg-[#181412] hover:text-stone-300 disabled:opacity-40">
                  Cancelar
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 rounded-lg bg-amber-500 px-4 py-2.5 font-display text-[0.78rem] font-bold tracking-[0.08em] text-stone-950 transition-colors hover:bg-amber-400 disabled:opacity-60">
                  {loading ? 'Importando...' : 'Importar'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </>
  )
}
