'use client'

import { useState, useEffect, useCallback } from 'react'
import { clientFetch } from '@/lib/client-api'
import type { ApiNpc } from '@/lib/api'

// ── Constants ─────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<ApiNpc['role'], string> = {
  ally: 'Aliado', enemy: 'Enemigo', neutral: 'Neutral', unknown: 'Desconocido',
}

const ROLE_STYLES: Record<ApiNpc['role'], string> = {
  ally:    'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
  enemy:   'text-rose-400 bg-rose-500/10 border-rose-500/25',
  neutral: 'text-sky-400 bg-sky-500/10 border-sky-500/25',
  unknown: 'text-stone-500 bg-stone-500/8 border-stone-700/40',
}

// ── Shared form primitives ────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[0.65rem] font-medium uppercase tracking-[0.12em] text-stone-600">
        {label}
      </label>
      {children}
    </div>
  )
}

const inputCls = 'w-full rounded-lg border border-[#3c3330] bg-[#0e0c0b] px-3.5 py-2.5 text-[0.88rem] text-stone-100 placeholder-stone-700 outline-none transition-all focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/15 disabled:opacity-40'
const textareaCls = `${inputCls} resize-y leading-relaxed`

// ── Create form ───────────────────────────────────────────────────────────────

function CreateForm({ token, onCreated, onCancel }: {
  token: string
  onCreated: (n: ApiNpc) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    name: '',
    role: 'unknown' as ApiNpc['role'],
    public_description: '',
    portrait_url: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const npc = await clientFetch<ApiNpc>('/npcs', token, {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          role: form.role,
          public_description: form.public_description.trim() || undefined,
          portrait_url: form.portrait_url.trim() || null,
        }),
      })
      onCreated(npc)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 rounded-xl border border-amber-500/15 bg-[#181412] p-5">
      <div className="mb-4 font-display text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-amber-500">
        Nuevo NPC
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nombre">
          <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nombre del personaje" required />
        </Field>
        <Field label="Rol">
          <select className={inputCls} value={form.role} onChange={e => set('role', e.target.value as ApiNpc['role'])}>
            {(Object.keys(ROLE_LABELS) as ApiNpc['role'][]).map(r => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
        </Field>
        <div className="sm:col-span-2">
          <Field label="URL de retrato (opcional)">
            <input className={inputCls} value={form.portrait_url} onChange={e => set('portrait_url', e.target.value)} placeholder="https://..." type="url" />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Descripción pública">
            <textarea className={textareaCls} rows={3} value={form.public_description} onChange={e => set('public_description', e.target.value)} placeholder="Lo que la party sabe sobre este personaje..." />
          </Field>
        </div>
      </div>
      {error && (
        <p className="mt-3 rounded border border-red-500/20 bg-red-500/8 px-3 py-2 text-[0.8rem] text-red-400">{error}</p>
      )}
      <div className="mt-4 flex gap-2">
        <button type="submit" disabled={saving} className="rounded-lg bg-amber-500 px-4 py-2 font-display text-[0.72rem] font-bold uppercase tracking-[0.15em] text-stone-950 transition-colors hover:bg-amber-400 disabled:opacity-50">
          {saving ? 'Creando...' : 'Crear NPC'}
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-[#3c3330] px-4 py-2 text-[0.72rem] text-stone-500 transition-colors hover:bg-[#232120] hover:text-stone-300">
          Cancelar
        </button>
      </div>
    </form>
  )
}

// ── Edit form ─────────────────────────────────────────────────────────────────

function EditForm({ token, npc, onSaved, onCancel }: {
  token: string
  npc: ApiNpc
  onSaved: (n: ApiNpc) => void
  onCancel: () => void
}) {
  const [pub, setPub] = useState({
    name: npc.name,
    role: npc.role,
    is_alive: npc.is_alive,
    portrait_url: npc.portrait_url ?? '',
    public_description: npc.public_description,
  })
  const [priv, setPriv] = useState({
    gm_notes: npc.gm_notes ?? '',
    true_motives: npc.true_motives ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function sp(k: string, v: string | boolean) { setPub(f => ({ ...f, [k]: v })) }
  function sv(k: string, v: string) { setPriv(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const [updated] = await Promise.all([
        clientFetch<ApiNpc>(`/npcs/${npc._id}`, token, {
          method: 'PATCH',
          body: JSON.stringify({
            name: pub.name.trim(),
            role: pub.role,
            is_alive: pub.is_alive,
            portrait_url: pub.portrait_url.trim() || null,
            public_description: pub.public_description.trim(),
          }),
        }),
        clientFetch(`/npcs/${npc._id}/private`, token, {
          method: 'PATCH',
          body: JSON.stringify({
            gm_notes: priv.gm_notes.trim(),
            true_motives: priv.true_motives.trim(),
          }),
        }),
      ])
      onSaved(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 border-t border-[#2a2826] pt-4">
      {/* Public section */}
      <div className="mb-4 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-amber-600/70">
        Datos públicos
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nombre">
          <input className={inputCls} value={pub.name} onChange={e => sp('name', e.target.value)} required />
        </Field>
        <Field label="Rol">
          <select className={inputCls} value={pub.role} onChange={e => sp('role', e.target.value as ApiNpc['role'])}>
            {(Object.keys(ROLE_LABELS) as ApiNpc['role'][]).map(r => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
        </Field>
        <Field label="Estado">
          <select className={inputCls} value={pub.is_alive ? 'alive' : 'dead'} onChange={e => sp('is_alive', e.target.value === 'alive')}>
            <option value="alive">Vivo</option>
            <option value="dead">Muerto</option>
          </select>
        </Field>
        <Field label="URL de retrato">
          <input className={inputCls} value={pub.portrait_url} onChange={e => sp('portrait_url', e.target.value)} type="url" placeholder="https://..." />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Descripción pública">
            <textarea className={textareaCls} rows={3} value={pub.public_description} onChange={e => sp('public_description', e.target.value)} />
          </Field>
        </div>
      </div>

      {/* GM section */}
      <div className="mb-3 mt-5 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-red-700/60">
        Sólo GM
      </div>
      <div className="grid gap-3">
        <Field label="Notas del GM">
          <textarea className={textareaCls} rows={3} value={priv.gm_notes} onChange={e => sv('gm_notes', e.target.value)} placeholder="Notas internas, secretos, planes..." />
        </Field>
        <Field label="Verdaderos motivos">
          <textarea className={textareaCls} rows={2} value={priv.true_motives} onChange={e => sv('true_motives', e.target.value)} placeholder="Motivaciones reales ocultas a la party..." />
        </Field>
      </div>

      {error && (
        <p className="mt-3 rounded border border-red-500/20 bg-red-500/8 px-3 py-2 text-[0.8rem] text-red-400">{error}</p>
      )}
      <div className="mt-3 flex gap-2">
        <button type="submit" disabled={saving} className="rounded-lg bg-amber-500 px-4 py-2 font-display text-[0.72rem] font-bold uppercase tracking-[0.15em] text-stone-950 transition-colors hover:bg-amber-400 disabled:opacity-50">
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-[#3c3330] px-4 py-2 text-[0.72rem] text-stone-500 transition-colors hover:bg-[#232120] hover:text-stone-300">
          Cancelar
        </button>
      </div>
    </form>
  )
}

// ── NPC row ───────────────────────────────────────────────────────────────────

function NpcRow({ npc, token, onUpdated, onDeleted }: {
  npc: ApiNpc
  token: string
  onUpdated: (n: ApiNpc) => void
  onDeleted: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    try {
      await clientFetch(`/npcs/${npc._id}`, token, { method: 'DELETE' })
      onDeleted(npc._id)
    } catch {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <div className="rounded-xl border border-[#2a2826] bg-[#181412] px-5 py-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Avatar */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#2a2826] bg-[#0e0c0b] font-display text-[0.85rem] font-bold text-stone-400">
          {npc.name.charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display text-[0.9rem] font-semibold tracking-[0.04em] text-stone-100 truncate">
              {npc.name}
            </span>
            <span className={`rounded border px-1.5 py-0.5 text-[0.6rem] font-medium uppercase tracking-[0.1em] ${ROLE_STYLES[npc.role]}`}>
              {ROLE_LABELS[npc.role]}
            </span>
            {!npc.is_alive && (
              <span className="text-[0.62rem] uppercase tracking-[0.08em] text-stone-700">💀 Muerto</span>
            )}
          </div>
          {npc.public_description && (
            <p className="mt-0.5 text-[0.72rem] text-stone-600 line-clamp-1">{npc.public_description}</p>
          )}
        </div>

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

      {/* GM-only info preview */}
      {!editing && (npc.gm_notes || npc.true_motives) && (
        <div className="mt-3 border-t border-[#2a2826] pt-3 grid gap-2 sm:grid-cols-2">
          {npc.gm_notes && (
            <div>
              <div className="mb-0.5 text-[0.58rem] uppercase tracking-[0.12em] text-red-700/50">Notas GM</div>
              <p className="text-[0.72rem] italic text-stone-700 line-clamp-2">{npc.gm_notes}</p>
            </div>
          )}
          {npc.true_motives && (
            <div>
              <div className="mb-0.5 text-[0.58rem] uppercase tracking-[0.12em] text-red-700/50">Motivos</div>
              <p className="text-[0.72rem] italic text-stone-700 line-clamp-2">{npc.true_motives}</p>
            </div>
          )}
        </div>
      )}

      {editing && (
        <EditForm
          token={token}
          npc={npc}
          onSaved={n => { onUpdated(n); setEditing(false) }}
          onCancel={() => setEditing(false)}
        />
      )}
    </div>
  )
}

// ── Main tab ──────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

export function NpcsTab({ token }: { token: string }) {
  const [npcs, setNpcs] = useState<ApiNpc[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [roleFilter, setRoleFilter] = useState<string>('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/npcs`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json() as ApiNpc[]
      setNpcs(Array.isArray(data) ? data : [])
    } catch {
      setNpcs([])
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  const filtered = roleFilter === 'all' ? npcs : npcs.filter(n => n.role === roleFilter)

  function handleCreated(n: ApiNpc) {
    setNpcs(prev => [n, ...prev])
    setShowCreate(false)
  }
  function handleUpdated(n: ApiNpc) {
    setNpcs(prev => prev.map(x => x._id === n._id ? n : x))
  }
  function handleDeleted(id: string) {
    setNpcs(prev => prev.filter(x => x._id !== id))
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { val: 'all',     label: 'Todos' },
            { val: 'ally',    label: 'Aliados' },
            { val: 'enemy',   label: 'Enemigos' },
            { val: 'neutral', label: 'Neutrales' },
            { val: 'unknown', label: 'Desconocidos' },
          ].map(({ val, label }) => (
            <button
              key={val}
              onClick={() => setRoleFilter(val)}
              className={`rounded-full border px-3 py-1 text-[0.65rem] font-medium uppercase tracking-[0.08em] transition-all ${
                roleFilter === val
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                  : 'border-[#2a2826] text-stone-600 hover:text-stone-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowCreate(s => !s)}
          className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 font-display text-[0.72rem] font-bold uppercase tracking-[0.15em] text-stone-950 transition-colors hover:bg-amber-400"
        >
          {showCreate ? '✕ Cancelar' : '+ Nuevo NPC'}
        </button>
      </div>

      {showCreate && (
        <CreateForm token={token} onCreated={handleCreated} onCancel={() => setShowCreate(false)} />
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-[#181412]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#3c3330] py-16 text-center">
          <div className="mb-2 text-3xl opacity-25">👤</div>
          <div className="font-display text-[0.85rem] font-semibold tracking-[0.08em] text-stone-600">
            {npcs.length === 0 ? 'Sin NPCs creados' : 'Sin NPCs en esta categoría'}
          </div>
          <p className="font-body mt-1 text-[0.88rem] italic text-stone-700">
            {npcs.length === 0
              ? 'Creá el primer NPC con el botón de arriba.'
              : 'Probá con otro filtro.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(n => (
            <NpcRow
              key={n._id}
              npc={n}
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
