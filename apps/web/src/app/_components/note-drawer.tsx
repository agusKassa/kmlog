'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { clientFetch } from '@/lib/client-api'
import { formatDate, type ApiNote, type MentionEntityType } from '@/lib/api'

// ── Constants ──────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

// ── Helpers ────────────────────────────────────────────────────────────────

function excerpt(content: string, max = 100): string {
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

// ── NoteItem ───────────────────────────────────────────────────────────────

function NoteItem({
  note,
  isOwner,
  active,
  onClick,
  onPin,
  onDelete,
}: {
  note: ApiNote
  isOwner: boolean
  active: boolean
  onClick: () => void
  onPin: () => void
  onDelete: () => void
}) {
  return (
    <div className={`group relative rounded-lg border transition-colors ${
      active ? 'border-amber-500/20 bg-amber-500/5' : 'border-[#2a2826] hover:border-[#3a3230] hover:bg-[#141210]'
    }`}>
      <button onClick={onClick} className="w-full px-3.5 py-3 text-left">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {note.is_pinned && (
              <span className="mb-1 inline-block text-[0.55rem] uppercase tracking-[0.1em] text-amber-500/70">
                📌 pineada
              </span>
            )}
            <div className={`truncate font-display text-[0.8rem] font-semibold leading-tight tracking-[0.03em] ${
              active ? 'text-amber-400' : 'text-stone-200'
            }`}>
              {note.title ?? <span className="font-body italic text-stone-600">Sin título</span>}
            </div>
            <p className="mt-0.5 line-clamp-2 text-[0.7rem] leading-snug text-stone-600">
              {excerpt(note.content)}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="text-[0.58rem] text-stone-700">{relativeDate(note.updatedAt)}</span>
            <span className={`rounded border px-1.5 py-0.5 text-[0.55rem] uppercase tracking-[0.06em] ${
              note.is_public
                ? 'border-green-500/15 bg-green-500/8 text-green-600'
                : 'border-stone-700/30 bg-stone-500/8 text-stone-700'
            }`}>
              {note.is_public ? 'pública' : 'privada'}
            </span>
          </div>
        </div>
      </button>

      {/* Hover actions */}
      {isOwner && (
        <div className="absolute right-2 top-2 hidden items-center gap-1 group-hover:flex">
          <button
            onClick={e => { e.stopPropagation(); onPin() }}
            title={note.is_pinned ? 'Desanclar' : 'Anclar'}
            className={`rounded p-1 transition-colors ${
              note.is_pinned ? 'text-amber-500 hover:text-amber-400' : 'text-stone-700 hover:text-amber-500'
            }`}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L9 9H3l5 4-2 8 6-4 6 4-2-8 5-4h-6L12 2z"/>
            </svg>
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete() }}
            className="rounded p-1 text-stone-700 transition-colors hover:text-red-400"
          >
            <svg width="10" height="10" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

// ── NoteDetail ─────────────────────────────────────────────────────────────

function NoteDetail({ note, isOwner, onEdit, onBack }: {
  note: ApiNote
  isOwner: boolean
  onEdit: () => void
  onBack: () => void
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between border-b border-[#2a2826] pb-3">
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-[0.7rem] text-stone-600 transition-colors hover:text-amber-400">
          <svg width="11" height="11" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"/>
          </svg>
          Volver
        </button>
        {isOwner && (
          <button onClick={onEdit}
            className="text-[0.7rem] text-stone-600 transition-colors hover:text-amber-400">
            Editar
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {note.is_pinned && (
          <div className="mb-2 text-[0.62rem] uppercase tracking-[0.1em] text-amber-500/60">📌 pineada</div>
        )}
        {note.title && (
          <h3 className="mb-2 font-display text-[1rem] font-bold tracking-[0.04em] text-stone-100">{note.title}</h3>
        )}
        <div className="mb-3 flex items-center gap-2">
          <span className={`rounded border px-1.5 py-0.5 text-[0.58rem] uppercase tracking-[0.08em] ${
            note.is_public ? 'border-green-500/20 bg-green-500/8 text-green-500' : 'border-stone-700/30 text-stone-600'
          }`}>
            {note.is_public ? 'Pública' : 'Privada'}
          </span>
          <span className="text-[0.62rem] text-stone-700">{relativeDate(note.updatedAt)}</span>
        </div>
        <div className="font-body space-y-3 text-[0.9rem] leading-[1.85] text-stone-300">
          {note.content.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </div>
    </div>
  )
}

// ── NoteEditor ─────────────────────────────────────────────────────────────

function NoteEditor({
  token,
  initial,
  entityType,
  entityId,
  onSaved,
  onCancel,
}: {
  token: string
  initial: ApiNote | null
  entityType: MentionEntityType
  entityId: string
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
      // Preserve existing mentions + ensure this entity is included
      const existingMentions = initial?.mentions ?? []
      const alreadyLinked = existingMentions.some(
        m => m.entity_type === entityType && m.entity_id === entityId
      )
      const mentions = alreadyLinked
        ? existingMentions
        : [...existingMentions, { entity_type: entityType, entity_id: entityId }]

      const body = {
        title:               title.trim() || null,
        content:             content.trim(),
        is_public:           isPublic,
        is_pinned:           isPinned,
        mentions,
      }

      let saved: ApiNote
      if (initial) {
        saved = await clientFetch<ApiNote>(`/notes/${initial._id}`, token, {
          method: 'PATCH',
          body: JSON.stringify(body),
        })
      } else {
        saved = await clientFetch<ApiNote>('/notes', token, {
          method: 'POST',
          body: JSON.stringify(body),
        })
      }
      onSaved(saved)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between border-b border-[#2a2826] pb-3">
        <span className="font-display text-[0.72rem] uppercase tracking-[0.15em] text-stone-600">
          {initial ? 'Editar nota' : 'Nueva nota'}
        </span>
        <button type="button" onClick={onCancel} className="text-[0.68rem] text-stone-700 hover:text-stone-400">
          Cancelar
        </button>
      </div>

      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Título (opcional)"
        className="border-b border-[#2a2826] bg-transparent pb-2 font-display text-[0.9rem] font-semibold tracking-[0.03em] text-stone-100 placeholder-stone-700 outline-none focus:border-amber-500/40"
      />

      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Escribí tu nota..."
        required
        rows={8}
        className="flex-1 resize-none bg-transparent font-body text-[0.88rem] leading-[1.85] text-stone-200 placeholder-stone-700 outline-none"
      />

      {error && (
        <p className="rounded border border-red-500/20 bg-red-500/8 px-3 py-2 text-[0.75rem] text-red-400">{error}</p>
      )}

      <div className="flex items-center justify-between border-t border-[#2a2826] pt-3">
        <div className="flex items-center gap-4">
          <label className="flex cursor-pointer items-center gap-1.5">
            <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)}
              className="h-3 w-3 accent-amber-500" />
            <span className="text-[0.65rem] text-stone-600">Pública</span>
          </label>
          <label className="flex cursor-pointer items-center gap-1.5">
            <input type="checkbox" checked={isPinned} onChange={e => setIsPinned(e.target.checked)}
              className="h-3 w-3 accent-amber-500" />
            <span className="text-[0.65rem] text-stone-600">Anclar</span>
          </label>
        </div>
        <button
          type="submit"
          disabled={saving || !content.trim()}
          className="rounded-lg bg-amber-500 px-4 py-1.5 font-display text-[0.68rem] font-bold uppercase tracking-[0.12em] text-stone-950 transition-colors hover:bg-amber-400 disabled:opacity-40"
        >
          {saving ? 'Guardando...' : initial ? 'Guardar' : 'Crear'}
        </button>
      </div>
    </form>
  )
}

// ── Main NoteDrawer ────────────────────────────────────────────────────────

type DrawerView =
  | { mode: 'list' }
  | { mode: 'detail'; note: ApiNote }
  | { mode: 'editor'; note: ApiNote | null }

export function NoteDrawer({
  entityType,
  entityId,
}: {
  entityType: MentionEntityType
  entityId: string
}) {
  const { token, user } = useAuth()
  const [open, setOpen]       = useState(false)
  const [tab, setTab]         = useState<'all' | 'mine'>('all')
  const [notes, setNotes]     = useState<ApiNote[]>([])
  const [fetching, setFetching] = useState(false)
  const [view, setView]       = useState<DrawerView>({ mode: 'list' })
  const drawerRef             = useRef<HTMLDivElement>(null)

  const isGm = user?.role === 'gm'

  const loadNotes = useCallback(async () => {
    setFetching(true)
    try {
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(
        `${API_URL}/notes/by-entity?entity_type=${entityType}&entity_id=${entityId}`,
        { headers }
      )
      if (res.ok) setNotes(await res.json() as ApiNote[])
    } catch { /* ignore */ } finally {
      setFetching(false)
    }
  }, [entityType, entityId, token])

  useEffect(() => {
    if (open) loadNotes()
  }, [open, loadNotes])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const myId = user?.sub

  const displayed = notes.filter(n => {
    if (tab === 'mine') return n.author_id === myId
    return true
  })

  function handleSaved(note: ApiNote) {
    setNotes(prev => {
      const exists = prev.find(n => n._id === note._id)
      if (exists) return prev.map(n => n._id === note._id ? note : n)
      return [note, ...prev]
    })
    setView({ mode: 'detail', note })
  }

  async function handlePin(note: ApiNote) {
    if (!token) return
    try {
      const updated = await clientFetch<ApiNote>(`/notes/${note._id}`, token, {
        method: 'PATCH',
        body: JSON.stringify({ is_pinned: !note.is_pinned }),
      })
      setNotes(prev => prev.map(n => n._id === updated._id ? updated : n))
      if (view.mode === 'detail' && view.note._id === note._id) {
        setView({ mode: 'detail', note: updated })
      }
    } catch { /* ignore */ }
  }

  async function handleDelete(note: ApiNote) {
    if (!token) return
    try {
      await clientFetch(`/notes/${note._id}`, token, { method: 'DELETE' })
      setNotes(prev => prev.filter(n => n._id !== note._id))
      setView({ mode: 'list' })
    } catch { /* ignore */ }
  }

  // Count for the toggle button
  const publicCount = notes.filter(n => n.is_public).length

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`fixed right-0 top-1/2 z-40 -translate-y-1/2 rounded-l-xl border border-r-0 px-2.5 py-4 transition-all ${
          open
            ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
            : 'border-[#3c3330] bg-[#181412]/90 text-stone-500 hover:border-amber-500/20 hover:text-amber-400'
        } backdrop-blur-sm`}
        title="Notas"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
        <div className="[writing-mode:vertical-rl] rotate-180 text-[0.58rem] font-semibold uppercase tracking-[0.15em]">
          Notas
        </div>
        {publicCount > 0 && (
          <div className="mt-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-[0.62rem] font-bold text-amber-400">
            {publicCount > 9 ? '9+' : publicCount}
          </div>
        )}
      </button>

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        className={`fixed right-0 top-0 z-50 flex h-full w-[360px] flex-col border-l border-[#2a2826] bg-[#0e0c0b] shadow-[-20px_0_60px_rgba(0,0,0,0.7)] transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#2a2826] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="font-display text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-stone-500">
              Notas
            </span>
            {notes.length > 0 && (
              <span className="rounded bg-stone-800 px-1.5 py-0.5 text-[0.6rem] text-stone-500">
                {notes.length}
              </span>
            )}
          </div>
          <button onClick={() => setOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-stone-600 transition-colors hover:bg-stone-800 hover:text-stone-300">
            <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </button>
        </div>

        {/* Tabs + New (list view only) */}
        {view.mode === 'list' && (
          <div className="flex shrink-0 items-center justify-between border-b border-[#2a2826] px-4 py-2">
            <div className="flex gap-1">
              {(['all', 'mine'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`rounded px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-[0.08em] transition-colors ${
                    tab === t ? 'bg-amber-500/15 text-amber-400' : 'text-stone-600 hover:text-stone-400'
                  }`}>
                  {t === 'all' ? 'Todas' : 'Mis notas'}
                </button>
              ))}
            </div>
            {token && (
              <button onClick={() => setView({ mode: 'editor', note: null })}
                className="flex items-center gap-1 rounded-md border border-[#2a2826] px-2.5 py-1 text-[0.65rem] text-stone-500 transition-colors hover:border-amber-500/20 hover:text-amber-400">
                <span>+</span> Nueva
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {view.mode === 'list' && (
            <>
              {fetching ? (
                <div className="flex items-center justify-center py-10">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#3c3330] border-t-amber-500" />
                </div>
              ) : displayed.length === 0 ? (
                <div className="py-10 text-center">
                  <div className="mb-2 text-2xl opacity-20">📝</div>
                  <p className="font-body text-[0.82rem] italic text-stone-700">
                    {tab === 'mine' ? 'No tenés notas aquí aún.' : 'Sin notas sobre esta entidad.'}
                  </p>
                  {token && tab === 'mine' && (
                    <button onClick={() => setView({ mode: 'editor', note: null })}
                      className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/8 px-3 py-1.5 text-[0.7rem] text-amber-400 transition-colors hover:bg-amber-500/12">
                      + Crear nota
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {displayed.map(note => (
                    <NoteItem
                      key={note._id}
                      note={note}
                      isOwner={note.author_id === myId || isGm}
                      active={false}
                      onClick={() => setView({ mode: 'detail', note })}
                      onPin={() => handlePin(note)}
                      onDelete={() => handleDelete(note)}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {view.mode === 'detail' && (
            <NoteDetail
              note={view.note}
              isOwner={view.note.author_id === myId || isGm}
              onEdit={() => setView({ mode: 'editor', note: view.note })}
              onBack={() => setView({ mode: 'list' })}
            />
          )}

          {view.mode === 'editor' && token && (
            <NoteEditor
              token={token}
              initial={view.note}
              entityType={entityType}
              entityId={entityId}
              onSaved={handleSaved}
              onCancel={() => setView(
                view.note ? { mode: 'detail', note: view.note } : { mode: 'list' }
              )}
            />
          )}
        </div>
      </div>

      {/* Backdrop (light) */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  )
}
