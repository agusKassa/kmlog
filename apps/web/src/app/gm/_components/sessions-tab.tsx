'use client'

import { useState, useEffect, useCallback } from 'react'
import { clientFetch } from '@/lib/client-api'
import type { ApiSession, SessionStatus } from '@/lib/api'

// ── Helpers ────────────────────────────────────────────────────────────────

const STATUS_CYCLE: SessionStatus[] = ['draft', 'played', 'published']

const STATUS_STYLES: Record<SessionStatus, string> = {
  draft:     'bg-stone-500/8 text-stone-500 border-stone-700/40',
  played:    'bg-orange-500/8 text-orange-300 border-orange-500/20',
  published: 'bg-green-500/8 text-green-300 border-green-500/20',
}
const STATUS_LABELS: Record<SessionStatus, string> = {
  draft: 'Borrador', played: 'Jugada', published: 'Publicada',
}

function today(): string {
  return new Date().toISOString().split('T')[0]
}

function InputField({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="mb-1.5 block text-[0.65rem] font-medium uppercase tracking-[0.12em] text-stone-600">
        {label}
      </label>
      <input
        {...props}
        className="w-full rounded-lg border border-[#3c3330] bg-[#0e0c0b] px-3.5 py-2.5 text-[0.88rem] text-stone-100 placeholder-stone-700 outline-none transition-all focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/15 disabled:opacity-40"
      />
    </div>
  )
}

function TextareaField({ label, ...props }: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <label className="mb-1.5 block text-[0.65rem] font-medium uppercase tracking-[0.12em] text-stone-600">
        {label}
      </label>
      <textarea
        {...props}
        className="w-full rounded-lg border border-[#3c3330] bg-[#0e0c0b] px-3.5 py-2.5 text-[0.88rem] leading-relaxed text-stone-100 placeholder-stone-700 outline-none transition-all focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/15 disabled:opacity-40 resize-y"
      />
    </div>
  )
}

// ── Create form ────────────────────────────────────────────────────────────

interface CreateFormProps {
  token: string
  nextNumber: number
  onCreated: (s: ApiSession) => void
  onCancel: () => void
}

function CreateForm({ token, nextNumber, onCreated, onCancel }: CreateFormProps) {
  const [form, setForm] = useState({ session_number: nextNumber, title: '', date_played: today(), preamble: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(k: string, v: string | number) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const session = await clientFetch<ApiSession>('/sessions', token, {
        method: 'POST',
        body: JSON.stringify({
          session_number: form.session_number,
          title: form.title.trim(),
          date_played: form.date_played || undefined,
          preamble: form.preamble.trim() || undefined,
        }),
      })
      onCreated(session)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-amber-500/15 bg-[#181412] p-5 mb-4">
      <div className="mb-4 font-display text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-amber-500">
        Nueva sesión
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <InputField
          label="Número"
          type="number"
          min={1}
          value={form.session_number}
          onChange={e => set('session_number', parseInt(e.target.value))}
          required
        />
        <InputField
          label="Fecha"
          type="date"
          value={form.date_played}
          onChange={e => set('date_played', e.target.value)}
        />
        <div className="sm:col-span-2">
          <InputField
            label="Título"
            type="text"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="El nombre de esta sesión..."
            required
          />
        </div>
        <div className="sm:col-span-2">
          <TextareaField
            label="Prólogo (opcional)"
            rows={3}
            value={form.preamble}
            onChange={e => set('preamble', e.target.value)}
            placeholder="Texto introductorio en cursiva que aparece antes del resumen..."
          />
        </div>
      </div>
      {error && (
        <p className="mt-3 rounded border border-red-500/20 bg-red-500/8 px-3 py-2 text-[0.8rem] text-red-400">
          {error}
        </p>
      )}
      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-amber-500 px-4 py-2 font-display text-[0.72rem] font-bold uppercase tracking-[0.15em] text-stone-950 transition-colors hover:bg-amber-400 disabled:opacity-50"
        >
          {saving ? 'Creando...' : 'Crear sesión'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-[#3c3330] px-4 py-2 text-[0.72rem] text-stone-500 transition-colors hover:bg-[#232120] hover:text-stone-300"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

// ── Edit form ──────────────────────────────────────────────────────────────

interface EditFormProps {
  token: string
  session: ApiSession
  onSaved: (s: ApiSession) => void
  onCancel: () => void
}

function EditForm({ token, session, onSaved, onCancel }: EditFormProps) {
  const [form, setForm] = useState({
    title: session.title,
    date_played: session.date_played ? session.date_played.split('T')[0] : '',
    preamble: session.preamble ?? '',
    summary: session.summary ?? '',
    status: session.status,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(k: string, v: string) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const updated = await clientFetch<ApiSession>(`/sessions/${session._id}`, token, {
        method: 'PATCH',
        body: JSON.stringify({
          title: form.title.trim(),
          date_played: form.date_played || null,
          preamble: form.preamble.trim(),
          summary: form.summary.trim(),
          status: form.status,
        }),
      })
      onSaved(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 border-t border-[#2a2826] pt-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <InputField
          label="Título"
          type="text"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          required
        />
        <div>
          <label className="mb-1.5 block text-[0.65rem] font-medium uppercase tracking-[0.12em] text-stone-600">
            Estado
          </label>
          <select
            value={form.status}
            onChange={e => set('status', e.target.value)}
            className="w-full rounded-lg border border-[#3c3330] bg-[#0e0c0b] px-3.5 py-2.5 text-[0.88rem] text-stone-100 outline-none focus:border-amber-500/50"
          >
            <option value="draft">Borrador</option>
            <option value="played">Jugada</option>
            <option value="published">Publicada</option>
          </select>
        </div>
        <InputField
          label="Fecha"
          type="date"
          value={form.date_played}
          onChange={e => set('date_played', e.target.value)}
        />
        <div className="sm:col-span-2">
          <TextareaField
            label="Prólogo"
            rows={2}
            value={form.preamble}
            onChange={e => set('preamble', e.target.value)}
            placeholder="Texto introductorio en cursiva..."
          />
        </div>
        <div className="sm:col-span-2">
          <TextareaField
            label="Resumen / Crónica"
            rows={6}
            value={form.summary}
            onChange={e => set('summary', e.target.value)}
            placeholder="Relato de lo que ocurrió en la sesión..."
          />
        </div>
      </div>
      {error && (
        <p className="mt-3 rounded border border-red-500/20 bg-red-500/8 px-3 py-2 text-[0.8rem] text-red-400">
          {error}
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-amber-500 px-4 py-2 font-display text-[0.72rem] font-bold uppercase tracking-[0.15em] text-stone-950 transition-colors hover:bg-amber-400 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-[#3c3330] px-4 py-2 text-[0.72rem] text-stone-500 transition-colors hover:bg-[#232120] hover:text-stone-300"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

// ── Session row ────────────────────────────────────────────────────────────

interface SessionRowProps {
  session: ApiSession
  token: string
  onUpdated: (s: ApiSession) => void
  onDeleted: (id: string) => void
}

function SessionRow({ session, token, onUpdated, onDeleted }: SessionRowProps) {
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function cycleStatus() {
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(session.status) + 1) % STATUS_CYCLE.length]
    try {
      const updated = await clientFetch<ApiSession>(`/sessions/${session._id}`, token, {
        method: 'PATCH',
        body: JSON.stringify({ status: next }),
      })
      onUpdated(updated)
    } catch { /* ignore */ }
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    try {
      await clientFetch(`/sessions/${session._id}`, token, { method: 'DELETE' })
      onDeleted(session._id)
    } catch {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const dateStr = session.date_played
    ? new Date(session.date_played).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—'

  return (
    <div className="rounded-xl border border-[#2a2826] bg-[#181412] px-5 py-4">
      <div className="flex flex-wrap items-start gap-3">
        {/* Number */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-amber-500/20 bg-amber-500/8 font-display text-[0.82rem] font-bold text-amber-500">
          #{session.session_number}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="font-display text-[0.92rem] font-semibold tracking-[0.04em] text-stone-100 truncate">
            {session.title}
          </div>
          <div className="mt-0.5 text-[0.7rem] text-stone-600">{dateStr}</div>
        </div>

        {/* Status badge — click to cycle */}
        <button
          onClick={cycleStatus}
          title="Click para cambiar estado"
          className={`shrink-0 rounded border px-2 py-0.5 text-[0.6rem] font-medium uppercase tracking-[0.1em] transition-opacity hover:opacity-70 ${STATUS_STYLES[session.status]}`}
        >
          {STATUS_LABELS[session.status]}
        </button>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={() => { setEditing(e => !e); setConfirmDelete(false) }}
            className="rounded-md border border-[#3c3330] px-3 py-1.5 text-[0.68rem] text-stone-500 transition-colors hover:bg-[#232120] hover:text-stone-300"
          >
            {editing ? 'Cerrar' : 'Editar'}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`rounded-md border px-3 py-1.5 text-[0.68rem] transition-colors disabled:opacity-40 ${
              confirmDelete
                ? 'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                : 'border-[#3c3330] text-stone-600 hover:border-red-500/30 hover:text-red-400'
            }`}
          >
            {deleting ? '...' : confirmDelete ? '¿Confirmar?' : 'Eliminar'}
          </button>
        </div>
      </div>

      {editing && (
        <EditForm
          token={token}
          session={session}
          onSaved={s => { onUpdated(s); setEditing(false) }}
          onCancel={() => setEditing(false)}
        />
      )}
    </div>
  )
}

// ── Main tab ───────────────────────────────────────────────────────────────

export function SessionsTab({ token }: { token: string }) {
  const [sessions, setSessions] = useState<ApiSession[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'}/sessions`)
        .then(r => r.json()) as ApiSession[]
      setSessions(Array.isArray(data) ? data : [])
    } catch {
      setSessions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const nextNumber = sessions.length > 0
    ? Math.max(...sessions.map(s => s.session_number)) + 1
    : 1

  function handleCreated(s: ApiSession) {
    setSessions(prev => [s, ...prev].sort((a, b) => b.session_number - a.session_number))
    setShowCreate(false)
  }
  function handleUpdated(s: ApiSession) {
    setSessions(prev => prev.map(x => x._id === s._id ? s : x))
  }
  function handleDeleted(id: string) {
    setSessions(prev => prev.filter(x => x._id !== id))
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-5 flex items-center justify-between">
        <div className="text-[0.7rem] uppercase tracking-[0.15em] text-stone-600">
          {loading ? 'Cargando...' : `${sessions.length} sesión${sessions.length !== 1 ? 'es' : ''}`}
        </div>
        <button
          onClick={() => setShowCreate(s => !s)}
          className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 font-display text-[0.72rem] font-bold uppercase tracking-[0.15em] text-stone-950 transition-colors hover:bg-amber-400"
        >
          {showCreate ? '✕ Cancelar' : '+ Nueva sesión'}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <CreateForm
          token={token}
          nextNumber={nextNumber}
          onCreated={handleCreated}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {/* List */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-[#181412]" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#3c3330] py-16 text-center">
          <div className="mb-2 text-3xl opacity-25">📜</div>
          <div className="font-display text-[0.85rem] font-semibold tracking-[0.08em] text-stone-600">
            Sin sesiones creadas
          </div>
          <p className="font-body mt-1 text-[0.88rem] italic text-stone-700">
            Creá la primera sesión con el botón de arriba.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sessions.map(s => (
            <SessionRow
              key={s._id}
              session={s}
              token={token}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}
    </div>
  )
}
