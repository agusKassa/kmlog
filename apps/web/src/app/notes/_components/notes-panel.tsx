'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { clientFetch } from '@/lib/client-api'
import { formatDate, type ApiNote } from '@/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

// ── Helpers ────────────────────────────────────────────────────────────────

function excerpt(content: string, max = 80): string {
  const first = content.split('\n').find(l => l.trim()) ?? content
  return first.length > max ? first.slice(0, max) + '…' : first
}

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'ahora'
  if (mins < 60)  return `hace ${mins}m`
  if (hours < 24) return `hace ${hours}h`
  if (days < 7)   return `hace ${days}d`
  return formatDate(iso)
}

// ── Sub-components ─────────────────────────────────────────────────────────

function NoteListItem({
  note,
  active,
  onClick,
}: {
  note: ApiNote
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-lg px-3.5 py-3 text-left transition-colors ${
        active
          ? 'bg-amber-500/8 border border-amber-500/15'
          : 'border border-transparent hover:bg-[#181412]'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={`font-display truncate text-[0.82rem] font-semibold tracking-[0.03em] ${
          active ? 'text-amber-400' : 'text-stone-200'
        }`}>
          {note.is_pinned && <span className="mr-1.5 text-[0.7rem]">📌</span>}
          {note.title ?? <span className="font-body italic text-stone-600">Sin título</span>}
        </span>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-[0.6rem] text-stone-700">{relativeDate(note.updatedAt)}</span>
          <span className={`rounded border px-1 py-px text-[0.55rem] uppercase ${
            note.is_public ? 'border-green-500/15 text-green-600' : 'border-stone-700/30 text-stone-700'
          }`}>
            {note.is_public ? 'pública' : 'privada'}
          </span>
        </div>
      </div>
      <p className="mt-0.5 truncate text-[0.72rem] text-stone-600">
        {excerpt(note.content)}
      </p>
    </button>
  )
}

// ── Note detail ────────────────────────────────────────────────────────────

function NoteDetail({
  note,
  isOwner,
  onEdit,
  onDelete,
}: {
  note: ApiNote
  isOwner: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  return (
    <div className="flex h-full flex-col" style={{ animation: 'fade-up 0.3s ease both' }}>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          {note.title ? (
            <h2 className="font-display text-[1.3rem] font-bold leading-tight tracking-[0.05em] text-stone-50">
              {note.title}
            </h2>
          ) : (
            <h2 className="font-body text-[1.1rem] italic text-stone-600">Sin título</h2>
          )}
          <div className="mt-1.5 text-[0.65rem] uppercase tracking-[0.12em] text-stone-700">
            {formatDate(note.updatedAt)}
            {note.createdAt !== note.updatedAt && ' · editada'}
          </div>
        </div>

        {isOwner && (
          <div className="flex shrink-0 gap-2">
            <button
              onClick={onEdit}
              className="rounded-md border border-[#3c3330] px-3 py-1.5 text-[0.7rem] text-stone-500 transition-colors hover:bg-[#232120] hover:text-stone-300"
            >
              Editar
            </button>
            <button
              onClick={() => {
                if (!confirmDelete) { setConfirmDelete(true); return }
                setDeleting(true)
                onDelete()
              }}
              disabled={deleting}
              className={`rounded-md border px-3 py-1.5 text-[0.7rem] transition-colors disabled:opacity-40 ${
                confirmDelete
                  ? 'border-red-500/30 bg-red-500/10 text-red-400'
                  : 'border-[#3c3330] text-stone-600 hover:border-red-500/30 hover:text-red-400'
              }`}
            >
              {confirmDelete ? '¿Confirmar?' : 'Eliminar'}
            </button>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="mb-6 h-px bg-[#2a2826]" />

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="font-body space-y-4 text-[1rem] leading-[1.9] text-stone-300">
          {note.content.split('\n\n').map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Note editor ────────────────────────────────────────────────────────────

function NoteEditor({
  token,
  initial,
  onSaved,
  onCancel,
}: {
  token: string
  initial: ApiNote | null
  onSaved: (note: ApiNote) => void
  onCancel: () => void
}) {
  const [title,    setTitle]    = useState(initial?.title    ?? '')
  const [content,  setContent]  = useState(initial?.content  ?? '')
  const [isPublic, setIsPublic] = useState(initial?.is_public ?? false)
  const [isPinned, setIsPinned] = useState(initial?.is_pinned ?? false)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setError(null)
    setSaving(true)
    try {
      const body = { title: title.trim() || null, content: content.trim(), is_public: isPublic, is_pinned: isPinned }
      let note: ApiNote
      if (initial) {
        note = await clientFetch<ApiNote>(`/notes/${initial._id}`, token, { method: 'PATCH', body: JSON.stringify(body) })
      } else {
        note = await clientFetch<ApiNote>('/notes', token, { method: 'POST', body: JSON.stringify(body) })
      }
      onSaved(note)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col gap-4" style={{ animation: 'fade-up 0.3s ease both' }}>
      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Título (opcional)"
        className="w-full border-b border-[#3c3330] bg-transparent pb-3 font-display text-[1.2rem] font-semibold tracking-[0.04em] text-stone-100 placeholder-stone-700 outline-none transition-colors focus:border-amber-500/50"
      />

      {/* Content */}
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Escribí tu nota aquí... Usá doble salto de línea para separar párrafos."
        required
        className="flex-1 resize-none bg-transparent font-body text-[0.98rem] leading-[1.9] text-stone-200 placeholder-stone-700 outline-none"
      />

      {error && (
        <p className="rounded border border-red-500/20 bg-red-500/8 px-3 py-2 text-[0.8rem] text-red-400">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-[#2a2826] pt-4">
        <div className="flex items-center gap-4">
          <label className="flex cursor-pointer items-center gap-1.5">
            <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="h-3 w-3 accent-amber-500" />
            <span className="text-[0.68rem] text-stone-600">Pública</span>
          </label>
          <label className="flex cursor-pointer items-center gap-1.5">
            <input type="checkbox" checked={isPinned} onChange={e => setIsPinned(e.target.checked)} className="h-3 w-3 accent-amber-500" />
            <span className="text-[0.68rem] text-stone-600">Anclar 📌</span>
          </label>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving || !content.trim()}
            className="rounded-lg bg-amber-500 px-4 py-2 font-display text-[0.72rem] font-bold uppercase tracking-[0.15em] text-stone-950 transition-colors hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? 'Guardando...' : initial ? 'Guardar cambios' : 'Crear nota'}
          </button>
          <button type="button" onClick={onCancel}
            className="rounded-lg border border-[#3c3330] px-4 py-2 text-[0.72rem] text-stone-500 transition-colors hover:bg-[#232120] hover:text-stone-300">
            Cancelar
          </button>
        </div>
      </div>
    </form>
  )
}

// ── Empty right panel ──────────────────────────────────────────────────────

function EmptyRight({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <div className="text-4xl opacity-20">✍️</div>
      <div className="font-display text-[0.85rem] font-semibold tracking-[0.08em] text-stone-600">
        Seleccioná una nota o creá una nueva
      </div>
      <button
        onClick={onNew}
        className="rounded-lg bg-amber-500 px-4 py-2 font-display text-[0.72rem] font-bold uppercase tracking-[0.15em] text-stone-950 transition-colors hover:bg-amber-400"
      >
        + Nueva nota
      </button>
    </div>
  )
}

// ── Main panel ─────────────────────────────────────────────────────────────

type RightPanel =
  | { mode: 'empty' }
  | { mode: 'detail'; note: ApiNote }
  | { mode: 'editor'; note: ApiNote | null }

export function NotesPanel() {
  const { loading, isAuthenticated, token } = useAuth()
  const router = useRouter()

  const [notes, setNotes] = useState<ApiNote[]>([])
  const [fetching, setFetching] = useState(true)
  const [search, setSearch] = useState('')
  const [right, setRight] = useState<RightPanel>({ mode: 'empty' })

  // ── redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login')
  }, [loading, isAuthenticated, router])

  // ── load notes
  const loadNotes = useCallback(async () => {
    if (!token) return
    setFetching(true)
    try {
      const data = await clientFetch<ApiNote[]>('/notes', token)
      setNotes(Array.isArray(data) ? data : [])
    } catch {
      setNotes([])
    } finally {
      setFetching(false)
    }
  }, [token])

  useEffect(() => {
    if (token) loadNotes()
  }, [token, loadNotes])

  // ── derived
  const filtered = notes.filter(n => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      (n.title ?? '').toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q)
    )
  })

  const selectedId = right.mode === 'detail' ? right.note._id
    : right.mode === 'editor' && right.note ? right.note._id
    : null

  function openDetail(note: ApiNote) {
    setRight({ mode: 'detail', note })
  }

  function openNew() {
    setRight({ mode: 'editor', note: null })
  }

  function handleSaved(note: ApiNote) {
    setNotes(prev => {
      const exists = prev.find(n => n._id === note._id)
      if (exists) return prev.map(n => n._id === note._id ? note : n).sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
      return [note, ...prev]
    })
    setRight({ mode: 'detail', note })
  }

  async function handleDelete(note: ApiNote) {
    if (!token) return
    try {
      await clientFetch(`/notes/${note._id}`, token, { method: 'DELETE' })
      setNotes(prev => prev.filter(n => n._id !== note._id))
      setRight({ mode: 'empty' })
    } catch { /* ignore */ }
  }

  // ── loading / auth states
  if (loading || (!isAuthenticated && !loading)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#3c3330] border-t-amber-500" />
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-7xl gap-0 px-6 py-10" style={{ minHeight: 'calc(100vh - 140px)' }}>

      {/* ── Left: list ── */}
      <aside className="flex w-72 shrink-0 flex-col border-r border-[#2a2826] pr-4">

        {/* Search + new */}
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar notas..."
            className="flex-1 rounded-lg border border-[#3c3330] bg-[#181412] px-3 py-2 text-[0.8rem] text-stone-300 placeholder-stone-700 outline-none transition-colors focus:border-amber-500/40"
          />
          <button
            onClick={openNew}
            className="rounded-lg bg-amber-500 px-3 py-2 font-display text-[0.7rem] font-bold text-stone-950 transition-colors hover:bg-amber-400"
            title="Nueva nota"
          >
            +
          </button>
        </div>

        {/* Count */}
        <div className="mb-3 text-[0.62rem] uppercase tracking-[0.14em] text-stone-700">
          {fetching ? 'Cargando...' : `${filtered.length} nota${filtered.length !== 1 ? 's' : ''}`}
        </div>

        {/* List */}
        <div className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {fetching ? (
            <>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-[#181412]" />
              ))}
            </>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center">
              <p className="font-body text-[0.85rem] italic text-stone-700">
                {search ? 'Sin resultados.' : 'Aún no tenés notas.'}
              </p>
            </div>
          ) : (
            filtered.map(note => (
              <NoteListItem
                key={note._id}
                note={note}
                active={selectedId === note._id}
                onClick={() => openDetail(note)}
              />
            ))
          )}
        </div>
      </aside>

      {/* ── Right: detail / editor ── */}
      <div className="flex flex-1 flex-col pl-8">
        {right.mode === 'empty' && (
          <EmptyRight onNew={openNew} />
        )}
        {right.mode === 'detail' && (
          <NoteDetail
            note={right.note}
            isOwner={true}
            onEdit={() => setRight({ mode: 'editor', note: right.note })}
            onDelete={() => handleDelete(right.note)}
          />
        )}
        {right.mode === 'editor' && (
          <NoteEditor
            token={token!}
            initial={right.note}
            onSaved={handleSaved}
            onCancel={() => setRight(
              right.note ? { mode: 'detail', note: right.note } : { mode: 'empty' }
            )}
          />
        )}
      </div>

    </div>
  )
}
