'use client'

import { useState, useEffect, useCallback } from 'react'
import { clientFetch } from '@/lib/client-api'
import type { ApiEvent, ApiLootEntry } from '@/lib/api'

type EventKind = 'event' | 'encounter'
type EventType = 'exploration' | 'social' | 'narrative' | 'rest' | 'downtime'
type Difficulty = 'trivial' | 'low' | 'moderate' | 'severe' | 'extreme'
type LootType = ApiLootEntry['type']

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  exploration: 'Exploración',
  social:      'Social',
  narrative:   'Narrativa',
  rest:        'Descanso',
  downtime:    'Tiempo libre',
}

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  trivial:  'Trivial',
  low:      'Baja',
  moderate: 'Moderada',
  severe:   'Severa',
  extreme:  'Extrema',
}

const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  trivial:  'text-stone-500',
  low:      'text-sky-400',
  moderate: 'text-amber-400',
  severe:   'text-orange-400',
  extreme:  'text-rose-400',
}

const LOOT_TYPES: LootType[] = ['weapon', 'armor', 'consumable', 'treasure', 'magic', 'other']
const LOOT_TYPE_LABELS: Record<LootType, string> = {
  weapon: 'Arma', armor: 'Armadura', consumable: 'Consumible',
  treasure: 'Tesoro', magic: 'Mágico', other: 'Otro',
}

const inputCls = 'w-full rounded-lg border border-[#3c3330] bg-[#0c0a09] px-3 py-2 text-[0.82rem] text-stone-200 placeholder-stone-700 outline-none focus:border-amber-500/40'
const selectCls = `${inputCls}`

// ── Helpers ───────────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-[0.6rem] font-medium uppercase tracking-[0.12em] text-stone-600">
      {children}
    </label>
  )
}

// ── Add Loot Form ─────────────────────────────────────────────────────────────

function AddLootForm({
  sessionId, eventId, token,
  onAdded, onCancel,
}: {
  sessionId: string
  eventId: string
  token: string
  onAdded: (e: ApiEvent) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    name: '', type: 'other' as LootType,
    value_gp: '', quantity: '1', description: '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    setSaving(true)
    try {
      const updated = await clientFetch<ApiEvent>(
        `/sessions/${sessionId}/events/${eventId}/loot`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            name: form.name.trim(),
            type: form.type,
            value_gp: form.value_gp ? parseFloat(form.value_gp) : 0,
            quantity: parseInt(form.quantity) || 1,
            description: form.description.trim() || undefined,
          }),
        }
      )
      if (updated) onAdded(updated)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 rounded-lg border border-[#2a2826] bg-[#0e0c0b] p-3">
      <div className="mb-2 text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-amber-600/70">
        Agregar loot
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <Label>Nombre</Label>
          <input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Espada +1, Poción de curación..." required />
        </div>
        <div>
          <Label>Tipo</Label>
          <select className={selectCls} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as LootType }))}>
            {LOOT_TYPES.map(t => <option key={t} value={t}>{LOOT_TYPE_LABELS[t]}</option>)}
          </select>
        </div>
        <div>
          <Label>Cant.</Label>
          <input className={inputCls} type="number" min={1} value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
        </div>
        <div>
          <Label>Valor (gp)</Label>
          <input className={inputCls} type="number" min={0} step={0.01} value={form.value_gp} onChange={e => setForm(f => ({ ...f, value_gp: e.target.value }))} placeholder="0" />
        </div>
        <div>
          <Label>Descripción</Label>
          <input className={inputCls} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Opcional..." />
        </div>
      </div>
      <div className="mt-2 flex gap-1.5">
        <button type="submit" disabled={saving || !form.name} className="rounded-md bg-amber-500 px-3 py-1.5 text-[0.68rem] font-bold text-stone-950 hover:bg-amber-400 disabled:opacity-40">
          {saving ? '…' : 'Agregar'}
        </button>
        <button type="button" onClick={onCancel} className="rounded-md border border-[#3c3330] px-3 py-1.5 text-[0.68rem] text-stone-600 hover:text-stone-400">
          Cancelar
        </button>
      </div>
    </form>
  )
}

// ── Add XP Form ───────────────────────────────────────────────────────────────

function AddXpForm({
  sessionId, eventId, token,
  onAdded, onCancel,
}: {
  sessionId: string
  eventId: string
  token: string
  onAdded: (e: ApiEvent) => void
  onCancel: () => void
}) {
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    setSaving(true)
    try {
      const updated = await clientFetch<ApiEvent>(
        `/sessions/${sessionId}/events/${eventId}/xp`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({ amount: parseInt(amount), reason: reason.trim() }),
        }
      )
      if (updated) { onAdded(updated); setAmount(''); setReason('') }
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 rounded-lg border border-[#2a2826] bg-[#0e0c0b] p-3">
      <div className="mb-2 text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-amber-600/70">
        Agregar XP
      </div>
      <div className="flex gap-2">
        <div className="w-24 shrink-0">
          <Label>Cantidad</Label>
          <input className={inputCls} type="number" min={1} value={amount} onChange={e => setAmount(e.target.value)} placeholder="30" required />
        </div>
        <div className="flex-1">
          <Label>Motivo</Label>
          <input className={inputCls} value={reason} onChange={e => setReason(e.target.value)} placeholder="Derrotar al orco jefe..." required />
        </div>
      </div>
      <div className="mt-2 flex gap-1.5">
        <button type="submit" disabled={saving || !amount || !reason} className="rounded-md bg-amber-500 px-3 py-1.5 text-[0.68rem] font-bold text-stone-950 hover:bg-amber-400 disabled:opacity-40">
          {saving ? '…' : 'Agregar'}
        </button>
        <button type="button" onClick={onCancel} className="rounded-md border border-[#3c3330] px-3 py-1.5 text-[0.68rem] text-stone-600 hover:text-stone-400">
          Cancelar
        </button>
      </div>
    </form>
  )
}

// ── Event row ─────────────────────────────────────────────────────────────────

function EventRow({
  event, sessionId, token,
  onUpdated, onDeleted,
}: {
  event: ApiEvent
  sessionId: string
  token: string
  onUpdated: (e: ApiEvent) => void
  onDeleted: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [showLoot, setShowLoot] = useState(false)
  const [showXp, setShowXp] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: event.title,
    description: event.description ?? '',
    event_type: (event.event_type ?? 'exploration') as EventType,
    difficulty: (event.difficulty ?? 'moderate') as Difficulty,
  })
  const [saving, setSaving] = useState(false)

  async function handleSave(ev: React.FormEvent) {
    ev.preventDefault()
    setSaving(true)
    try {
      const updated = await clientFetch<ApiEvent>(
        `/sessions/${sessionId}/events/${event._id}`,
        token,
        {
          method: 'PATCH',
          body: JSON.stringify({
            title: editForm.title.trim(),
            description: editForm.description.trim() || undefined,
            ...(event.kind === 'event'     ? { event_type: editForm.event_type } : {}),
            ...(event.kind === 'encounter' ? { difficulty: editForm.difficulty } : {}),
          }),
        }
      )
      if (updated) { onUpdated(updated); setEditing(false) }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirmDel) { setConfirmDel(true); return }
    setDeleting(true)
    try {
      await clientFetch(`/sessions/${sessionId}/events/${event._id}`, token, { method: 'DELETE' })
      onDeleted(event._id)
    } catch {
      setDeleting(false)
      setConfirmDel(false)
    }
  }

  const isEncounter = event.kind === 'encounter'

  return (
    <div className="rounded-lg border border-[#2a2826] bg-[#181412]">
      {/* Header row */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-[0.1em] ${
          isEncounter
            ? 'border-rose-500/25 bg-rose-500/8 text-rose-400'
            : 'border-sky-500/25 bg-sky-500/8 text-sky-400'
        }`}>
          {isEncounter ? 'Encuentro' : 'Evento'}
        </span>

        {isEncounter && event.difficulty && (
          <span className={`text-[0.65rem] font-medium ${DIFFICULTY_COLOR[event.difficulty as Difficulty] ?? ''}`}>
            {DIFFICULTY_LABELS[event.difficulty as Difficulty] ?? event.difficulty}
          </span>
        )}
        {!isEncounter && event.event_type && (
          <span className="text-[0.65rem] text-stone-600">
            {EVENT_TYPE_LABELS[event.event_type as EventType] ?? event.event_type}
          </span>
        )}

        <span className="flex-1 truncate font-display text-[0.82rem] font-semibold text-stone-200">
          {event.title}
        </span>

        <div className="flex shrink-0 items-center gap-1">
          <span className="text-[0.62rem] text-stone-700">
            {event.xp_entries.length > 0 && `⭐${event.xp_entries.length}`}
          </span>
          <span className="text-[0.62rem] text-stone-700">
            {event.loot.length > 0 && `🎁${event.loot.length}`}
          </span>

          <button onClick={() => { setEditing(e => !e); setShowLoot(false); setShowXp(false) }}
            className="ml-1 rounded border border-[#2a2826] px-2 py-1 text-[0.62rem] text-stone-600 hover:text-stone-300">
            {editing ? 'Cerrar' : 'Editar'}
          </button>
          <button onClick={handleDelete} disabled={deleting}
            className={`rounded border px-2 py-1 text-[0.62rem] transition-colors disabled:opacity-40 ${
              confirmDel ? 'border-rose-500/30 text-rose-400' : 'border-[#2a2826] text-stone-700 hover:text-rose-400'
            }`}>
            {deleting ? '…' : confirmDel ? '¿Borrar?' : '✕'}
          </button>
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <form onSubmit={handleSave} className="border-t border-[#2a2826] px-4 pb-4 pt-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <Label>Título</Label>
              <input className={inputCls} value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} required />
            </div>
            {isEncounter ? (
              <div>
                <Label>Dificultad</Label>
                <select className={selectCls} value={editForm.difficulty} onChange={e => setEditForm(f => ({ ...f, difficulty: e.target.value as Difficulty }))}>
                  {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map(d =>
                    <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>
                  )}
                </select>
              </div>
            ) : (
              <div>
                <Label>Tipo</Label>
                <select className={selectCls} value={editForm.event_type} onChange={e => setEditForm(f => ({ ...f, event_type: e.target.value as EventType }))}>
                  {(Object.keys(EVENT_TYPE_LABELS) as EventType[]).map(t =>
                    <option key={t} value={t}>{EVENT_TYPE_LABELS[t]}</option>
                  )}
                </select>
              </div>
            )}
            <div className="col-span-2">
              <Label>Descripción</Label>
              <textarea className={`${inputCls} resize-y leading-relaxed`} rows={2} value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} placeholder="Descripción del evento..." />
            </div>
          </div>
          <div className="mt-2 flex gap-1.5">
            <button type="submit" disabled={saving} className="rounded-md bg-amber-500 px-3 py-1.5 text-[0.68rem] font-bold text-stone-950 hover:bg-amber-400 disabled:opacity-40">
              {saving ? '…' : 'Guardar'}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="rounded-md border border-[#3c3330] px-3 py-1.5 text-[0.68rem] text-stone-600 hover:text-stone-400">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* XP + Loot quick view & actions */}
      {!editing && (
        <div className="border-t border-[#2a2826] px-4 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => { setShowXp(s => !s); setShowLoot(false) }}
              className="text-[0.65rem] text-stone-600 hover:text-amber-400 transition-colors"
            >
              + XP
            </button>
            <button
              onClick={() => { setShowLoot(s => !s); setShowXp(false) }}
              className="text-[0.65rem] text-stone-600 hover:text-amber-400 transition-colors"
            >
              + Loot
            </button>

            {/* XP pills */}
            {event.xp_entries.map(xp => (
              <span key={xp._id} className={`rounded border px-1.5 py-0.5 text-[0.58rem] ${
                xp.status === 'approved' ? 'border-emerald-500/20 text-emerald-500'
                : xp.status === 'rejected' ? 'border-rose-500/20 text-rose-500/60'
                : 'border-amber-500/20 text-amber-500/60'
              }`}>
                {xp.amount} XP · {xp.reason}
              </span>
            ))}

            {/* Loot pills */}
            {event.loot.map(item => (
              <span key={item._id} className="rounded border border-[#2a2826] px-1.5 py-0.5 text-[0.58rem] text-stone-600">
                {item.name}{item.quantity > 1 ? ` ×${item.quantity}` : ''}
              </span>
            ))}
          </div>

          {showXp && (
            <AddXpForm
              sessionId={sessionId}
              eventId={event._id}
              token={token}
              onAdded={e => { onUpdated(e); setShowXp(false) }}
              onCancel={() => setShowXp(false)}
            />
          )}

          {showLoot && (
            <AddLootForm
              sessionId={sessionId}
              eventId={event._id}
              token={token}
              onAdded={e => { onUpdated(e); setShowLoot(false) }}
              onCancel={() => setShowLoot(false)}
            />
          )}
        </div>
      )}
    </div>
  )
}

// ── Create event form ─────────────────────────────────────────────────────────

function CreateEventForm({
  sessionId, token, nextOrder,
  onCreated, onCancel,
}: {
  sessionId: string
  token: string
  nextOrder: number
  onCreated: (e: ApiEvent) => void
  onCancel: () => void
}) {
  const [kind, setKind] = useState<EventKind>('event')
  const [form, setForm] = useState({
    title: '',
    description: '',
    event_type: 'exploration' as EventType,
    difficulty: 'moderate' as Difficulty,
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    setSaving(true)
    try {
      const created = await clientFetch<ApiEvent>(
        `/sessions/${sessionId}/events`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            kind,
            title: form.title.trim(),
            description: form.description.trim() || undefined,
            order: nextOrder,
            ...(kind === 'event'     ? { event_type: form.event_type }   : {}),
            ...(kind === 'encounter' ? { difficulty: form.difficulty }    : {}),
          }),
        }
      )
      if (created) onCreated(created)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-amber-500/15 bg-[#181412] p-4">
      {/* Kind selector */}
      <div className="mb-3 flex gap-2">
        {(['event', 'encounter'] as EventKind[]).map(k => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`rounded-md border px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.08em] transition-colors ${
              kind === k
                ? k === 'encounter'
                  ? 'border-rose-500/40 bg-rose-500/10 text-rose-400'
                  : 'border-sky-500/40 bg-sky-500/10 text-sky-400'
                : 'border-[#3c3330] text-stone-600 hover:text-stone-400'
            }`}
          >
            {k === 'event' ? 'Evento' : 'Encuentro'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <Label>Título</Label>
          <input className={inputCls} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder={kind === 'encounter' ? 'Emboscada de bandidos...' : 'Llegada a la ciudad...'} required />
        </div>

        {kind === 'event' ? (
          <div>
            <Label>Tipo</Label>
            <select className={selectCls} value={form.event_type} onChange={e => setForm(f => ({ ...f, event_type: e.target.value as EventType }))}>
              {(Object.keys(EVENT_TYPE_LABELS) as EventType[]).map(t =>
                <option key={t} value={t}>{EVENT_TYPE_LABELS[t]}</option>
              )}
            </select>
          </div>
        ) : (
          <div>
            <Label>Dificultad</Label>
            <select className={selectCls} value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value as Difficulty }))}>
              {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map(d =>
                <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>
              )}
            </select>
          </div>
        )}

        <div className="col-span-2">
          <Label>Descripción (opcional)</Label>
          <textarea className={`${inputCls} resize-y`} rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descripción del evento para la crónica..." />
        </div>
      </div>

      <div className="mt-3 flex gap-1.5">
        <button type="submit" disabled={saving || !form.title} className="rounded-md bg-amber-500 px-4 py-1.5 text-[0.7rem] font-bold text-stone-950 hover:bg-amber-400 disabled:opacity-40">
          {saving ? 'Creando…' : 'Crear'}
        </button>
        <button type="button" onClick={onCancel} className="rounded-md border border-[#3c3330] px-3 py-1.5 text-[0.7rem] text-stone-600 hover:text-stone-400">
          Cancelar
        </button>
      </div>
    </form>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

export function SessionEventsPanel({ sessionId, token }: { sessionId: string; token: string }) {
  const [events, setEvents] = useState<ApiEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetch(`${API_URL}/sessions/${sessionId}/events`).then(r => r.json()) as ApiEvent[]
      setEvents(Array.isArray(data) ? data.sort((a, b) => a.order - b.order) : [])
    } catch {
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => { load() }, [load])

  function handleCreated(e: ApiEvent) {
    setEvents(prev => [...prev, e].sort((a, b) => a.order - b.order))
    setShowCreate(false)
  }

  function handleUpdated(e: ApiEvent) {
    setEvents(prev => prev.map(x => x._id === e._id ? e : x))
  }

  function handleDeleted(id: string) {
    setEvents(prev => prev.filter(x => x._id !== id))
  }

  return (
    <div className="mt-3 border-t border-[#2a2826] pt-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[0.62rem] uppercase tracking-[0.16em] text-stone-700">
          {loading ? 'Cargando…' : `${events.length} evento${events.length !== 1 ? 's' : ''}`}
        </span>
        <button
          onClick={() => setShowCreate(s => !s)}
          className="flex items-center gap-1 rounded-md border border-[#3c3330] px-2.5 py-1 text-[0.65rem] text-stone-600 transition-colors hover:border-amber-500/30 hover:text-amber-400"
        >
          {showCreate ? '✕ Cancelar' : '+ Agregar evento'}
        </button>
      </div>

      {showCreate && (
        <div className="mb-3">
          <CreateEventForm
            sessionId={sessionId}
            token={token}
            nextOrder={events.length}
            onCreated={handleCreated}
            onCancel={() => setShowCreate(false)}
          />
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2].map(i => <div key={i} className="h-12 animate-pulse rounded-lg bg-[#181412]" />)}
        </div>
      ) : events.length === 0 && !showCreate ? (
        <div className="rounded-lg border border-dashed border-[#2a2826] py-6 text-center">
          <p className="text-[0.72rem] italic text-stone-700">Sin eventos. Agregá el primero.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {events.map(event => (
            <EventRow
              key={event._id}
              event={event}
              sessionId={sessionId}
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
