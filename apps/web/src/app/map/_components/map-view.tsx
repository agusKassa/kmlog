'use client'

import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import type { ApiGameMap, ApiHex, ApiLocation, ApiHexPointFeature } from '@/lib/api'

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

// ── HexPanel ──────────────────────────────────────────────────────────────────

function HexPanel({
  hex,
  locationMap,
  mapId,
  token,
  user,
  onUpdate,
  onClose,
}: {
  hex: RichHex
  locationMap: Map<string, ApiLocation>
  mapId: string
  token: string | null
  user: AuthUser | null
  onUpdate: (updated: RichHex) => void
  onClose: () => void
}) {
  const terrain = TERRAIN[hex.terrain] ?? TERRAIN.other
  const isGm = user?.role === 'gm'
  const isLoggedIn = !!token

  const [saving, setSaving] = useState(false)
  const [editingPartySummary, setEditingPartySummary] = useState(false)
  const [partySummaryValue, setPartySummaryValue] = useState(hex.party_summary ?? '')
  const [editingGmNotes, setEditingGmNotes] = useState(false)
  const [gmNotesValue, setGmNotesValue] = useState(hex.gm_notes ?? '')
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [noteContent, setNoteContent] = useState('')
  const [notePublic, setNotePublic] = useState(false)

  // Sync editable values when hex changes (e.g. after external update)
  useEffect(() => {
    setPartySummaryValue(hex.party_summary ?? '')
    setGmNotesValue(hex.gm_notes ?? '')
  }, [hex._id, hex.party_summary, hex.gm_notes])

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }

  async function putHex(body: Record<string, unknown>) {
    setSaving(true)
    try {
      const res = await fetch(`${API_URL}/maps/${mapId}/hexes/${hex._id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(body),
      })
      if (res.ok) onUpdate(await res.json())
    } finally {
      setSaving(false)
    }
  }

  async function savePartySummary() {
    await putHex({ party_summary: partySummaryValue.trim() || null })
    setEditingPartySummary(false)
  }

  async function saveGmNotes() {
    await putHex({ gm_notes: gmNotesValue.trim() || null })
    setEditingGmNotes(false)
  }

  async function addNote() {
    if (!token || !noteContent.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`${API_URL}/maps/${mapId}/hexes/${hex._id}/notes`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ content: noteContent.trim(), is_public: notePublic }),
      })
      if (res.ok) {
        onUpdate(await res.json())
        setNoteContent('')
        setNotePublic(false)
        setShowNoteForm(false)
      }
    } finally {
      setSaving(false)
    }
  }

  async function deleteNote(noteId: string) {
    if (!token) return
    setSaving(true)
    try {
      const res = await fetch(`${API_URL}/maps/${mapId}/hexes/${hex._id}/notes/${noteId}`, {
        method: 'DELETE',
        headers: authHeaders,
      })
      if (res.ok) onUpdate(await res.json())
    } finally {
      setSaving(false)
    }
  }

  const visibleNotes = (hex.notes ?? []).filter(
    n => n.is_public || (user && n.author_id === user.id)
  )

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2a2826] px-4 py-3">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-[0.72rem] text-stone-600 transition-colors hover:text-amber-400"
        >
          <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Volver
        </button>
        <span className="font-display text-[0.62rem] tracking-[0.15em] text-stone-700">
          Q:{hex.q} R:{hex.r}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">

        {/* Terrain + status badges */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span
            className="rounded px-2.5 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.12em]"
            style={{ background: terrain.fill, color: terrain.stroke, border: `1px solid ${terrain.stroke}` }}
          >
            {terrain.label}
          </span>
          <span className={`rounded border px-2 py-0.5 text-[0.62rem] uppercase tracking-[0.1em] ${
            hex.is_explored
              ? 'border-green-500/25 bg-green-500/8 text-green-400'
              : 'border-stone-700/40 bg-stone-500/8 text-stone-600'
          }`}>
            {hex.is_explored ? 'Explorado' : 'Inexplorado'}
          </span>
          {hex.region && (
            <span className="text-[0.7rem] italic text-stone-600">{hex.region}</span>
          )}
        </div>

        {/* Toggle explored — GM only */}
        {isGm && (
          <button
            onClick={() => putHex({ is_explored: !hex.is_explored })}
            disabled={saving}
            className={`mb-4 w-full rounded-lg border px-3 py-2 text-[0.72rem] font-medium transition-all disabled:opacity-50 ${
              hex.is_explored
                ? 'border-stone-700/40 bg-stone-500/8 text-stone-500 hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-400'
                : 'border-green-500/20 bg-green-500/8 text-green-400 hover:bg-green-500/12'
            }`}
          >
            {hex.is_explored ? '✕  Marcar como inexplorado' : '✓  Marcar como explorado'}
          </button>
        )}

        {/* Party summary */}
        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between">
            <SectionLabel>Situación del grupo</SectionLabel>
            {isGm && !editingPartySummary && (
              <button
                onClick={() => setEditingPartySummary(true)}
                className="text-[0.6rem] text-stone-700 transition-colors hover:text-amber-400"
              >
                editar
              </button>
            )}
          </div>
          {editingPartySummary ? (
            <div className="flex flex-col gap-2">
              <textarea
                value={partySummaryValue}
                onChange={e => setPartySummaryValue(e.target.value)}
                placeholder="Descripción visible del estado del grupo en este hex..."
                rows={3}
                className="w-full resize-none rounded-lg border border-[#3c3330] bg-[#141210] px-3 py-2 text-[0.82rem] text-stone-300 placeholder-stone-700 outline-none focus:border-amber-500/40"
              />
              <div className="flex gap-2">
                <button
                  onClick={savePartySummary}
                  disabled={saving}
                  className="rounded border border-amber-500/20 bg-amber-500/15 px-3 py-1.5 text-[0.7rem] font-medium text-amber-400 transition-colors hover:bg-amber-500/20 disabled:opacity-50"
                >
                  Guardar
                </button>
                <button
                  onClick={() => setEditingPartySummary(false)}
                  className="px-3 py-1.5 text-[0.7rem] text-stone-600 transition-colors hover:text-stone-400"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : hex.party_summary ? (
            <p className="font-body text-[0.9rem] leading-relaxed text-stone-400 italic">
              {hex.party_summary}
            </p>
          ) : (
            <p className="font-body text-[0.82rem] italic text-stone-700">Sin registro.</p>
          )}
        </div>

        {/* GM notes — GM only */}
        {isGm && (
          <div className="mb-4 rounded-lg border border-amber-500/10 bg-amber-500/5 p-3">
            <div className="mb-1.5 flex items-center justify-between">
              <SectionLabel>Notas del GM</SectionLabel>
              {!editingGmNotes && (
                <button
                  onClick={() => setEditingGmNotes(true)}
                  className="text-[0.6rem] text-stone-700 transition-colors hover:text-amber-400"
                >
                  editar
                </button>
              )}
            </div>
            {editingGmNotes ? (
              <div className="flex flex-col gap-2">
                <textarea
                  value={gmNotesValue}
                  onChange={e => setGmNotesValue(e.target.value)}
                  placeholder="Notas privadas del GM para este hex..."
                  rows={4}
                  className="w-full resize-none rounded-lg border border-[#3c3330] bg-[#141210] px-3 py-2 text-[0.82rem] text-stone-300 placeholder-stone-700 outline-none focus:border-amber-500/40"
                />
                <div className="flex gap-2">
                  <button
                    onClick={saveGmNotes}
                    disabled={saving}
                    className="rounded border border-amber-500/20 bg-amber-500/15 px-3 py-1.5 text-[0.7rem] font-medium text-amber-400 transition-colors hover:bg-amber-500/20 disabled:opacity-50"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => setEditingGmNotes(false)}
                    className="px-3 py-1.5 text-[0.7rem] text-stone-600 transition-colors hover:text-stone-400"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : hex.gm_notes ? (
              <p className="font-body text-[0.82rem] leading-relaxed text-amber-100/70 italic">
                {hex.gm_notes}
              </p>
            ) : (
              <p className="font-body text-[0.78rem] italic text-stone-700">Sin notas del GM.</p>
            )}
          </div>
        )}

        {/* Notes — any logged-in user */}
        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between">
            <SectionLabel>
              Notas{visibleNotes.length > 0 ? ` (${visibleNotes.length})` : ''}
            </SectionLabel>
            {isLoggedIn && !showNoteForm && (
              <button
                onClick={() => setShowNoteForm(true)}
                className="text-[0.6rem] text-stone-700 transition-colors hover:text-amber-400"
              >
                + agregar
              </button>
            )}
          </div>

          {showNoteForm && (
            <div className="mb-3 rounded-lg border border-[#2a2826] bg-[#141210] p-3">
              <textarea
                value={noteContent}
                onChange={e => setNoteContent(e.target.value)}
                placeholder="Escribí tu nota para este hexágono..."
                rows={3}
                autoFocus
                className="mb-2 w-full resize-none bg-transparent text-[0.82rem] text-stone-300 placeholder-stone-700 outline-none"
              />
              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={notePublic}
                    onChange={e => setNotePublic(e.target.checked)}
                    className="h-3 w-3 accent-amber-500"
                  />
                  <span className="text-[0.65rem] text-stone-600">Visible para todos</span>
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={addNote}
                    disabled={saving || !noteContent.trim()}
                    className="rounded border border-amber-500/20 bg-amber-500/15 px-3 py-1 text-[0.68rem] font-medium text-amber-400 transition-colors hover:bg-amber-500/20 disabled:opacity-40"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => { setShowNoteForm(false); setNoteContent('') }}
                    className="text-[0.68rem] text-stone-700 transition-colors hover:text-stone-400"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {visibleNotes.length > 0 ? (
            <div className="flex flex-col gap-2">
              {visibleNotes.map(note => (
                <div key={note._id} className="group rounded-lg border border-[#2a2826] bg-[#141210] px-3 py-2.5">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className={`rounded border px-1.5 py-0.5 text-[0.55rem] uppercase tracking-[0.08em] ${
                      note.is_public
                        ? 'border-green-500/15 bg-green-500/10 text-green-500/80'
                        : 'border-stone-700/30 bg-stone-500/10 text-stone-600'
                    }`}>
                      {note.is_public ? 'Pública' : 'Privada'}
                    </span>
                    {(isGm || (user && note.author_id === user.id)) && (
                      <button
                        onClick={() => deleteNote(note._id)}
                        disabled={saving}
                        className="hidden text-[0.6rem] text-stone-700 transition-colors hover:text-red-400 group-hover:block disabled:opacity-50"
                      >
                        eliminar
                      </button>
                    )}
                  </div>
                  <p className="font-body text-[0.82rem] leading-relaxed text-stone-400">
                    {note.content}
                  </p>
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
                      {linkedLoc && (
                        <div className="truncate text-[0.62rem] text-stone-600">
                          {linkedLoc.public_description || '—'}
                        </div>
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
                const loc = locationMap.get(lid)
                if (!loc) return null
                return (
                  <div key={lid} className="flex items-start gap-2.5 rounded-lg border border-[#2a2826] bg-[#141210] px-3 py-2">
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
                <span
                  key={sid}
                  className="rounded border border-[#2a2826] bg-[#141210] px-2 py-0.5 font-display text-[0.62rem] tracking-[0.08em] text-stone-600"
                >
                  #{sid.slice(-4)}
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

function LocationPanel({
  locations,
  filterType,
  onFilterChange,
}: {
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
            <button
              onClick={() => onFilterChange(null)}
              className={`rounded px-2 py-0.5 text-[0.6rem] font-medium uppercase tracking-[0.08em] transition-colors ${
                !filterType ? 'bg-amber-500/15 text-amber-400' : 'text-stone-600 hover:text-stone-400'
              }`}
            >
              Todos
            </button>
            {types.map(t => {
              const s = LOC_TYPE[t] ?? LOC_TYPE.other
              return (
                <button
                  key={t}
                  onClick={() => onFilterChange(filterType === t ? null : t)}
                  className={`rounded px-2 py-0.5 text-[0.6rem] font-medium uppercase tracking-[0.08em] transition-colors ${
                    filterType === t ? `${s.color} ${s.bg}` : 'text-stone-600 hover:text-stone-400'
                  }`}
                >
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
              <div
                key={loc._id}
                className="px-4 py-3 transition-colors hover:bg-[#141210]"
                style={{ animation: `fade-in-left 0.3s ease both ${i * 0.04}s` }}
              >
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
      <div className="mb-2 text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-stone-700">
        Leyenda
      </div>
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
}

type ViewState = { pan: { x: number; y: number }; zoom: number }

export function MapView({ map, hexes, locations }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [localHexes, setLocalHexes] = useState<RichHex[]>(hexes as RichHex[])
  const [selectedHexId, setSelectedHexId] = useState<string | null>(null)
  const [hoveredHexId, setHoveredHexId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string | null>(null)
  const [view, setView] = useState<ViewState>({ pan: { x: 0, y: 0 }, zoom: 1 })
  const [isDragging, setIsDragging] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)

  const dragRef = useRef({ active: false, startX: 0, startY: 0, panX: 0, panY: 0, moved: false })

  useEffect(() => {
    const t = localStorage.getItem('access_token')
    setToken(t)
    setUser(getUserFromToken(t))
  }, [])

  const locationMap = useMemo(
    () => new Map(locations.map(l => [l._id, l])),
    [locations]
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

  const handlePointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      panX: view.pan.x,
      panY: view.pan.y,
      moved: false,
    }
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

  // Click detection in pointerUp to avoid setPointerCapture breaking child onClick
  const handlePointerUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const d = dragRef.current
    d.active = false
    setIsDragging(false)

    if (!d.moved) {
      const svgEl = svgRef.current
      if (!svgEl) return
      const rect = svgEl.getBoundingClientRect()
      const worldX = (e.clientX - rect.left - initTx - view.pan.x) / view.zoom
      const worldY = (e.clientY - rect.top - initTy - view.pan.y) / view.zoom

      let closestId: string | null = null
      let minDist = HEX_R * 1.2
      for (const h of hexData) {
        const dist = Math.hypot(h.x - worldX, h.y - worldY)
        if (dist < minDist) { minDist = dist; closestId = h._id }
      }
      if (closestId) setSelectedHexId(prev => prev === closestId ? null : closestId)
    }
  }, [initTx, initTy, view.pan, view.zoom, hexData])

  const handleWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault()
    const svgEl = svgRef.current
    if (!svgEl) return
    const rect = svgEl.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const factor = e.deltaY > 0 ? 0.88 : 1.14

    setView(({ pan, zoom }) => {
      const newZoom = Math.min(3.5, Math.max(0.2, zoom * factor))
      const ratio = newZoom / zoom
      return {
        zoom: newZoom,
        pan: {
          x: mx - (mx - initTx - pan.x) * ratio - initTx,
          y: my - (my - initTy - pan.y) * ratio - initTy,
        },
      }
    })
  }, [initTx, initTy])

  // Render hovered hex last so it appears on top of neighbors
  const sortedHexData = useMemo(() => {
    if (!hoveredHexId) return hexData
    const idx = hexData.findIndex(h => h._id === hoveredHexId)
    if (idx === -1) return hexData
    const result = [...hexData]
    result.push(...result.splice(idx, 1))
    return result
  }, [hexData, hoveredHexId])

  const resetView = useCallback(() => {
    setView({ pan: { x: 0, y: 0 }, zoom: 1 })
  }, [])

  return (
    <div className="flex min-h-0 flex-1">
      {/* ── Map canvas ── */}
      <div className="relative min-h-0 flex-1 overflow-hidden" style={{ background: '#080806' }}>
        {localHexes.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center" style={{ animation: 'fade-up 0.5s ease both' }}>
              <div className="mb-3 text-5xl opacity-15">🗺️</div>
              <div className="font-display text-[0.82rem] font-semibold tracking-[0.1em] text-stone-600">
                Sin hexágonos cargados
              </div>
              <p className="font-body mt-1.5 max-w-xs text-[0.85rem] italic text-stone-700">
                El GM aún no ha configurado el mapa hexagonal.
              </p>
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
                <button
                  key={lbl}
                  onClick={fn}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-[#3c3330] bg-[#181412]/90 font-display text-sm text-stone-500 backdrop-blur-sm transition-all hover:border-amber-500/30 hover:text-amber-400"
                >
                  {lbl}
                </button>
              ))}
            </div>

            {/* Scale indicator */}
            <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 rounded-md border border-[#2a2826] bg-[#0e0c0b]/80 px-2.5 py-1.5 backdrop-blur-sm">
              <span className="font-display text-[0.58rem] tracking-[0.12em] text-stone-700">
                {Math.round(view.zoom * 100)}%
              </span>
              <span className="text-[#2a2826]">·</span>
              <span className="font-display text-[0.58rem] tracking-[0.1em] text-stone-700">
                {map.hex_config.hex_size_miles} mi/hex
              </span>
            </div>

            {/* Party dot legend */}
            {map.current_party_hex_id && (
              <div className="absolute bottom-3 right-4 z-10 flex items-center gap-2 rounded-md border border-amber-500/20 bg-amber-500/8 px-2.5 py-1.5">
                <div className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
                <span className="text-[0.6rem] uppercase tracking-[0.1em] text-amber-500/80">Party</span>
              </div>
            )}

            <svg
              ref={svgRef}
              className="h-full w-full"
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onWheel={handleWheel}
            >
              <defs>
                <pattern id="mapgrid" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
                  <rect width="32" height="32" fill="#0a0806" />
                  <circle cx="0" cy="0" r="0.6" fill="#141210" />
                  <circle cx="32" cy="0" r="0.6" fill="#141210" />
                  <circle cx="0" cy="32" r="0.6" fill="#141210" />
                  <circle cx="32" cy="32" r="0.6" fill="#141210" />
                </pattern>
                <filter id="hexglow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              <rect width="100%" height="100%" fill="url(#mapgrid)" />

              <g transform={`translate(${initTx + view.pan.x},${initTy + view.pan.y}) scale(${view.zoom})`}>
                {sortedHexData.map(hex => {
                  const t = TERRAIN[hex.terrain] ?? TERRAIN.other
                  const isSelected = hex._id === selectedHexId
                  const isHovered = hex._id === hoveredHexId
                  const isParty = hex._id === map.current_party_hex_id
                  const inner = hexPoints(hex.x, hex.y, HEX_R - 1.2)

                  return (
                    <g
                      key={hex._id}
                      onPointerEnter={() => { if (!isDragging) setHoveredHexId(hex._id) }}
                      onPointerLeave={() => setHoveredHexId(null)}
                      style={{
                        cursor: 'pointer',
                        transformBox: 'fill-box' as React.CSSProperties['transformBox'],
                        transformOrigin: 'center',
                        transform: isHovered ? 'scale(1.14)' : 'scale(1)',
                        transition: 'transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        filter: isHovered
                          ? 'drop-shadow(0 4px 14px rgba(0,0,0,0.8)) drop-shadow(0 0 6px rgba(245,158,11,0.15))'
                          : 'none',
                      }}
                    >
                      <polygon
                        points={inner}
                        fill={hex.is_explored ? t.fill : '#0c0a08'}
                        stroke={isSelected ? '#f59e0b' : t.stroke}
                        strokeWidth={isSelected ? 1.8 : 0.7}
                      />

                      {!hex.is_explored && (
                        <polygon
                          points={inner}
                          fill="rgba(0,0,0,0.55)"
                          stroke={t.stroke}
                          strokeWidth={0.5}
                          strokeDasharray="4 4"
                        />
                      )}

                      {isSelected && (
                        <polygon
                          points={inner}
                          fill="rgba(245,158,11,0.10)"
                          stroke="#f59e0b"
                          strokeWidth={1.8}
                          filter="url(#hexglow)"
                        />
                      )}

                      {hex.point_features.map((feat: ApiHexPointFeature, fi: number) => (
                        <text
                          key={fi}
                          x={hex.x}
                          y={hex.y + (fi - (hex.point_features.length - 1) / 2) * 10}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize={feat.location_id ? 9 : 7}
                          fill={feat.location_id ? '#f59e0b' : '#5a5250'}
                          style={{ pointerEvents: 'none', userSelect: 'none' }}
                        >
                          {FEAT_ICON[feat.type] ?? '•'}
                        </text>
                      ))}

                      {isParty && (
                        <circle
                          cx={hex.x}
                          cy={hex.y + HEX_R - 10}
                          r={4}
                          fill="#f59e0b"
                          stroke="#0c0a09"
                          strokeWidth={1.5}
                        />
                      )}

                      {isSelected && hex.region && (
                        <text
                          x={hex.x}
                          y={hex.y + HEX_R + 10}
                          textAnchor="middle"
                          fontSize={7}
                          fill="#a8a29e"
                          style={{ pointerEvents: 'none', userSelect: 'none' }}
                        >
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
            mapId={map._id}
            token={token}
            user={user}
            onUpdate={handleHexUpdate}
            onClose={() => setSelectedHexId(null)}
          />
        ) : (
          <LocationPanel
            locations={locations}
            filterType={filterType}
            onFilterChange={setFilterType}
          />
        )}
        <MapLegend hexes={localHexes} />
      </aside>
    </div>
  )
}
