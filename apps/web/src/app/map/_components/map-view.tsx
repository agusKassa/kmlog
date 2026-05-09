'use client'

import { useState, useRef, useCallback, useMemo } from 'react'
import type { ApiGameMap, ApiHex, ApiLocation, ApiHexPointFeature } from '@/lib/api'

// ── Hex math (pointy-top axial grid) ─────────────────────────────────────────

const SQRT3 = Math.sqrt(3)
const HEX_R = 32  // center-to-vertex radius in SVG units

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
  wilderness: { label: 'Yerma',   color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20' },
  building:   { label: 'Edificio', color: 'text-sky-400',    bg: 'bg-sky-500/10',    border: 'border-sky-500/20' },
  region:     { label: 'Región',   color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
  other:      { label: 'Otro',     color: 'text-stone-400',  bg: 'bg-stone-500/10',  border: 'border-stone-700/40' },
}

// ── Types ─────────────────────────────────────────────────────────────────────

type ViewState = { pan: { x: number; y: number }; zoom: number }

type Props = {
  map: ApiGameMap
  hexes: ApiHex[]
  locations: ApiLocation[]
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

function HexPanel({
  hex,
  locationMap,
  onClose,
}: {
  hex: ApiHex
  locationMap: Map<string, ApiLocation>
  onClose: () => void
}) {
  const terrain = TERRAIN[hex.terrain] ?? TERRAIN.other

  return (
    <>
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
        {/* Terrain + status */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
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

        {/* Party summary */}
        {hex.party_summary && (
          <div className="mb-4">
            <SectionLabel>Situación</SectionLabel>
            <p className="font-body text-[0.9rem] leading-relaxed text-stone-400 italic">
              {hex.party_summary}
            </p>
          </div>
        )}

        {/* Point features */}
        {hex.point_features.length > 0 && (
          <div className="mb-4">
            <SectionLabel>Puntos de interés</SectionLabel>
            <div className="flex flex-col gap-1.5">
              {hex.point_features.map((feat, i) => {
                const linkedLoc = feat.location_id ? locationMap.get(feat.location_id) : null
                const icon = FEAT_ICON[feat.type] ?? '•'
                return (
                  <div key={i} className="flex items-center gap-2.5 rounded-lg border border-[#2a2826] bg-[#141210] px-3 py-2">
                    <span className="text-[0.9rem] text-amber-500/80">{icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[0.75rem] font-medium text-stone-300 truncate">
                        {linkedLoc?.name ?? feat.label ?? feat.type}
                      </div>
                      {linkedLoc && (
                        <div className="text-[0.62rem] text-stone-600 truncate">
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

        {/* Locations embedded in hex */}
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
                        <p className="font-body text-[0.78rem] italic leading-snug text-stone-600 line-clamp-2">
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

        {hex.point_features.length === 0 && hex.location_ids.length === 0 && !hex.party_summary && (
          <p className="font-body text-[0.85rem] italic text-stone-700">
            Sin información registrada para este hexágono.
          </p>
        )}
      </div>
    </>
  )
}

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

        {/* Type filter chips */}
        {types.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            <button
              onClick={() => onFilterChange(null)}
              className={`rounded px-2 py-0.5 text-[0.6rem] font-medium uppercase tracking-[0.08em] transition-colors ${
                !filterType
                  ? 'bg-amber-500/15 text-amber-400'
                  : 'text-stone-600 hover:text-stone-400'
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
                    filterType === t
                      ? `${s.color} ${s.bg}`
                      : 'text-stone-600 hover:text-stone-400'
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
              {locations.length === 0
                ? 'Sin ubicaciones registradas aún.'
                : 'Sin ubicaciones de este tipo.'}
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
                  <p className="font-body text-[0.78rem] italic leading-snug text-stone-600 line-clamp-2">
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

function MapLegend({ hexes }: { hexes: ApiHex[] }) {
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
              <div
                className="h-2.5 w-4 shrink-0 rounded-sm"
                style={{ background: s.fill, border: `1px solid ${s.stroke}` }}
              />
              <span className="text-[0.62rem] text-stone-600">{s.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function MapView({ map, hexes, locations }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [selectedHexId, setSelectedHexId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string | null>(null)
  const [view, setView] = useState<ViewState>({ pan: { x: 0, y: 0 }, zoom: 1 })
  const [isDragging, setIsDragging] = useState(false)

  const dragRef = useRef({ active: false, startX: 0, startY: 0, panX: 0, panY: 0, moved: false })

  // Index locations for quick lookup
  const locationMap = useMemo(
    () => new Map(locations.map(l => [l._id, l])),
    [locations]
  )

  const selectedHex = useMemo(
    () => hexes.find(h => h._id === selectedHexId) ?? null,
    [hexes, selectedHexId]
  )

  // Compute pixel centers for each hex
  const hexData = useMemo(
    () => hexes.map(h => ({ ...h, ...axialToPixel(h.q, h.r) })),
    [hexes]
  )

  // Translation that puts the grid's top-left at (padding, padding)
  const { initTx, initTy } = useMemo(() => {
    if (hexData.length === 0) return { initTx: 60, initTy: 60 }
    const xs = hexData.map(h => h.x)
    const ys = hexData.map(h => h.y)
    return {
      initTx: -(Math.min(...xs) - HEX_R * 1.5) + 60,
      initTy: -(Math.min(...ys) - HEX_R * 1.5) + 60,
    }
  }, [hexData])

  // ── Pointer handlers (pan + click distinction) ────────────────────────────

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

  const handlePointerUp = useCallback(() => {
    dragRef.current.active = false
    setIsDragging(false)
  }, [])

  // Zoom toward cursor
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

  const handleHexClick = useCallback((hexId: string) => {
    if (dragRef.current.moved) return
    setSelectedHexId(prev => (prev === hexId ? null : hexId))
  }, [])

  const resetView = useCallback(() => {
    setView({ pan: { x: 0, y: 0 }, zoom: 1 })
  }, [])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-0 flex-1">
      {/* ── Map canvas ── */}
      <div className="relative min-h-0 flex-1 overflow-hidden" style={{ background: '#080806' }}>
        {hexes.length === 0 ? (
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

            {/* Party legend dot */}
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
                {hexData.map(hex => {
                  const t = TERRAIN[hex.terrain] ?? TERRAIN.other
                  const isSelected = hex._id === selectedHexId
                  const isParty = hex._id === map.current_party_hex_id
                  const outer = hexPoints(hex.x, hex.y, HEX_R)
                  const inner = hexPoints(hex.x, hex.y, HEX_R - 1.2)

                  return (
                    <g
                      key={hex._id}
                      onClick={() => handleHexClick(hex._id)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Base terrain fill */}
                      <polygon
                        points={inner}
                        fill={hex.is_explored ? t.fill : '#0c0a08'}
                        stroke={isSelected ? '#f59e0b' : t.stroke}
                        strokeWidth={isSelected ? 1.8 : 0.7}
                      />

                      {/* Unexplored fog overlay */}
                      {!hex.is_explored && (
                        <polygon
                          points={inner}
                          fill="rgba(0,0,0,0.55)"
                          stroke={t.stroke}
                          strokeWidth={0.5}
                          strokeDasharray="4 4"
                        />
                      )}

                      {/* Hover / selected glow */}
                      {isSelected && (
                        <polygon
                          points={inner}
                          fill="rgba(245,158,11,0.10)"
                          stroke="#f59e0b"
                          strokeWidth={1.8}
                          filter="url(#hexglow)"
                        />
                      )}

                      {/* Point feature icons */}
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

                      {/* Party indicator */}
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

                      {/* Region label for selected */}
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
            onClose={() => setSelectedHexId(null)}
          />
        ) : (
          <LocationPanel
            locations={locations}
            filterType={filterType}
            onFilterChange={setFilterType}
          />
        )}

        <MapLegend hexes={hexes} />
      </aside>
    </div>
  )
}
