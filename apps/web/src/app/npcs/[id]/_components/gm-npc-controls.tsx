'use client'

import { useState, useRef, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Pencil, Upload, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import type { ApiNpc } from '@/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

// ── Toggle helper ─────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full border transition-colors ${
          checked ? 'border-amber-500/40 bg-amber-500/20' : 'border-[#3c3330] bg-[#1e1c1a]'
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full border transition-all ${
            checked ? 'left-[18px] border-amber-500/60 bg-amber-500' : 'left-0.5 border-[#3c3330] bg-stone-600'
          }`}
        />
      </button>
      <span className="text-[0.8rem] text-stone-400">{label}</span>
    </label>
  )
}

// ── Statblock editor ──────────────────────────────────────────────────────────

interface StatblockProps {
  stats: Record<string, unknown> | null | undefined
  npcId: string
  token: string
}

const STAT_TEMPLATE = {
  hp: '', ac: '', speed: '',
  perception: '',
  fort: '', ref: '', will: '',
  str: '', dex: '', con: '', int: '', wis: '', cha: '',
  attacks: '',
  skills: '',
  immunities: '', resistances: '', weaknesses: '',
}

type StatKey = keyof typeof STAT_TEMPLATE

const STAT_LABELS: Record<StatKey, string> = {
  hp: 'HP', ac: 'CA', speed: 'Velocidad',
  perception: 'Percepción',
  fort: 'Fortitud', ref: 'Reflejos', will: 'Voluntad',
  str: 'FUE', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR',
  attacks: 'Ataques (texto libre)',
  skills: 'Habilidades (texto libre)',
  immunities: 'Inmunidades', resistances: 'Resistencias', weaknesses: 'Debilidades',
}

function StatblockEditor({ stats, npcId, token }: StatblockProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const initial = { ...STAT_TEMPLATE, ...(stats as Record<StatKey, string> ?? {}) }
  const [fields, setFields] = useState<Record<StatKey, string>>(initial as Record<StatKey, string>)

  function set(key: StatKey, val: string) {
    setFields(prev => ({ ...prev, [key]: val }))
  }

  async function save() {
    const payload: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(fields)) {
      if (v !== '') payload[k] = v
    }

    startTransition(async () => {
      try {
        const res = await fetch(`${API_URL}/npcs/${npcId}/private`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ stats: payload }),
        })
        if (!res.ok) { setError('Error al guardar el statblock.'); return }
        setError(null)
        setOpen(false)
        router.refresh()
      } catch {
        setError('Error de red.')
      }
    })
  }

  const inputCls = 'w-full rounded border border-[#2a2826] bg-[#0e0c0b] px-2.5 py-1.5 text-[0.8rem] text-stone-300 outline-none focus:border-amber-500/40'

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="text-[0.72rem] font-medium uppercase tracking-[0.1em] text-stone-600 transition-colors hover:text-amber-400"
      >
        {open ? '▲ Cerrar statblock' : '▼ Editar statblock'}
      </button>

      {open && (
        <div className="mt-4 space-y-4 rounded-xl border border-[#2a2826] bg-[#141210] p-4">
          {/* Vitals */}
          <div className="grid grid-cols-3 gap-3">
            {(['hp', 'ac', 'speed'] as StatKey[]).map(k => (
              <div key={k}>
                <label className="mb-1 block text-[0.62rem] uppercase tracking-[0.12em] text-stone-600">{STAT_LABELS[k]}</label>
                <input value={fields[k]} onChange={e => set(k, e.target.value)} className={inputCls} placeholder="—" />
              </div>
            ))}
          </div>

          {/* Saves + Perception */}
          <div className="grid grid-cols-4 gap-3">
            {(['perception', 'fort', 'ref', 'will'] as StatKey[]).map(k => (
              <div key={k}>
                <label className="mb-1 block text-[0.62rem] uppercase tracking-[0.12em] text-stone-600">{STAT_LABELS[k]}</label>
                <input value={fields[k]} onChange={e => set(k, e.target.value)} className={inputCls} placeholder="—" />
              </div>
            ))}
          </div>

          {/* Abilities */}
          <div className="grid grid-cols-6 gap-2">
            {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as StatKey[]).map(k => (
              <div key={k}>
                <label className="mb-1 block text-center text-[0.62rem] uppercase tracking-[0.12em] text-stone-600">{STAT_LABELS[k]}</label>
                <input value={fields[k]} onChange={e => set(k, e.target.value)} className={inputCls + ' text-center'} placeholder="—" />
              </div>
            ))}
          </div>

          {/* Text fields */}
          {(['attacks', 'skills', 'immunities', 'resistances', 'weaknesses'] as StatKey[]).map(k => (
            <div key={k}>
              <label className="mb-1 block text-[0.62rem] uppercase tracking-[0.12em] text-stone-600">{STAT_LABELS[k]}</label>
              <textarea
                value={fields[k]}
                onChange={e => set(k, e.target.value)}
                rows={2}
                className={inputCls + ' resize-y'}
                placeholder="—"
              />
            </div>
          ))}

          {error && <p className="text-[0.75rem] text-red-400">{error}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={save}
              disabled={isPending}
              className="rounded-lg bg-amber-500 px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-stone-950 transition-colors hover:bg-amber-400 disabled:opacity-50"
            >
              {isPending ? 'Guardando...' : 'Guardar statblock'}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="text-[0.72rem] text-stone-600 hover:text-stone-400">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function GmNpcControls({ npc }: { npc: ApiNpc }) {
  const router = useRouter()
  const { isGm, token } = useAuth()
  const [isPending, startTransition] = useTransition()
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [isAlive, setIsAlive]       = useState(npc.is_alive)
  const [isWithParty, setIsWithParty] = useState(npc.is_with_party)
  const [lastSeenDesc, setLastSeenDesc] = useState(npc.last_seen_description ?? '')
  const [savingState, setSavingState]   = useState(false)
  const [stateError, setStateError]     = useState<string | null>(null)

  if (!isGm || !token) return null

  async function patchPublic(patch: Record<string, unknown>) {
    const res = await fetch(`${API_URL}/npcs/${npc._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(patch),
    })
    if (!res.ok) throw new Error('Error al actualizar.')
  }

  async function handleToggleAlive(val: boolean) {
    setIsAlive(val)
    try { await patchPublic({ is_alive: val }); router.refresh() }
    catch { setIsAlive(!val); setStateError('Error al actualizar estado.') }
  }

  async function handleToggleParty(val: boolean) {
    setIsWithParty(val)
    try { await patchPublic({ is_with_party: val }); router.refresh() }
    catch { setIsWithParty(!val); setStateError('Error al actualizar estado.') }
  }

  async function saveLastSeen() {
    setSavingState(true)
    setStateError(null)
    try {
      await patchPublic({
        last_seen_description: lastSeenDesc,
        last_seen_at: lastSeenDesc ? new Date().toISOString() : null,
      })
      router.refresh()
    } catch {
      setStateError('Error al guardar.')
    } finally {
      setSavingState(false)
    }
  }

  async function handlePortraitUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null)
    setUploading(true)

    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch(`${API_URL}/npcs/${npc._id}/portrait`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        })
        if (!res.ok) { setUploadError('Error al subir la imagen.'); return }
        router.refresh()
      } catch {
        setUploadError('Error de red.')
      } finally {
        setUploading(false)
        if (fileRef.current) fileRef.current.value = ''
      }
    })
  }

  return (
    <div className="mt-10 rounded-xl border border-red-500/10 bg-red-500/4 p-5" style={{ animation: 'fade-up 0.5s ease both 0.25s' }}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-red-500/60">
          Panel GM
        </span>
        <Link
          href={`/npcs/${npc._id}/edit`}
          className="flex items-center gap-1.5 rounded-md border border-[#3c3330] px-2.5 py-1 text-[0.68rem] font-medium uppercase tracking-[0.1em] text-stone-500 transition-colors hover:border-amber-500/30 hover:text-amber-400"
        >
          <Pencil className="h-3 w-3" />
          Editar NPC
        </Link>
      </div>

      <div className="space-y-5">
        {/* Portrait upload */}
        <div>
          <p className="mb-2 text-[0.68rem] font-medium uppercase tracking-[0.15em] text-stone-600">Retrato</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePortraitUpload}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 rounded-lg border border-[#3c3330] bg-[#141210] px-3.5 py-2 text-[0.75rem] text-stone-400 transition-colors hover:border-amber-500/20 hover:text-amber-400 disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {uploading ? 'Subiendo...' : npc.portrait_url ? 'Cambiar retrato' : 'Subir retrato'}
          </button>
          {uploadError && <p className="mt-1.5 text-[0.72rem] text-red-400">{uploadError}</p>}
        </div>

        {/* State toggles */}
        <div className="space-y-3">
          <p className="text-[0.68rem] font-medium uppercase tracking-[0.15em] text-stone-600">Estado</p>
          <Toggle checked={isAlive}     onChange={handleToggleAlive}  label={isAlive ? 'Vivo' : 'Muerto'} />
          <Toggle checked={isWithParty} onChange={handleToggleParty}  label={isWithParty ? 'Acompañando a la party' : 'No está con la party'} />
        </div>

        {/* Last seen */}
        <div>
          <p className="mb-2 text-[0.68rem] font-medium uppercase tracking-[0.15em] text-stone-600">
            Última vez visto
            {npc.last_seen_at && (
              <span className="ml-2 normal-case tracking-normal text-stone-700">
                — {new Date(npc.last_seen_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            )}
          </p>
          <div className="flex gap-2">
            <textarea
              value={lastSeenDesc}
              onChange={e => setLastSeenDesc(e.target.value)}
              rows={2}
              placeholder="ej: Bosque de Narlmarches, cerca del río..."
              className="flex-1 resize-none rounded-lg border border-[#2a2826] bg-[#141210] px-3 py-2 text-[0.8rem] text-stone-300 placeholder-stone-700 outline-none focus:border-amber-500/40"
            />
            <button
              type="button"
              onClick={saveLastSeen}
              disabled={savingState}
              className="shrink-0 self-end rounded-lg bg-[#1e1c1a] px-3 py-2 text-[0.72rem] text-stone-400 transition-colors hover:text-amber-400 disabled:opacity-50"
            >
              {savingState ? '...' : 'Guardar'}
            </button>
          </div>
          {stateError && <p className="mt-1 text-[0.72rem] text-red-400">{stateError}</p>}
        </div>

        {/* Statblock */}
        <div>
          <p className="mb-2 text-[0.68rem] font-medium uppercase tracking-[0.15em] text-stone-600">Statblock</p>
          <StatblockEditor stats={npc.stats} npcId={npc._id} token={token} />
        </div>
      </div>
    </div>
  )
}
