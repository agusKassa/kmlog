import type { HexPoint } from '@kmlog/types'

export interface AxialCoord {
  q: number
  r: number
}

export interface PixelPoint {
  x: number
  y: number
}

// Pointy-top hex: converts axial (q,r) to pixel center given hex size (center-to-vertex radius)
export function axialToPixel(q: number, r: number, size: number): PixelPoint {
  return {
    x: size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r),
    y: size * (3 / 2) * r,
  }
}

// Returns the pixel position of a HexPoint (0=center, 1-6=vertices) relative to the hex center.
// Pointy-top: vertex 1 is at top (270°), going clockwise.
export function hexPointOffset(point: HexPoint, size: number): PixelPoint {
  if (point === 0) return { x: 0, y: 0 }
  // Angle for vertex n: 90° + (n-1)*60°, measured clockwise from top
  // In standard math angles (CCW from right): -90° - (n-1)*60°
  const angleDeg = -90 + (point - 1) * 60
  const angleRad = (angleDeg * Math.PI) / 180
  return {
    x: size * Math.cos(angleRad),
    y: size * Math.sin(angleRad),
  }
}

// Returns all 6 vertex pixel positions for a hex centered at (cx, cy)
export function hexVertices(cx: number, cy: number, size: number): PixelPoint[] {
  return ([1, 2, 3, 4, 5, 6] as HexPoint[]).map((p) => {
    const off = hexPointOffset(p, size)
    return { x: cx + off.x, y: cy + off.y }
  })
}

// Axial directions for pointy-top hexes (E, NE, NW, W, SW, SE)
export const HEX_DIRECTIONS: AxialCoord[] = [
  { q: 1, r: 0 },   // 0: E
  { q: 1, r: -1 },  // 1: NE
  { q: 0, r: -1 },  // 2: NW
  { q: -1, r: 0 },  // 3: W
  { q: -1, r: 1 },  // 4: SW
  { q: 0, r: 1 },   // 5: SE
]

export function hexNeighbors(q: number, r: number): AxialCoord[] {
  return HEX_DIRECTIONS.map((d) => ({ q: q + d.q, r: r + d.r }))
}

export function axialDistance(a: AxialCoord, b: AxialCoord): number {
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2
}

// For each of the 6 directions, which two HexPoints (vertices) are on the shared edge.
// Direction index matches HEX_DIRECTIONS. Pointy-top, vertex 1=top, clockwise.
// Edge between two hexes lies between the two shared vertices of the source hex.
export const DIRECTION_ENTRY_VERTICES: [HexPoint, HexPoint][] = [
  [2, 3], // E  → vertices 2 (top-right) and 3 (bottom-right)
  [1, 2], // NE → vertices 1 (top) and 2 (top-right)
  [6, 1], // NW → vertices 6 (top-left) and 1 (top)
  [5, 6], // W  → vertices 5 (bottom-left) and 6 (top-left)
  [4, 5], // SW → vertices 4 (bottom) and 5 (bottom-left)
  [3, 4], // SE → vertices 3 (bottom-right) and 4 (bottom)
]
