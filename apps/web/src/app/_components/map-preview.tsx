import Link from 'next/link'
import { hexCenter, hexPolygonPoints, HEX_RADIUS } from '@/lib/hex'
import type { ApiGameMap, ApiHex, ApiHexPointFeature } from '@/lib/api'

// ── Constants (subset of map-view) ────────────────────────────────────────

const TERRAIN: Record<string, { fill: string; stroke: string }> = {
  plains:    { fill: '#1a3a0c', stroke: '#2a5512' },
  hills:     { fill: '#2a220e', stroke: '#463810' },
  forest:    { fill: '#0e2208', stroke: '#183a0c' },
  swamp:     { fill: '#141e0c', stroke: '#203016' },
  mountains: { fill: '#201c1c', stroke: '#342a2a' },
  desert:    { fill: '#2a2008', stroke: '#483a10' },
  tundra:    { fill: '#181a22', stroke: '#24283c' },
  lake:      { fill: '#0c1620', stroke: '#122240' },
  ocean:     { fill: '#080e18', stroke: '#0c1626' },
  other:     { fill: '#141210', stroke: '#201e1a' },
}

const FEAT_SYMBOL: Record<string, string> = {
  city: 'castle', town: 'building', village: 'tent',
  dungeon: 'skull', cave: 'mountain', ruins: 'landmark',
  fortress: 'castle', temple: 'church', mine: 'pickaxe',
  landmark: 'flag', other: 'mappin',
}

const ICON_SYMBOLS: Record<string, string[]> = {
  castle:   ["M22 9v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9", "M22 11H2", "M6 3v8", "M18 3v8", "M18 5H6", "M10 5V3", "M14 5V3", "M15 21v-3a3 3 0 0 0-6 0v3"],
  building: ["M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16", "M2 21h20", "M14 21v-3a2 2 0 0 0-4 0v3", "M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2", "M10 12h4", "M10 8h4"],
  tent:     ["M3.5 21 14 3", "M20.5 21 10 3", "M15.5 21 12 15l-3.5 6", "M2 21h20"],
  skull:    ["M15 22a1 1 0 0 0 1-1v-1a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20v1a1 1 0 0 0 1 1z", "m12.5 17-.5-1-.5 1h1z"],
  mountain: ["m8 3 4 8 5-5 5 15H2L8 3z"],
  landmark: ["M11.12 2.198a2 2 0 0 1 1.76.006l7.866 3.847c.476.233.31.949-.22.949H3.474c-.53 0-.695-.716-.22-.949z", "M10 18v-7", "M14 18v-7", "M18 18v-7", "M6 18v-7", "M3 22h18"],
  church:   ["M6 21V7a1 1 0 0 1 .376-.782l5-3.999a1 1 0 0 1 1.249.001l5 4A1 1 0 0 1 18 7v14", "M14 21v-3a2 2 0 0 0-4 0v3", "M10 9h4", "M12 7v5", "m18 9 3.52 2.147a1 1 0 0 1 .48.854V19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6.999a1 1 0 0 1 .48-.854L6 9"],
  pickaxe:  ["m14 13-8.381 8.38a1 1 0 0 1-3.001-3L11 9.999", "M18.352 3.352a1.205 1.205 0 0 0-1.704 0l-5.296 5.296a1.205 1.205 0 0 0 0 1.704l2.296 2.296a1.205 1.205 0 0 0 1.704 0l5.296-5.296a1.205 1.205 0 0 0 0-1.704z"],
  flag:     ["M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528"],
  mappin:   ["M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0", "M12 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"],
}

// ── Component ──────────────────────────────────────────────────────────────

interface Props {
  map: ApiGameMap
  hexes: ApiHex[]
}

export function MapPreview({ map, hexes }: Props) {
  if (hexes.length === 0) return null

  const discovered = hexes.filter(h => h.is_discovered || h.is_explored)
  if (discovered.length === 0) return null

  // Pixel coords for every hex
  const hexData = hexes.map(h => ({ ...h, ...hexCenter(h.q, h.r) }))

  // Viewbox from all hex positions (not just discovered, to keep the grid stable)
  const xs  = hexData.map(h => h.x)
  const ys  = hexData.map(h => h.y)
  const pad = HEX_RADIUS * 2
  const vbX = Math.min(...xs) - pad
  const vbY = Math.min(...ys) - pad
  const vbW = Math.max(...xs) - Math.min(...xs) + pad * 2
  const vbH = Math.max(...ys) - Math.min(...ys) + pad * 2

  const exploredCount = hexes.filter(h => h.is_explored).length

  return (
    <section
      className="border-y border-[#2a2826] px-6 py-8"
      style={{ background: 'radial-gradient(ellipse 80% 160% at 50% 50%, #0c100e 0%, #0c0a09 70%)' }}
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-4 flex items-baseline justify-between">
          <span className="font-display text-[0.72rem] font-semibold uppercase tracking-[0.25em] text-stone-500">
            Mapa de la campaña
          </span>
          <div className="flex items-center gap-4">
            <span className="text-[0.65rem] text-stone-700">
              {exploredCount} hex{exploredCount !== 1 ? 'es' : ''} explorado{exploredCount !== 1 ? 's' : ''}
            </span>
            <Link href="/map" className="text-[0.75rem] font-medium text-amber-500 transition-colors hover:text-amber-400">
              Ver mapa completo →
            </Link>
          </div>
        </div>

        {/* SVG preview */}
        <div className="group relative overflow-hidden rounded-xl border border-[#2a2826]" style={{ maxHeight: '220px' }}>
          <svg
            viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
            preserveAspectRatio="xMidYMid meet"
            className="w-full"
            style={{ display: 'block', maxHeight: '220px' }}
          >
            <defs>
              {/* Icon symbols */}
              {Object.entries(ICON_SYMBOLS).map(([id, paths]) => (
                <symbol
                  key={id}
                  id={`prev-icon-${id}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {paths.map((d, i) => <path key={i} d={d} />)}
                </symbol>
              ))}

              {/* Vignette gradient */}
              <radialGradient id="prev-vignette" cx="50%" cy="50%" r="50%">
                <stop offset="60%" stopColor="transparent" />
                <stop offset="100%" stopColor="#0c0a09" stopOpacity="0.8" />
              </radialGradient>
            </defs>

            {/* Background */}
            <rect x={vbX} y={vbY} width={vbW} height={vbH} fill="#080806" />

            {/* Hexes */}
            {hexData.map(hex => {
              const t          = TERRAIN[hex.terrain] ?? TERRAIN.other
              const showTerrain = hex.is_discovered || hex.is_explored
              const fill        = showTerrain ? t.fill : '#0a0908'
              const stroke      = showTerrain ? t.stroke : '#151210'
              const strokeW     = showTerrain ? 0.6 : 0.3
              const inner       = hexPolygonPoints(hex.x, hex.y)
              const isParty     = map.current_party_hex_id === hex._id

              return (
                <g key={hex._id}>
                  <polygon points={inner} fill={fill} stroke={stroke} strokeWidth={strokeW} />

                  {/* Fog overlay for undiscovered */}
                  {!hex.is_discovered && (
                    <polygon points={inner} fill="rgba(0,0,0,0.55)"
                      stroke="#1c1917" strokeWidth={0.2} strokeDasharray="4 4" />
                  )}

                  {/* Point feature icons on explored hexes */}
                  {hex.is_explored && hex.point_features.map((feat: ApiHexPointFeature, fi: number) => {
                    const symbolId  = FEAT_SYMBOL[feat.type] ?? 'mappin'
                    const iconColor = feat.location_id ? '#f59e0b' : '#5a5250'
                    const sz        = feat.location_id ? 9 : 7
                    const iy        = hex.y + (fi - (hex.point_features.length - 1) / 2) * 11
                    return (
                      <use
                        key={fi}
                        href={`#prev-icon-${symbolId}`}
                        x={hex.x - sz / 2}
                        y={iy - sz / 2}
                        width={sz}
                        height={sz}
                        color={iconColor}
                      />
                    )
                  })}

                  {/* Party position */}
                  {isParty && (
                    <g>
                      <line
                        x1={hex.x} y1={hex.y - HEX_RADIUS * 0.68}
                        x2={hex.x} y2={hex.y + HEX_RADIUS * 0.28}
                        stroke="#f59e0b" strokeWidth="1.2" opacity="0.9"
                      />
                      <polygon
                        points={`${hex.x},${hex.y - HEX_RADIUS * 0.68} ${hex.x + 11},${hex.y - HEX_RADIUS * 0.44} ${hex.x},${hex.y - HEX_RADIUS * 0.2}`}
                        fill="#f59e0b" opacity="0.85"
                      />
                      <circle cx={hex.x} cy={hex.y + HEX_RADIUS * 0.28} r={1.8} fill="#f59e0b" opacity="0.75" />
                    </g>
                  )}
                </g>
              )
            })}

            {/* Vignette */}
            <rect x={vbX} y={vbY} width={vbW} height={vbH} fill="url(#prev-vignette)" />
          </svg>

          {/* Click-to-map overlay */}
          <Link
            href="/map"
            className="absolute inset-0 flex items-end justify-end p-4 opacity-0 transition-opacity group-hover:opacity-100"
            aria-label="Ver mapa completo"
          >
            <span className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-[#0e0c0b]/90 px-3.5 py-2 font-display text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-amber-400 backdrop-blur-sm">
              <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
              Ver mapa completo
            </span>
          </Link>
        </div>
      </div>
    </section>
  )
}
