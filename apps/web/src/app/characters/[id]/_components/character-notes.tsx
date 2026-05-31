'use client'

import { useState, useEffect, useTransition, useCallback } from 'react'
import { Plus, Lock, Globe, Pencil, Trash2, X, Check } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { formatDate, type ApiNote } from '@/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

// ── Helpers ────────────────────────────────────────────────────────────────

function excerpt(content: string, max = 100): string {
  const first = content.split('\n').find(l => l.trim()) ?? content
  return first.length > max ? first.slice(0, max) + '…' : first
}

// ── Note card ──────────────────────────────────────────────────────────────

function NoteCard({
  note,
  canEdit,
  onEdit,
  onDelete,
}: {
  note: ApiNote
  canEdit: boolean
  onEdit: (note: ApiNote) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="group rounded-lg border border-[#222120] bg-[#181412] px-4 py-3.5 transition-colors hover:border-[#2a2826]">
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {note.is_public ? (
            <Globe className="h-3 w-3 shrink-0 text-sky-500/60" />
          ) : (
            <Lock className="h-3 w-3 shrink-0 text-stone-600" />
          )}
          <span className="font-display truncate text-[0.82rem] font-semibold tracking-[0.03em] text-stone-200">
            {note.title ?? <span className="font-body font-normal italic text-stone-600">Sin título</span>}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {canEdit && (
            <>
              <button
                onClick={() => onEdit(note)}
                className="rounded p-1 text-stone-600 transition-colors hover:text-amber-400"
              >
                <Pencil className="h-3 w-3" />
              </button>
              <button
                onClick={() => onDelete(note._id)}
                className="rounded p-1 text-stone-600 transition-colors hover:text-red-400"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </>
          )}
        </div>
      </div>
      <p className="font-body text-[0.76rem] leading-relaxed text-stone-600">{excerpt(note.content)}</p>
      <p className="mt-2 text-[0.62rem] text-stone-700">{formatDate(note.updatedAt)}</p>
    </div>
  )
}

// ── Note form ──────────────────────────────────────────────────────────────

interface NoteFormProps {
  characterId: string
  token: string
  note?: ApiNote
  onSaved: () => void
  onCancel: () => void
}

function NoteForm({ characterId, token, note, onSaved, onCancel }: NoteFormProps) {
  const [title, setTitle]       = useState(note?.title ?? '')
  const [content, setContent]   = useState(note?.content ?? '')
  const [isPublic, setIsPublic] = useState(note?.is_public ?? false)
  const [error, setError]       = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) { setError('El contenido no puede estar vacío.'); return }

    const body = {
      title: title.trim() || null,
      content: content.trim(),
      is_public: isPublic,
      mentions: [{ entity_type: 'character', entity_id: characterId }],
    }

    startTransition(async () => {
      try {
        const url    = note ? `${API_URL}/notes/${note._id}` : `${API_URL}/notes`
        const method = note ? 'PATCH' : 'POST'
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
        onSaved()
      } catch {
        setError('Error de red.')
      }
    })
  }

  const inputCls = 'w-full rounded-lg border border-[#2a2826] bg-[#0e0c0b] px-3 py-2 text-[0.82rem] text-stone-200 placeholder-stone-700 outline-none focus:border-amber-500/30'

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-amber-500/15 bg-[#141210] p-4">
      <div className="mb-3 space-y-2.5">
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Título (opcional)"
          className={inputCls}
        />
        <textarea
          required
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={4}
          placeholder="Escribí tu nota..."
          className={inputCls + ' resize-none'}
        />
      </div>

      {/* Visibility toggle */}
      <label className="mb-3 flex cursor-pointer items-center gap-2.5">
        <button
          type="button"
          role="switch"
          aria-checked={isPublic}
          onClick={() => setIsPublic(v => !v)}
          className={`relative h-4 w-8 shrink-0 rounded-full border transition-colors ${
            isPublic ? 'border-sky-500/40 bg-sky-500/20' : 'border-[#3c3330] bg-[#1e1c1a]'
          }`}
        >
          <span className={`absolute top-0.5 h-3 w-3 rounded-full border transition-all ${
            isPublic ? 'left-[17px] border-sky-500/60 bg-sky-400' : 'left-0.5 border-[#3c3330] bg-stone-600'
          }`} />
        </button>
        <span className="text-[0.75rem] text-stone-500">
          {isPublic ? 'Visible para todos' : 'Solo tú y el GM'}
        </span>
      </label>

      {error && <p className="mb-2 text-[0.72rem] text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-md bg-amber-500 px-3 py-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-stone-950 transition-colors hover:bg-amber-400 disabled:opacity-50"
        >
          <Check className="h-3 w-3" />
          {isPending ? 'Guardando...' : note ? 'Actualizar' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[0.72rem] text-stone-500 transition-colors hover:text-stone-300"
        >
          <X className="h-3 w-3" />
          Cancelar
        </button>
      </div>
    </form>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

interface CharacterNotesProps {
  characterId: string
  ownerId: string
}

export function CharacterNotes({ characterId, ownerId }: CharacterNotesProps) {
  const { user, token, isGm } = useAuth()
  const [notes, setNotes]           = useState<ApiNote[] | null>(null)
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [editingNote, setEditingNote] = useState<ApiNote | null>(null)
  const [showAll, setShowAll]       = useState(false)

  const isOwner = !!user && (user.sub === ownerId || isGm)
  const canWrite = !!token && (isOwner || isGm)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`${API_URL}/notes/by-character/${characterId}`, { headers })
      if (res.ok) setNotes(await res.json() as ApiNote[])
    } finally {
      setLoading(false)
    }
  }, [characterId, token])

  useEffect(() => { void load() }, [load])

  async function handleDelete(id: string) {
    if (!token) return
    await fetch(`${API_URL}/notes/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    void load()
  }

  function handleSaved() {
    setShowForm(false)
    setEditingNote(null)
    void load()
  }

  const displayed = notes ? (showAll ? notes : notes.slice(0, 5)) : []

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-4 w-0.5 rounded-full bg-amber-500/50" />
          <span className="font-display text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-stone-500">
            Notas del personaje
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-[#2a2826] to-transparent" style={{ width: '4rem' }} />
          {notes && notes.length > 0 && (
            <span className="rounded-full border border-[#2a2826] bg-[#141210] px-2 py-0.5 text-[0.6rem] text-stone-600">
              {notes.length}
            </span>
          )}
        </div>
        {canWrite && !showForm && !editingNote && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-md border border-[#2a2826] bg-[#141210] px-2.5 py-1.5 text-[0.7rem] text-stone-500 transition-colors hover:border-amber-500/20 hover:text-amber-400"
          >
            <Plus className="h-3 w-3" />
            Nueva nota
          </button>
        )}
      </div>

      {/* Create form */}
      {showForm && token && (
        <div className="mb-3">
          <NoteForm
            characterId={characterId}
            token={token}
            onSaved={handleSaved}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Notes list */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#3c3330] border-t-amber-500" />
        </div>
      ) : !notes || notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#2a2826] px-6 py-10 text-center">
          <div className="mb-2 text-2xl opacity-25">📝</div>
          <p className="font-display text-[0.78rem] font-semibold tracking-[0.06em] text-stone-600">
            Sin notas aún
          </p>
          {canWrite && (
            <p className="font-body mt-1 text-[0.75rem] italic text-stone-700">
              Usá el botón "Nueva nota" para registrar observaciones sobre este personaje.
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {displayed.map(note => (
            editingNote?._id === note._id ? (
              <NoteForm
                key={note._id}
                characterId={characterId}
                token={token!}
                note={note}
                onSaved={handleSaved}
                onCancel={() => setEditingNote(null)}
              />
            ) : (
              <NoteCard
                key={note._id}
                note={note}
                canEdit={!!token && (isGm || (!!user && user.sub === note.author_id))}
                onEdit={setEditingNote}
                onDelete={handleDelete}
              />
            )
          ))}

          {notes.length > 5 && (
            <button
              onClick={() => setShowAll(v => !v)}
              className="mt-1 text-center text-[0.72rem] text-stone-600 transition-colors hover:text-amber-400"
            >
              {showAll ? '▲ Ver menos' : `▼ Ver todas (${notes.length})`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
