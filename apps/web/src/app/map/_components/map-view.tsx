'use client'

import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import type { ApiGameMap, ApiHex, ApiLocation, ApiHexPointFeature, ApiNpc, ApiSession } from '@/lib/api'

// ── Hex math (pointy-top axial grid) ─────────────────────────────────────────

const SQRT3 = Math.sqrt(3)
const HEX_R = 32

function axialToPixel(q: number, r: number) {
  return {
    x: HEX_R * (SQRT3 * q + (SQRT3 / 2) * r),
    y: HEX_R * 1.5 * r,
  }
}

function hexPoints(cx: number, cy: number, radius: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 90)
    return `${cx + radius * Math.cos(a)},${cy + radius * Math.sin(a)}`
  }).join(' ')
}

// ── Auth ──────────────────────────────────────────────────────────────────────

interface HexNote {
  _id: string
  author_id: string
  content: string
  is_public: boolean
  created_at: string
}

type RichHex = ApiHex & { gm_notes?: string | null; notes?: HexNote[] }

type AuthUser = { id: string; role: 'gm' | 'player' }

function getUserFromToken(token: string | null): AuthUser | null {
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return { id: payload.sub, role: payload.role }
  } catch {
    return null
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

// ── Design constants ──────────────────────────────────────────────────────────

const TERRAIN: Record<string, { fill: string; stroke: string; label: string }> = {
  plains:    { fill: '#1a3a0c', stroke: '#2a5512', label: 'Llanura' },
  hills:     { fill: '#2a220e', stroke: '#463810', label: 'Colinas' },
  forest:    { fill: '#0e2208', stroke: '#183a0c', label: 'Bosque' },
  swamp:     { fill: '#141e0c', stroke: '#203016', label: 'Pantano' },
  mountains: { fill: '#201c1c', stroke: '#342a2a', label: 'Montañas' },
  desert:    { fill: '#2a2008', stroke: '#483a10', label: 'Desierto' },
  tundra:    { fill: '#181a22', stroke: '#24283c', label: 'Tundra' },
  lake:      { fill: '#0c1620', stroke: '#122240', label: 'Lago' },
  ocean:     { fill: '#080e18', stroke: '#0c1626', label: 'Océano' },
  other:     { fill: '#141210', stroke: '#201e1a', label: 'Otro' },
}

const FEAT_ICON: Record<string, string> = {
  city: '◈', town: '◆', village: '◇',
  dungeon: '⚔', cave: '∿', ruins: '⌘',
  fortress: '⬡', temple: '✦', mine: '⋄',
  landmark: '★', other: '•',
}

const LOC_TYPE: Record<string, { label: string; color: string; bg: string; border: string }> = {
  city:       { label: 'Ciudad',   color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20' },
  dungeon:    { label: 'Mazmorra', color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20' },
  wilderness: { label: 'Yerma',    color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20' },
  building:   { label: 'Edificio', color: 'text-sky-400',    bg: 'bg-sky-500/10',    border: 'border-sky-500/20' },
  region:     { label: 'Región',   color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
  other:      { label: 'Otro',     color: 'text-stone-400',  bg: 'bg-stone-500/10',  border: 'border-stone-700/40' },
}

const NPC_ROLE: Record<string, { label: string; color: string }> = {
  ally:    { label: 'Aliado',      color: 'text-green-400' },
  enemy:   { label: 'Enemigo',     color: 'text-red-400' },
  neutral: { label: 'Neutral',     color: 'text-stone-400' },
  unknown: { label: 'Desconocido', color: 'text-stone-600' },
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
  const s = LOC_TYPE[type] ?? LOC_TYPE.other
  return (
    <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[0.6rem] font-medium uppercase tracking-[0.1em] ${s.color} ${s.bg} ${s.border}`}>
      {s.label}
    </span>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-stone-600">
      {children}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-t-2xl border border-[#3c3330] border-b-0 bg-[#0e0c0b] shadow-[0_-20px_60px_rgba(0,0,0,0.9)] sm:rounded-xl sm:border-b sm:shadow-[0_25px_60px_rgba(0,0,0,0.8)]"
        style={{ animation: 'fade-up 0.28s cubic-bezier(0.16,1,0.3,1) both' }}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-stone-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2a2826] px-5 py-3.5">
          <span className="font-display text-[0.68rem] font-semibold uppercase tracking-[0.25em] text-amber-500/80">
            {title}
          </span>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-stone-600 transition-colors hover:bg-stone-800 hover:text-stone-300"
          >
            <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  )
}

// ── Input / Textarea styles ───────────────────────────────────────────────────

const inputCls = 'w-full rounded-lg border border-[#3c3330] bg-[#181412] px-3 py-2.5 text-[0.88rem] text-stone-100 placeholder-stone-700 outline-none transition-all focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/10'
const textareaCls = 'w-full resize-none rounded-lg border border-[#3c3330] bg-[#181412] px-3 py-2.5 text-[0.88rem] text-stone-300 placeholder-stone-700 outline-none transition-all focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/10'
const labelCls = 'mb-1.5 block text-[0.64rem] font-medium uppercase tracking-[0.14em] text-stone-600'

function ModalFooter({ onClose, onConfirm, confirmLabel, disabled }: {
  onClose: () => void
  onConfirm: () => void
  confirmLabel: string
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-end gap-2 border-t border-[#1e1c1a] pt-4">
      <button
        onClick={onClose}
        className="px-4 py-2 text-[0.75rem] text-stone-600 transition-colors hover:text-stone-400"
      >
        Cancelar
      </button>
      <button
        onClick={onConfirm}
        disabled={disabled}
        className="rounded-lg bg-amber-500 px-5 py-2 font-display text-[0.7rem] font-bold uppercase tracking-[0.14em] text-stone-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {confirmLabel}
      </button>
    </div>
  )
}

// ── CreateLocationModal ───────────────────────────────────────────────────────

const LOC_FEAT_TYPE: Record<string, string> = {
  city: 'city', dungeon: 'dungeon', wilderness: 'landmark',
  building: 'landmark', region: 'landmark', other: 'other',
}

function CreateLocationModal({ hex, mapId, token, onUpdate, onAddLocation, onClose }: {
  hex: RichHex
  mapId: string
  token: string | null
  onUpdate: (h: RichHex) => void
  onAddLocation: (l: ApiLocation) => void
  onClose: () => void
}) {
  const [name, setName]   = useState('')
  const [type, setType]   = useState('other')
  const [desc, setDesc]   = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  async function handleCreate() {
    if (!name.trim() || !token) return
    setSaving(true)
    setError(null)
    try {
      const locRes = await fetch(`${API_URL}/locations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: name.trim(),
          type,
          public_description: desc.trim(),
          visibility: { mode: 'public' },
        }),
      })
      if (!locRes.ok) { setError('Error al crear la locación'); return }
      const newLoc: ApiLocation = await locRes.json()

      // Link to hex via point_feature
      const updatedFeatures = [
        ...hex.point_features,
        { type: LOC_FEAT_TYPE[type] ?? 'other', position: 0, label: name.trim(), location_id: newLoc._id },
      ]
      const hexRes = await fetch(`${API_URL}/maps/${mapId}/hexes/${hex._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ point_features: updatedFeatures }),
      })
      if (hexRes.ok) onUpdate(await hexRes.json())
      onAddLocation(newLoc)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Nueva Locación" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div>
          <label className={labelCls}>Nombre</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="Nombre de la locación..." autoFocus className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Tipo</label>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(LOC_TYPE).map(([k, s]) => (
              <button key={k} type="button" onClick={() => setType(k)}
                className={`rounded-md border px-2.5 py-1 text-[0.63rem] font-medium uppercase tracking-[0.08em] transition-all ${
                  type === k ? `${s.color} ${s.bg} ${s.border}` : 'border-[#2a2826] text-stone-600 hover:border-stone-700 hover:text-stone-400'
                }`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelCls}>Descripción pública</label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)}
            placeholder="Descripción visible para los jugadores..." rows={3} className={textareaCls} />
        </div>

        {error && <p className="rounded-md border border-red-500/20 bg-red-500/8 px-3 py-2 text-[0.78rem] text-red-400">{error}</p>}

        <ModalFooter onClose={onClose} onConfirm={handleCreate}
          confirmLabel={saving ? 'Creando...' : 'Crear locación'} disabled={saving || !name.trim()} />
      </div>
    </Modal>
  )
}

// ── CreateEventModal ──────────────────────────────────────────────────────────

const DIFFICULTIES = ['trivial', 'low', 'moderate', 'severe', 'extreme']
const DIFF_LABELS: Record<string, string> = { trivial: 'Trivial', low: 'Bajo', moderate: 'Moderado', severe: 'Severo', extreme: 'Extremo' }
const EVENT_TYPES = ['exploration', 'social', 'narrative', 'rest', 'downtime']
const EVENT_TYPE_LABELS: Record<string, string> = { exploration: 'Exploración', social: 'Social', narrative: 'Narrativo', rest: 'Descanso', downtime: 'Libre' }

function CreateEventModal({ kind, sessions, token, onClose }: {
  kind: 'encounter' | 'event'
  sessions: ApiSession[]
  token: string | null
  onClose: () => void
}) {
  const [title, setTitle]       = useState('')
  const [desc, setDesc]         = useState('')
  const [difficulty, setDiff]   = useState('moderate')
  const [eventType, setEvType]  = useState('exploration')
  const [sessionId, setSessId]  = useState(sessions[0]?._id ?? '')
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [done, setDone]         = useState(false)

  const isEncounter = kind === 'encounter'
  const title_ = isEncounter ? 'Nuevo Encuentro' : 'Nuevo Evento'

  async function handleCreate() {
    if (!title.trim() || !sessionId || !token) return
    setSaving(true)
    setError(null)
    try {
      const body: Record<string, unknown> = { kind, title: title.trim(), description: desc.trim() }
      if (isEncounter) body.difficulty = difficulty
      else body.event_type = eventType

      const res = await fetch(`${API_URL}/sessions/${sessionId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      if (!res.ok) { setError('Error al registrar el evento'); return }
      setDone(true)
      setTimeout(onClose, 900)
    } finally {
      setSaving(false)
    }
  }

  if (done) {
    return (
      <Modal title={title_} onClose={onClose}>
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-green-500/20 bg-green-500/10">
            <svg width="22" height="22" viewBox="0 0 20 20" fill="currentColor" className="text-green-400">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="font-display text-[0.75rem] tracking-[0.12em] text-green-400">Registrado correctamente</p>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title={title_} onClose={onClose}>
      <div className="flex flex-col gap-4">
        {sessions.length === 0 ? (
          <div className="rounded-lg border border-amber-500/15 bg-amber-500/5 px-4 py-3">
            <p className="text-[0.78rem] text-amber-400/80">No hay sesiones creadas. Crea una sesión primero.</p>
          </div>
        ) : (
          <div>
            <label className={labelCls}>Sesión</label>
            <select value={sessionId} onChange={e => setSessId(e.target.value)}
              className="w-full rounded-lg border border-[#3c3330] bg-[#181412] px-3 py-2.5 text-[0.88rem] text-stone-200 outline-none focus:border-amber-500/40">
              {sessions.map(s => (
                <option key={s._id} value={s._id}>#{s.session_number} — {s.title}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className={labelCls}>Título</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder={isEncounter ? 'Encuentro con...' : 'Nombre del evento...'} autoFocus className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>{isEncounter ? 'Dificultad' : 'Tipo'}</label>
          <div className="flex flex-wrap gap-1.5">
            {(isEncounter ? DIFFICULTIES : EVENT_TYPES).map(opt => (
              <button key={opt} type="button"
                onClick={() => isEncounter ? setDiff(opt) : setEvType(opt)}
                className={`rounded-md border px-2.5 py-1 text-[0.62rem] font-medium uppercase tracking-[0.08em] transition-all ${
                  (isEncounter ? difficulty : eventType) === opt
                    ? 'border-amber-500/30 bg-amber-500/15 text-amber-400'
                    : 'border-[#2a2826] text-stone-600 hover:border-stone-700 hover:text-stone-400'
                }`}>
                {isEncounter ? DIFF_LABELS[opt] : EVENT_TYPE_LABELS[opt]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelCls}>Descripción</label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)}
            placeholder="Descripción del evento..." rows={3} className={textareaCls} />
        </div>

        {error && <p className="rounded-md border border-red-500/20 bg-red-500/8 px-3 py-2 text-[0.78rem] text-red-400">{error}</p>}

        <ModalFooter onClose={onClose} onConfirm={handleCreate}
          confirmLabel={saving ? 'Registrando...' : isEncounter ? 'Registrar encuentro' : 'Registrar evento'}
          disabled={saving || !title.trim() || sessions.length === 0} />
      </div>
    </Modal>
  )
}

// ── NpcMoveModal ──────────────────────────────────────────────────────────────

function NpcMoveModal({ hex, npcs, locationMap, token, onClose }: {
  hex: RichHex
  npcs: ApiNpc[]
  locationMap: Map<string, ApiLocation>
  token: string | null
  onClose: () => void
}) {
  const hexLocations = useMemo(
    () => hex.location_ids.map(lid => locationMap.get(String(lid))).filter(Boolean) as ApiLocation[],
    [hex.location_ids, locationMap]
  )

  const [selectedNpcId, setSelectedNpcId] = useState<string | null>(null)
  const [selectedLocId, setSelectedLocId] = useState<string | null>(hexLocations[0]?._id ?? null)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [done, setDone]       = useState(false)

  async function handleMove() {
    if (!selectedNpcId || !token) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/npcs/${selectedNpcId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ location_id: selectedLocId ?? null }),
      })
      if (!res.ok) { setError('Error al mover el NPC'); return }
      setDone(true)
      setTimeout(onClose, 900)
    } finally {
      setSaving(false)
    }
  }

  if (done) {
    return (
      <Modal title="Mover NPC" onClose={onClose}>
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-green-500/20 bg-green-500/10">
            <svg width="22" height="22" viewBox="0 0 20 20" fill="currentColor" className="text-green-400">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="font-display text-[0.75rem] tracking-[0.12em] text-green-400">NPC movido correctamente</p>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title="Mover NPC Aquí" onClose={onClose}>
      <div className="flex flex-col gap-4">
        {/* NPC list */}
        <div>
          <label className={labelCls}>Seleccionar NPC</label>
          <div className="flex max-h-52 flex-col gap-1 overflow-y-auto rounded-lg border border-[#2a2826] bg-[#0c0a09] p-1.5">
            {npcs.length === 0 ? (
              <p className="px-2 py-4 text-center text-[0.78rem] italic text-stone-700">Sin NPCs creados.</p>
            ) : npcs.map(npc => {
              const rs = NPC_ROLE[npc.role] ?? NPC_ROLE.unknown
              return (
                <button key={npc._id} type="button" onClick={() => setSelectedNpcId(npc._id)}
                  className={`flex items-center gap-3 rounded-md border px-3 py-2 text-left transition-all ${
                    selectedNpcId === npc._id
                      ? 'border-amber-500/30 bg-amber-500/10'
                      : 'border-transparent hover:border-[#2a2826] hover:bg-[#141210]'
                  }`}>
                  <div className="min-w-0 flex-1">
                    <div className="text-[0.8rem] font-medium text-stone-200 leading-tight">{npc.name}</div>
                    <div className={`text-[0.62rem] ${rs.color}`}>
                      {rs.label}{!npc.is_alive && ' · Muerto'}
                    </div>
                  </div>
                  {selectedNpcId === npc._id && (
                    <svg width="11" height="11" viewBox="0 0 20 20" fill="currentColor" className="shrink-0 text-amber-500">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Location picker */}
        <div>
          <label className={labelCls}>Ubicar en</label>
          {hexLocations.length === 0 ? (
            <p className="rounded-lg border border-[#2a2826] bg-[#141210] px-3 py-2.5 text-[0.78rem] italic text-stone-600">
              Este hex no tiene ubicaciones. El NPC quedará sin ubicación.
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {hexLocations.map(loc => (
                <button key={loc._id} type="button" onClick={() => setSelectedLocId(loc._id)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-all ${
                    selectedLocId === loc._id
                      ? 'border-amber-500/30 bg-amber-500/10'
                      : 'border-[#2a2826] bg-[#141210] hover:border-stone-700'
                  }`}>
                  <span className="flex-1 text-[0.78rem] text-stone-300">{loc.name}</span>
                  <TypeBadge type={loc.type} />
                </button>
              ))}
            </div>
          )}
        </div>

        {error && <p className="rounded-md border border-red-500/20 bg-red-500/8 px-3 py-2 text-[0.78rem] text-red-400">{error}</p>}

        <ModalFooter onClose={onClose} onConfirm={handleMove}
          confirmLabel={saving ? 'Moviendo...' : 'Mover NPC'} disabled={saving || !selectedNpcId} />
      </div>
    </Modal>
  )
}

// ── HexPanel ──────────────────────────────────────────────────────────────────

type ActiveModal = 'location' | 'encounter' | 'event' | 'npc-move' | null

function HexPanel({
  hex, locationMap, mapId, mapData, token, user, sessions, npcs,
  onUpdate, onUpdateMap, onAddLocation, onClose,
}: {
  hex: RichHex
  locationMap: Map<string, ApiLocation>
  mapId: string
  mapData: ApiGameMap
  token: string | null
  user: AuthUser | null
  sessions: ApiSession[]
  npcs: ApiNpc[]
  onUpdate: (updated: RichHex) => void
  onUpdateMap: (updated: ApiGameMap) => void
  onAddLocation: (l: ApiLocation) => void
  onClose: () => void
}) {
  const terrain    = TERRAIN[hex.terrain] ?? TERRAIN.other
  const isGm       = user?.role === 'gm'
  const isLoggedIn = !!token
  const isPartyHex = mapData.current_party_hex_id === hex._id

  const [saving, setSaving]                   = useState(false)
  const [savingParty, setSavingParty]         = useState(false)
  const [editingDesc, setEditingDesc]         = useState(false)
  const [descValue, setDescValue]             = useState(hex.party_summary ?? '')
  const [editingGmNotes, setEditingGmNotes]   = useState(false)
  const [gmNotesValue, setGmNotesValue]       = useState(hex.gm_notes ?? '')
  const [showNoteForm, setShowNoteForm]       = useState(false)
  const [noteContent, setNoteContent]         = useState('')
  const [notePublic, setNotePublic]           = useState(false)
  const [noteError, setNoteError]             = useState<string | null>(null)
  const [activeModal, setActiveModal]         = useState<ActiveModal>(null)

  useEffect(() => {
    setDescValue(hex.party_summary ?? '')
    setGmNotesValue(hex.gm_notes ?? '')
  }, [hex._id, hex.party_summary, hex.gm_notes])

  const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  async function putHex(body: Record<string, unknown>) {
    setSaving(true)
    try {
      const res = await fetch(`${API_URL}/maps/${mapId}/hexes/${hex._id}`, {
        method: 'PUT', headers: authHeaders, body: JSON.stringify(body),
      })
      if (res.ok) onUpdate(await res.json())
    } finally {
      setSaving(false)
    }
  }

  async function handleMoveParty() {
    if (!token || isPartyHex) return
    setSavingParty(true)
    try {
      const res = await fetch(`${API_URL}/maps/${mapId}`, {
        method: 'PUT', headers: authHeaders,
        body: JSON.stringify({ current_party_hex_id: hex._id }),
      })
      if (res.ok) onUpdateMap(await res.json())
    } finally {
      setSavingParty(false)
    }
  }

  async function saveDesc() {
    await putHex({ party_summary: descValue.trim() || null })
    setEditingDesc(false)
  }

  async function saveGmNotes() {
    await putHex({ gm_notes: gmNotesValue.trim() || null })
    setEditingGmNotes(false)
  }

  async function addNote() {
    if (!token || !noteContent.trim()) return
    setSaving(true)
    setNoteError(null)
    try {
      const res = await fetch(`${API_URL}/maps/${mapId}/hexes/${hex._id}/notes`, {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({ content: noteContent.trim(), is_public: notePublic }),
      })
      if (res.ok) {
        onUpdate(await res.json())
        setNoteContent('')
        setNotePublic(false)
        setShowNoteForm(false)
      } else {
        const data = await res.json().catch(() => null)
        setNoteError(Array.isArray(data?.message) ? data.message[0] : (data?.message ?? 'Error al guardar la nota'))
      }
    } catch {
      setNoteError('No se pudo conectar con el servidor')
    } finally {
      setSaving(false)
    }
  }

  async function deleteNote(noteId: string) {
    if (!token) return
    setSaving(true)
    try {
      const res = await fetch(`${API_URL}/maps/${mapId}/hexes/${hex._id}/notes/${noteId}`, {
        method: 'DELETE', headers: authHeaders,
      })
      if (res.ok) onUpdate(await res.json())
    } finally {
      setSaving(false)
    }
  }

  const visibleNotes = (hex.notes ?? []).filter(
    n => n.is_public || (user && n.author_id === user.id)
  )

  // NPCs at this hex (via their location_id matching one of hex.location_ids)
  const hexLocIds = useMemo(() => new Set(hex.location_ids.map(String)), [hex.location_ids])
  const npcsHere  = useMemo(
    () => npcs.filter(n => n.location_id && hexLocIds.has(n.location_id)),
    [npcs, hexLocIds]
  )

  return (
    <>
      {/* Modals */}
      {activeModal === 'location' && (
        <CreateLocationModal hex={hex} mapId={mapId} token={token}
          onUpdate={onUpdate} onAddLocation={onAddLocation} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'encounter' && (
        <CreateEventModal kind="encounter" sessions={sessions} token={token} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'event' && (
        <CreateEventModal kind="event" sessions={sessions} token={token} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'npc-move' && (
        <NpcMoveModal hex={hex} npcs={npcs} locationMap={locationMap} token={token} onClose={() => setActiveModal(null)} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2a2826] px-4 py-3">
        <button onClick={onClose}
          className="flex items-center gap-1.5 text-[0.72rem] text-stone-600 transition-colors hover:text-amber-400">
          <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Volver
        </button>
        <span className="font-display text-[0.62rem] tracking-[0.15em] text-stone-700">Q:{hex.q} R:{hex.r}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">

        {/* Terrain + status badges */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded px-2.5 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.12em]"
            style={{ background: terrain.fill, color: terrain.stroke, border: `1px solid ${terrain.stroke}` }}>
            {terrain.label}
          </span>
          <span className={`rounded border px-2 py-0.5 text-[0.62rem] uppercase tracking-[0.1em] ${
            hex.is_explored
              ? 'border-green-500/25 bg-green-500/8 text-green-400'
              : 'border-stone-700/40 bg-stone-500/8 text-stone-600'
          }`}>
            {hex.is_explored ? 'Explorado' : 'Inexplorado'}
          </span>
          {hex.region && <span className="text-[0.7rem] italic text-stone-600">{hex.region}</span>}
        </div>

        {/* Toggle explored — GM only */}
        {isGm && (
          <button onClick={() => putHex({ is_explored: !hex.is_explored })} disabled={saving}
            className={`mb-4 w-full rounded-lg border px-3 py-2 text-[0.72rem] font-medium transition-all disabled:opacity-50 ${
              hex.is_explored
                ? 'border-stone-700/40 bg-stone-500/8 text-stone-500 hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-400'
                : 'border-green-500/20 bg-green-500/8 text-green-400 hover:bg-green-500/12'
            }`}>
            {hex.is_explored ? '✕  Marcar como inexplorado' : '✓  Marcar como explorado'}
          </button>
        )}

        {/* GM Actions */}
        {isGm && (
          <div className="mb-4 rounded-lg border border-[#2a2826] bg-[#0c0a09] p-3">
            <SectionLabel>Acciones</SectionLabel>
            <div className="flex flex-col gap-1.5">
              {/* Party row — full width */}
              <button onClick={handleMoveParty} disabled={savingParty || isPartyHex}
                className={`flex w-full items-center justify-center gap-2 rounded-md border px-3 py-2 text-[0.68rem] font-medium transition-all disabled:opacity-60 ${
                  isPartyHex
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                    : 'border-[#2a2826] text-stone-500 hover:border-amber-500/25 hover:bg-amber-500/5 hover:text-amber-400'
                }`}>
                {/* Flag icon */}
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4 4v16M4 4l12 4-12 4"/>
                  <path d="M4 4h12l-12 4" fillOpacity="0.4"/>
                </svg>
                {isPartyHex ? 'El grupo está aquí' : savingParty ? 'Moviendo...' : 'Mover grupo aquí'}
              </button>

              {/* 2-col grid for the rest */}
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { icon: '◈', label: 'Nueva locación', modal: 'location' as ActiveModal },
                  { icon: '◉', label: 'Mover NPC aquí', modal: 'npc-move' as ActiveModal },
                  { icon: '⚔', label: 'Encuentro',      modal: 'encounter' as ActiveModal },
                  { icon: '✦', label: 'Evento',         modal: 'event' as ActiveModal },
                ].map(({ icon, label, modal }) => (
                  <button key={label} onClick={() => setActiveModal(modal)}
                    className="flex items-center justify-center gap-1.5 rounded-md border border-[#2a2826] px-2 py-2 text-[0.65rem] font-medium text-stone-500 transition-all hover:border-amber-500/20 hover:bg-amber-500/5 hover:text-amber-400">
                    <span>{icon}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Descripción */}
        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between">
            <SectionLabel>Descripción</SectionLabel>
            {isGm && !editingDesc && (
              <button onClick={() => setEditingDesc(true)}
                className="text-[0.6rem] text-stone-700 transition-colors hover:text-amber-400">
                editar
              </button>
            )}
          </div>
          {editingDesc ? (
            <div className="flex flex-col gap-2">
              <textarea value={descValue} onChange={e => setDescValue(e.target.value)}
                placeholder="Descripción visible del estado del grupo en este hex..." rows={3}
                className="w-full resize-none rounded-lg border border-[#3c3330] bg-[#141210] px-3 py-2 text-[0.82rem] text-stone-300 placeholder-stone-700 outline-none focus:border-amber-500/40" />
              <div className="flex gap-2">
                <button onClick={saveDesc} disabled={saving}
                  className="rounded border border-amber-500/20 bg-amber-500/15 px-3 py-1.5 text-[0.7rem] font-medium text-amber-400 transition-colors hover:bg-amber-500/20 disabled:opacity-50">
                  Guardar
                </button>
                <button onClick={() => setEditingDesc(false)}
                  className="px-3 py-1.5 text-[0.7rem] text-stone-600 transition-colors hover:text-stone-400">
                  Cancelar
                </button>
              </div>
            </div>
          ) : hex.party_summary ? (
            <p className="font-body text-[0.9rem] leading-relaxed text-stone-400 italic">{hex.party_summary}</p>
          ) : (
            <p className="font-body text-[0.82rem] italic text-stone-700">Sin descripción.</p>
          )}
        </div>

        {/* GM notes */}
        {isGm && (
          <div className="mb-4 rounded-lg border border-amber-500/10 bg-amber-500/5 p-3">
            <div className="mb-1.5 flex items-center justify-between">
              <SectionLabel>Notas del GM</SectionLabel>
              {!editingGmNotes && (
                <button onClick={() => setEditingGmNotes(true)}
                  className="text-[0.6rem] text-stone-700 transition-colors hover:text-amber-400">
                  editar
                </button>
              )}
            </div>
            {editingGmNotes ? (
              <div className="flex flex-col gap-2">
                <textarea value={gmNotesValue} onChange={e => setGmNotesValue(e.target.value)}
                  placeholder="Notas privadas del GM para este hex..." rows={4}
                  className="w-full resize-none rounded-lg border border-[#3c3330] bg-[#141210] px-3 py-2 text-[0.82rem] text-stone-300 placeholder-stone-700 outline-none focus:border-amber-500/40" />
                <div className="flex gap-2">
                  <button onClick={saveGmNotes} disabled={saving}
                    className="rounded border border-amber-500/20 bg-amber-500/15 px-3 py-1.5 text-[0.7rem] font-medium text-amber-400 transition-colors hover:bg-amber-500/20 disabled:opacity-50">
                    Guardar
                  </button>
                  <button onClick={() => setEditingGmNotes(false)}
                    className="px-3 py-1.5 text-[0.7rem] text-stone-600 transition-colors hover:text-stone-400">
                    Cancelar
                  </button>
                </div>
              </div>
            ) : hex.gm_notes ? (
              <p className="font-body text-[0.82rem] leading-relaxed text-amber-100/70 italic">{hex.gm_notes}</p>
            ) : (
              <p className="font-body text-[0.78rem] italic text-stone-700">Sin notas del GM.</p>
            )}
          </div>
        )}

        {/* NPCs presentes */}
        {npcsHere.length > 0 && (
          <div className="mb-4">
            <SectionLabel>NPCs presentes ({npcsHere.length})</SectionLabel>
            <div className="flex flex-col gap-1.5">
              {npcsHere.map(npc => {
                const rs = NPC_ROLE[npc.role] ?? NPC_ROLE.unknown
                return (
                  <div key={npc._id} className="flex items-center gap-2.5 rounded-lg border border-[#2a2826] bg-[#141210] px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-[0.78rem] font-medium text-stone-300 leading-tight">{npc.name}</div>
                      <div className={`text-[0.62rem] ${rs.color}`}>{rs.label}{!npc.is_alive && ' · Muerto'}</div>
                    </div>
                    {npc.location_id && locationMap.get(npc.location_id) && (
                      <TypeBadge type={locationMap.get(npc.location_id)!.type} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between">
            <SectionLabel>Notas{visibleNotes.length > 0 ? ` (${visibleNotes.length})` : ''}</SectionLabel>
            {isLoggedIn && !showNoteForm && (
              <button onClick={() => setShowNoteForm(true)}
                className="text-[0.6rem] text-stone-700 transition-colors hover:text-amber-400">
                + agregar
              </button>
            )}
          </div>

          {showNoteForm && (
            <div className="mb-3 rounded-lg border border-[#2a2826] bg-[#141210] p-3">
              <textarea value={noteContent} onChange={e => setNoteContent(e.target.value)}
                placeholder="Escribí tu nota para este hexágono..." rows={3} autoFocus
                className="mb-2 w-full resize-none bg-transparent text-[0.82rem] text-stone-300 placeholder-stone-700 outline-none" />
              {noteError && (
                <p className="mb-2 text-[0.72rem] text-red-400">{noteError}</p>
              )}
              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-1.5">
                  <input type="checkbox" checked={notePublic} onChange={e => setNotePublic(e.target.checked)}
                    className="h-3 w-3 accent-amber-500" />
                  <span className="text-[0.65rem] text-stone-600">Visible para todos</span>
                </label>
                <div className="flex gap-2">
                  <button onClick={addNote} disabled={saving || !noteContent.trim()}
                    className="rounded border border-amber-500/20 bg-amber-500/15 px-3 py-1 text-[0.68rem] font-medium text-amber-400 transition-colors hover:bg-amber-500/20 disabled:opacity-40">
                    Guardar
                  </button>
                  <button onClick={() => { setShowNoteForm(false); setNoteContent(''); setNoteError(null) }}
                    className="text-[0.68rem] text-stone-700 transition-colors hover:text-stone-400">
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {visibleNotes.length > 0 ? (
            <div className="flex flex-col gap-2">
              {visibleNotes.map(note => (
                <div key={note._id ?? note.content} className="group rounded-lg border border-[#2a2826] bg-[#141210] px-3 py-2.5">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className={`rounded border px-1.5 py-0.5 text-[0.55rem] uppercase tracking-[0.08em] ${
                      note.is_public
                        ? 'border-green-500/15 bg-green-500/10 text-green-500/80'
                        : 'border-stone-700/30 bg-stone-500/10 text-stone-600'
                    }`}>
                      {note.is_public ? 'Pública' : 'Privada'}
                    </span>
                    {(isGm || (user && note.author_id === user.id)) && note._id && (
                      <button onClick={() => deleteNote(note._id)} disabled={saving}
                        className="hidden text-[0.6rem] text-stone-700 transition-colors hover:text-red-400 group-hover:block disabled:opacity-50">
                        eliminar
                      </button>
                    )}
                  </div>
                  <p className="font-body text-[0.82rem] leading-relaxed text-stone-400">{note.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-body text-[0.82rem] italic text-stone-700">Sin notas.</p>
          )}
        </div>

        {/* Point features */}
        {hex.point_features.length > 0 && (
          <div className="mb-4">
            <SectionLabel>Puntos de interés</SectionLabel>
            <div className="flex flex-col gap-1.5">
              {hex.point_features.map((feat: ApiHexPointFeature, i: number) => {
                const linkedLoc = feat.location_id ? locationMap.get(feat.location_id) : null
                return (
                  <div key={i} className="flex items-center gap-2.5 rounded-lg border border-[#2a2826] bg-[#141210] px-3 py-2">
                    <span className="text-[0.9rem] text-amber-500/80">{FEAT_ICON[feat.type] ?? '•'}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[0.75rem] font-medium text-stone-300">
                        {linkedLoc?.name ?? feat.label ?? feat.type}
                      </div>
                      {linkedLoc?.public_description && (
                        <div className="truncate text-[0.62rem] text-stone-600">{linkedLoc.public_description}</div>
                      )}
                    </div>
                    {linkedLoc && <TypeBadge type={linkedLoc.type} />}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Locations */}
        {hex.location_ids.length > 0 && (
          <div className="mb-4">
            <SectionLabel>Ubicaciones ({hex.location_ids.length})</SectionLabel>
            <div className="flex flex-col gap-1.5">
              {hex.location_ids.map(lid => {
                const loc = locationMap.get(String(lid))
                if (!loc) return null
                return (
                  <div key={String(lid)} className="flex items-start gap-2.5 rounded-lg border border-[#2a2826] bg-[#141210] px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 flex items-baseline gap-2">
                        <span className="text-[0.78rem] font-medium text-stone-200">{loc.name}</span>
                        <TypeBadge type={loc.type} />
                      </div>
                      {loc.public_description && (
                        <p className="font-body line-clamp-2 text-[0.78rem] italic leading-snug text-stone-600">
                          {loc.public_description}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Sessions */}
        {hex.session_ids.length > 0 && (
          <div>
            <SectionLabel>Sesiones ({hex.session_ids.length})</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {hex.session_ids.map(sid => (
                <span key={String(sid)}
                  className="rounded border border-[#2a2826] bg-[#141210] px-2 py-0.5 font-display text-[0.62rem] tracking-[0.08em] text-stone-600">
                  #{String(sid).slice(-4)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ── LocationPanel ─────────────────────────────────────────────────────────────

function LocationPanel({ locations, filterType, onFilterChange }: {
  locations: ApiLocation[]
  filterType: string | null
  onFilterChange: (t: string | null) => void
}) {
  const filtered = filterType ? locations.filter(l => l.type === filterType) : locations
  const types = [...new Set(locations.map(l => l.type))]

  return (
    <>
      <div className="border-b border-[#2a2826] px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="font-display text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-stone-600">
            Ubicaciones
          </span>
          <span className="font-display text-[0.6rem] tracking-[0.1em] text-stone-700">
            {filtered.length} / {locations.length}
          </span>
        </div>
        {types.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            <button onClick={() => onFilterChange(null)}
              className={`rounded px-2 py-0.5 text-[0.6rem] font-medium uppercase tracking-[0.08em] transition-colors ${
                !filterType ? 'bg-amber-500/15 text-amber-400' : 'text-stone-600 hover:text-stone-400'
              }`}>
              Todos
            </button>
            {types.map(t => {
              const s = LOC_TYPE[t] ?? LOC_TYPE.other
              return (
                <button key={t} onClick={() => onFilterChange(filterType === t ? null : t)}
                  className={`rounded px-2 py-0.5 text-[0.6rem] font-medium uppercase tracking-[0.08em] transition-colors ${
                    filterType === t ? `${s.color} ${s.bg}` : 'text-stone-600 hover:text-stone-400'
                  }`}>
                  {s.label}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <div className="mb-2 text-2xl opacity-20">📍</div>
            <p className="font-body text-[0.85rem] italic text-stone-700">
              {locations.length === 0 ? 'Sin ubicaciones registradas aún.' : 'Sin ubicaciones de este tipo.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#1e1c1a]">
            {filtered.map((loc, i) => (
              <div key={loc._id} className="px-4 py-3 transition-colors hover:bg-[#141210]"
                style={{ animation: `fade-in-left 0.3s ease both ${i * 0.04}s` }}>
                <div className="mb-1 flex items-start justify-between gap-2">
                  <span className="font-display text-[0.8rem] font-semibold leading-snug tracking-[0.04em] text-stone-200">
                    {loc.name}
                  </span>
                  <TypeBadge type={loc.type} />
                </div>
                {loc.public_description && (
                  <p className="font-body line-clamp-2 text-[0.78rem] italic leading-snug text-stone-600">
                    {loc.public_description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

// ── MapLegend ─────────────────────────────────────────────────────────────────

function MapLegend({ hexes }: { hexes: RichHex[] }) {
  const terrainTypes = [...new Set(hexes.map(h => h.terrain))].sort()
  if (terrainTypes.length === 0) return null
  return (
    <div className="shrink-0 border-t border-[#2a2826] px-4 py-3">
      <div className="mb-2 text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-stone-700">Leyenda</div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        {terrainTypes.map(t => {
          const s = TERRAIN[t] ?? TERRAIN.other
          return (
            <div key={t} className="flex items-center gap-1.5">
              <div className="h-2.5 w-4 shrink-0 rounded-sm" style={{ background: s.fill, border: `1px solid ${s.stroke}` }} />
              <span className="text-[0.62rem] text-stone-600">{s.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── MapView ───────────────────────────────────────────────────────────────────

type Props = {
  map: ApiGameMap
  hexes: ApiHex[]
  locations: ApiLocation[]
  sessions?: ApiSession[]
  npcs?: ApiNpc[]
}

type ViewState = { pan: { x: number; y: number }; zoom: number }

export function MapView({ map, hexes, locations, sessions = [], npcs = [] }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [localHexes, setLocalHexes]       = useState<RichHex[]>(hexes as RichHex[])
  const [localMap, setLocalMap]           = useState<ApiGameMap>(map)
  const [localLocations, setLocalLocations] = useState<ApiLocation[]>(locations)
  const [selectedHexId, setSelectedHexId] = useState<string | null>(null)
  const [hoveredHexId, setHoveredHexId]   = useState<string | null>(null)
  const [filterType, setFilterType]       = useState<string | null>(null)
  const [view, setView]                   = useState<ViewState>({ pan: { x: 0, y: 0 }, zoom: 1 })
  const [isDragging, setIsDragging]       = useState(false)
  const [token, setToken]                 = useState<string | null>(null)
  const [user, setUser]                   = useState<AuthUser | null>(null)

  const dragRef = useRef({ active: false, startX: 0, startY: 0, panX: 0, panY: 0, moved: false })

  useEffect(() => {
    const t = localStorage.getItem('access_token')
    setToken(t)
    setUser(getUserFromToken(t))
  }, [])

  const locationMap = useMemo(
    () => new Map(localLocations.map(l => [l._id, l])),
    [localLocations]
  )

  const selectedHex = useMemo(
    () => localHexes.find(h => h._id === selectedHexId) ?? null,
    [localHexes, selectedHexId]
  )

  const hexData = useMemo(
    () => localHexes.map(h => ({ ...h, ...axialToPixel(h.q, h.r) })),
    [localHexes]
  )

  const { initTx, initTy } = useMemo(() => {
    if (hexData.length === 0) return { initTx: 60, initTy: 60 }
    const xs = hexData.map(h => h.x)
    const ys = hexData.map(h => h.y)
    return {
      initTx: -(Math.min(...xs) - HEX_R * 1.5) + 60,
      initTy: -(Math.min(...ys) - HEX_R * 1.5) + 60,
    }
  }, [hexData])

  const handleHexUpdate = useCallback((updated: RichHex) => {
    setLocalHexes(prev => prev.map(h => h._id === updated._id ? updated : h))
  }, [])

  const handleAddLocation = useCallback((loc: ApiLocation) => {
    setLocalLocations(prev => [...prev, loc])
  }, [])

  // Non-passive wheel handler via refs
  const viewRef  = useRef(view)
  const initRef  = useRef({ initTx: 0, initTy: 0 })
  useEffect(() => { viewRef.current = view }, [view])
  useEffect(() => { initRef.current = { initTx, initTy } }, [initTx, initTy])

  useEffect(() => {
    const svgEl = svgRef.current
    if (!svgEl) return
    function onWheel(e: WheelEvent) {
      e.preventDefault()
      e.stopPropagation()
      const rect = svgEl!.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      const factor = e.deltaY > 0 ? 0.88 : 1.14
      const { pan, zoom } = viewRef.current
      const { initTx: tx, initTy: ty } = initRef.current
      const newZoom = Math.min(3.5, Math.max(0.2, zoom * factor))
      const ratio = newZoom / zoom
      setView({
        zoom: newZoom,
        pan: {
          x: mx - (mx - tx - pan.x) * ratio - tx,
          y: my - (my - ty - pan.y) * ratio - ty,
        },
      })
    }
    svgEl.addEventListener('wheel', onWheel, { passive: false })
    return () => svgEl.removeEventListener('wheel', onWheel)
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    dragRef.current = { active: true, startX: e.clientX, startY: e.clientY,
      panX: view.pan.x, panY: view.pan.y, moved: false }
    setIsDragging(true)
    setHoveredHexId(null)
    ;(e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId)
  }, [view.pan])

  const handlePointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const d = dragRef.current
    if (!d.active) return
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) d.moved = true
    setView(v => ({ ...v, pan: { x: d.panX + dx, y: d.panY + dy } }))
  }, [])

  const handlePointerUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const d = dragRef.current
    d.active = false
    setIsDragging(false)
    if (!d.moved) {
      const svgEl = svgRef.current
      if (!svgEl) return
      const rect = svgEl.getBoundingClientRect()
      const worldX = (e.clientX - rect.left - initTx - view.pan.x) / view.zoom
      const worldY = (e.clientY - rect.top  - initTy - view.pan.y) / view.zoom
      let closestId: string | null = null
      let minDist = HEX_R * 1.2
      for (const h of hexData) {
        const dist = Math.hypot(h.x - worldX, h.y - worldY)
        if (dist < minDist) { minDist = dist; closestId = h._id }
      }
      if (closestId) setSelectedHexId(prev => prev === closestId ? null : closestId)
    }
  }, [initTx, initTy, view.pan, view.zoom, hexData])

  // Hovered hex renders last (on top)
  const sortedHexData = useMemo(() => {
    if (!hoveredHexId) return hexData
    const idx = hexData.findIndex(h => h._id === hoveredHexId)
    if (idx === -1) return hexData
    const result = [...hexData]
    result.push(...result.splice(idx, 1))
    return result
  }, [hexData, hoveredHexId])

  const resetView = useCallback(() => setView({ pan: { x: 0, y: 0 }, zoom: 1 }), [])

  return (
    <div className="flex min-h-0 flex-1">
      {/* ── Map canvas ── */}
      <div className="relative min-h-0 flex-1 overflow-hidden" style={{ background: '#080806' }}>
        {localHexes.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center" style={{ animation: 'fade-up 0.5s ease both' }}>
              <div className="mb-3 text-5xl opacity-15">🗺️</div>
              <div className="font-display text-[0.82rem] font-semibold tracking-[0.1em] text-stone-600">Sin hexágonos cargados</div>
              <p className="font-body mt-1.5 max-w-xs text-[0.85rem] italic text-stone-700">El GM aún no ha configurado el mapa hexagonal.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Zoom controls */}
            <div className="absolute right-4 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-1.5">
              {[
                { lbl: '+', fn: () => setView(v => ({ ...v, zoom: Math.min(3.5, v.zoom * 1.25) })) },
                { lbl: '⌂', fn: resetView },
                { lbl: '−', fn: () => setView(v => ({ ...v, zoom: Math.max(0.2, v.zoom * 0.8) })) },
              ].map(({ lbl, fn }) => (
                <button key={lbl} onClick={fn}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-[#3c3330] bg-[#181412]/90 font-display text-sm text-stone-500 backdrop-blur-sm transition-all hover:border-amber-500/30 hover:text-amber-400">
                  {lbl}
                </button>
              ))}
            </div>

            {/* Scale indicator */}
            <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 rounded-md border border-[#2a2826] bg-[#0e0c0b]/80 px-2.5 py-1.5 backdrop-blur-sm">
              <span className="font-display text-[0.58rem] tracking-[0.12em] text-stone-700">{Math.round(view.zoom * 100)}%</span>
              <span className="text-[#2a2826]">·</span>
              <span className="font-display text-[0.58rem] tracking-[0.1em] text-stone-700">{map.hex_config.hex_size_miles} mi/hex</span>
            </div>

            {/* Party indicator */}
            {localMap.current_party_hex_id && (
              <div className="absolute bottom-3 right-4 z-10 flex items-center gap-2 rounded-md border border-amber-500/20 bg-amber-500/8 px-2.5 py-1.5">
                <div className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
                <span className="text-[0.6rem] uppercase tracking-[0.1em] text-amber-500/80">Grupo</span>
              </div>
            )}

            <svg ref={svgRef} className="h-full w-full"
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}>
              <defs>
                <pattern id="mapgrid" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
                  <rect width="32" height="32" fill="#0a0806" />
                  <circle cx="0"  cy="0"  r="0.6" fill="#141210" />
                  <circle cx="32" cy="0"  r="0.6" fill="#141210" />
                  <circle cx="0"  cy="32" r="0.6" fill="#141210" />
                  <circle cx="32" cy="32" r="0.6" fill="#141210" />
                </pattern>
                <filter id="hexglow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="flagglow">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              <rect width="100%" height="100%" fill="url(#mapgrid)" />

              <g transform={`translate(${initTx + view.pan.x},${initTy + view.pan.y}) scale(${view.zoom})`}>
                {sortedHexData.map(hex => {
                  const t        = TERRAIN[hex.terrain] ?? TERRAIN.other
                  const isSelected = hex._id === selectedHexId
                  const isHovered  = hex._id === hoveredHexId
                  const isParty    = hex._id === localMap.current_party_hex_id
                  const inner    = hexPoints(hex.x, hex.y, HEX_R - 1.2)

                  return (
                    <g key={hex._id}
                      onPointerEnter={() => { if (!isDragging) setHoveredHexId(hex._id) }}
                      onPointerLeave={() => setHoveredHexId(null)}
                      style={{
                        cursor: 'pointer',
                        transformBox:    'fill-box' as React.CSSProperties['transformBox'],
                        transformOrigin: 'center',
                        transform:   isHovered ? 'scale(1.14)' : 'scale(1)',
                        transition:  'transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        filter: isHovered
                          ? 'drop-shadow(0 4px 14px rgba(0,0,0,0.8)) drop-shadow(0 0 6px rgba(245,158,11,0.15))'
                          : 'none',
                      }}>
                      <polygon points={inner}
                        fill={hex.is_explored ? t.fill : '#0c0a08'}
                        stroke={isSelected ? '#f59e0b' : t.stroke}
                        strokeWidth={isSelected ? 1.8 : 0.7} />

                      {!hex.is_explored && (
                        <polygon points={inner} fill="rgba(0,0,0,0.55)"
                          stroke={t.stroke} strokeWidth={0.5} strokeDasharray="4 4" />
                      )}

                      {isSelected && (
                        <polygon points={inner} fill="rgba(245,158,11,0.10)"
                          stroke="#f59e0b" strokeWidth={1.8} filter="url(#hexglow)" />
                      )}

                      {hex.point_features.map((feat: ApiHexPointFeature, fi: number) => (
                        <text key={fi} x={hex.x} y={hex.y + (fi - (hex.point_features.length - 1) / 2) * 10}
                          textAnchor="middle" dominantBaseline="middle"
                          fontSize={feat.location_id ? 9 : 7}
                          fill={feat.location_id ? '#f59e0b' : '#5a5250'}
                          style={{ pointerEvents: 'none', userSelect: 'none' }}>
                          {FEAT_ICON[feat.type] ?? '•'}
                        </text>
                      ))}

                      {/* Party flag */}
                      {isParty && (
                        <g style={{ pointerEvents: 'none' }}>
                          {/* Pole */}
                          <line x1={hex.x} y1={hex.y - HEX_R * 0.72}
                            x2={hex.x} y2={hex.y + HEX_R * 0.32}
                            stroke="#f59e0b" strokeWidth="1.4" opacity="0.95" />
                          {/* Flag triangle */}
                          <polygon
                            points={`${hex.x},${hex.y - HEX_R * 0.72} ${hex.x + 13},${hex.y - HEX_R * 0.46} ${hex.x},${hex.y - HEX_R * 0.2}`}
                            fill="#f59e0b" opacity="0.9" filter="url(#flagglow)" />
                          {/* Base dot */}
                          <circle cx={hex.x} cy={hex.y + HEX_R * 0.32}
                            r={2.2} fill="#f59e0b" opacity="0.8" />
                        </g>
                      )}

                      {isSelected && hex.region && (
                        <text x={hex.x} y={hex.y + HEX_R + 10}
                          textAnchor="middle" fontSize={7} fill="#a8a29e"
                          style={{ pointerEvents: 'none', userSelect: 'none' }}>
                          {hex.region}
                        </text>
                      )}
                    </g>
                  )
                })}
              </g>
            </svg>
          </>
        )}
      </div>

      {/* ── Sidebar ── */}
      <aside className="flex w-72 shrink-0 flex-col overflow-hidden border-l border-[#1e1c1a] bg-[#0e0c0b]">
        {selectedHex ? (
          <HexPanel
            hex={selectedHex}
            locationMap={locationMap}
            mapId={localMap._id}
            mapData={localMap}
            token={token}
            user={user}
            sessions={sessions}
            npcs={npcs}
            onUpdate={handleHexUpdate}
            onUpdateMap={setLocalMap}
            onAddLocation={handleAddLocation}
            onClose={() => setSelectedHexId(null)}
          />
        ) : (
          <LocationPanel
            locations={localLocations}
            filterType={filterType}
            onFilterChange={setFilterType}
          />
        )}
        <MapLegend hexes={localHexes} />
      </aside>
    </div>
  )
}
