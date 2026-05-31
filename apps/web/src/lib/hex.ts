import { defineHex, Orientation } from 'honeycomb-grid'

export const HEX_RADIUS = 32
const INSET = 1.2
const FACTOR = (HEX_RADIUS - INSET) / HEX_RADIUS

const HexDef = defineHex({
  dimensions: HEX_RADIUS,
  orientation: Orientation.POINTY,
  origin: { x: 0, y: 0 },
})

// Precompute corner offsets once — all hexes share the same shape.
// Honeycomb corners[] for hex at (0,0) equal the offsets from center.
// Corner order: [0]=top-right, [1]=bottom-right, [2]=bottom,
//               [3]=bottom-left, [4]=top-left, [5]=top
const CORNER_OFFSETS = new HexDef({ q: 0, r: 0 }).corners

// Returns pixel center of a hex at axial coordinates (q, r).
export function hexCenter(q: number, r: number): { x: number; y: number } {
  const h = new HexDef({ q, r })
  return { x: h.x, y: h.y }
}

// Returns an SVG polygon `points` string for a hex at pixel center (cx, cy),
// inset by 1.2px to expose a thin gap between adjacent hexes.
export function hexPolygonPoints(cx: number, cy: number): string {
  return CORNER_OFFSETS
    .map(c => `${cx + c.x * FACTOR},${cy + c.y * FACTOR}`)
    .join(' ')
}

// Returns the midpoint of hex edge `edge` (0–5).
// Edge numbering: 0=NE, 1=E, 2=SE, 3=SW, 4=W, 5=NW (pointy-top).
// Honeycomb corners start at index [5]=top, so our edge[e] spans
// corners[(e+5)%6] → corners[e%6].
export function hexEdgeMidpoint(cx: number, cy: number, edge: number): [number, number] {
  const c1 = CORNER_OFFSETS[(edge + 5) % 6]
  const c2 = CORNER_OFFSETS[edge % 6]
  return [
    cx + ((c1.x + c2.x) / 2) * FACTOR,
    cy + ((c1.y + c2.y) / 2) * FACTOR,
  ]
}

// Axial (cube-coordinate) distance between two hexes.
export function hexDistance(q1: number, r1: number, q2: number, r2: number): number {
  return Math.max(
    Math.abs(q1 - q2),
    Math.abs(r1 - r2),
    Math.abs((q1 + r1) - (q2 + r2)),
  )
}

// True when two hexes share an edge.
export function areAdjacent(q1: number, r1: number, q2: number, r2: number): boolean {
  return hexDistance(q1, r1, q2, r2) === 1
}

// The 6 axial neighbor directions for pointy-top hexes.
export const HEX_DIRECTIONS = [
  [1, 0], [1, -1], [0, -1],
  [-1, 0], [-1, 1], [0, 1],
] as const
