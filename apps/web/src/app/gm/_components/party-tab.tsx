'use client'

import { useState, useEffect } from 'react'
import { clientFetch } from '@/lib/client-api'
import { formatDate, type ApiPartyState } from '@/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

export function PartyTab({ token }: { token: string }) {
  const [current, setCurrent] = useState<ApiPartyState | null>(null)
  const [content, setContent] = useState('')
  const [versionNote, setVersionNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API_URL}/party-state`)
      .then(r => r.json())
      .then((data: ApiPartyState) => {
        setCurrent(data)
        setContent(data.current_content ?? '')
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    setSaving(true)
    try {
      const updated = await clientFetch<ApiPartyState>('/party-state', token, {
        method: 'PUT',
        body: JSON.stringify({ content, version_note: versionNote.trim() || null }),
      })
      setCurrent(updated)
      setVersionNote('')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const isDirty = content !== (current?.current_content ?? '')
  const versions = current?.versions?.slice().reverse().slice(0, 8) ?? []

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-48 animate-pulse rounded-xl bg-[#181412]" />
        <div className="h-10 animate-pulse rounded-xl bg-[#181412]" />
      </div>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
      {/* Editor */}
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-[0.65rem] font-medium uppercase tracking-[0.12em] text-stone-600">
              Estado actual del grupo
            </label>
            {current?.updated_at && (
              <span className="text-[0.62rem] text-stone-700">
                Actualizado {formatDate(current.updated_at)}
              </span>
            )}
          </div>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={12}
            placeholder="Describí la situación actual del grupo: dónde están, qué misiones tienen pendientes, en qué estado se encuentran..."
            className="w-full rounded-xl border border-[#3c3330] bg-[#181412] px-5 py-4 font-body text-[0.98rem] leading-relaxed text-stone-200 placeholder-stone-700 outline-none transition-all focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/10 resize-y"
          />
          <p className="mt-1.5 text-[0.62rem] text-stone-700">
            Usá doble salto de línea para separar párrafos.
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-[0.65rem] font-medium uppercase tracking-[0.12em] text-stone-600">
            Nota de versión <span className="normal-case text-stone-700">(opcional)</span>
          </label>
          <input
            type="text"
            value={versionNote}
            onChange={e => setVersionNote(e.target.value)}
            placeholder="Ej: Tras la batalla del bosque…"
            className="w-full rounded-lg border border-[#3c3330] bg-[#0e0c0b] px-3.5 py-2.5 text-[0.88rem] text-stone-100 placeholder-stone-700 outline-none transition-all focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/15"
          />
        </div>

        {error && (
          <p className="rounded border border-red-500/20 bg-red-500/8 px-3 py-2 text-[0.8rem] text-red-400">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving || !isDirty}
            className="rounded-lg bg-amber-500 px-5 py-2.5 font-display text-[0.72rem] font-bold uppercase tracking-[0.15em] text-stone-950 transition-colors hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? 'Guardando...' : 'Guardar estado'}
          </button>
          {saved && (
            <span className="text-[0.75rem] text-emerald-400" style={{ animation: 'fade-up 0.3s ease both' }}>
              ✓ Guardado
            </span>
          )}
          {isDirty && !saving && (
            <span className="text-[0.68rem] text-stone-600">Hay cambios sin guardar</span>
          )}
        </div>
      </form>

      {/* History sidebar */}
      <aside>
        <div className="font-display mb-4 text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-stone-600">
          Historial de versiones
        </div>

        {versions.length === 0 ? (
          <p className="font-body text-[0.85rem] italic text-stone-700">
            Sin versiones anteriores. El historial se guardará automáticamente cada vez que actualices el estado.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {versions.map((v, i) => (
              <div
                key={i}
                className="rounded-lg border border-[#2a2826] bg-[#181412] px-4 py-3"
              >
                {v.version_note && (
                  <div className="mb-1.5 text-[0.62rem] font-medium uppercase tracking-[0.1em] text-amber-600/70">
                    {v.version_note}
                  </div>
                )}
                <p className="font-body text-[0.82rem] leading-relaxed text-stone-500 line-clamp-3">
                  {v.content}
                </p>
                <div className="mt-2 text-[0.6rem] text-stone-700">
                  {formatDate(v.updated_at)}
                </div>
                <button
                  type="button"
                  onClick={() => setContent(v.content)}
                  className="mt-2 text-[0.62rem] text-stone-600 transition-colors hover:text-amber-500"
                >
                  Restaurar →
                </button>
              </div>
            ))}
          </div>
        )}
      </aside>
    </div>
  )
}
