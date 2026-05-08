import type { TerrainType, LinearFeatureType, HexPoint } from '@kmlog/types'
import { HEX_DIRECTIONS, DIRECTION_ENTRY_VERTICES, type AxialCoord } from './hex-math'

// Base cost in hours to cross a hex of each terrain type (at 25ft/round party speed)
// Assumes 8h travel day and standard Pathfinder 2e exploration rules
export const TERRAIN_TRAVEL_COST: Record<TerrainType, number> = {
  plains: 8,
  hills: 16,
  forest: 16,
  swamp: 24,
  mountains: 24,
  desert: 16,
  tundra: 16,
  lake: Infinity,  // impassable without boat
  ocean: Infinity, // impassable without ship
  other: 8,
}

// Multiplicative modifier when crossing an edge that has this linear feature
export const LINEAR_EDGE_COST_MODIFIER: Record<LinearFeatureType, number> = {
  road: 0.5,
  trail: 0.75,
  river: 1.5,
  stream: 1.25,
  cliff: 2.0,
  coastline: 1.0,
  wall: 1.5,
  bridge: 0.5,
}

export interface TravelHex {
  q: number
  r: number
  terrain: TerrainType
  linear_features: { type: LinearFeatureType; path: HexPoint[] }[]
}

export interface DijkstraResult {
  /** cost in hours for each hex key "q,r" */
  cost: Map<string, number>
  /** previous hex key for path reconstruction */
  prev: Map<string, string>
}

function hexKey(q: number, r: number): string {
  return `${q},${r}`
}

// Returns the edge-cost modifier for traveling from hex (q,r) in direction dirIndex.
// Checks both the exiting edge of the source hex and the entering edge of the neighbor hex.
function getEdgeCostModifier(
  hexMap: Map<string, TravelHex>,
  q: number,
  r: number,
  dirIndex: number,
): number {
  const [vA, vB] = DIRECTION_ENTRY_VERTICES[dirIndex]
  const oppositeDir = (dirIndex + 3) % 6
  const [vC, vD] = DIRECTION_ENTRY_VERTICES[oppositeDir]

  const neighbor = HEX_DIRECTIONS[dirIndex]
  const nq = q + neighbor.q
  const nr = r + neighbor.r

  let modifier = 1.0

  const sourceHex = hexMap.get(hexKey(q, r))
  if (sourceHex) {
    for (const feat of sourceHex.linear_features) {
      const path = feat.path as HexPoint[]
      const crossesEdge = path.some((p) => p === vA || p === vB)
      if (crossesEdge) {
        modifier *= LINEAR_EDGE_COST_MODIFIER[feat.type]
      }
    }
  }

  const neighborHex = hexMap.get(hexKey(nq, nr))
  if (neighborHex) {
    for (const feat of neighborHex.linear_features) {
      const path = feat.path as HexPoint[]
      const crossesEdge = path.some((p) => p === vC || p === vD)
      if (crossesEdge) {
        modifier = Math.min(modifier, modifier * LINEAR_EDGE_COST_MODIFIER[feat.type])
      }
    }
  }

  return modifier
}

// Dijkstra from a single source hex. Returns cost (hours) to all reachable hexes.
// speedFtPerRound: party speed (e.g. 25) used to scale travel costs.
export function dijkstra(
  hexMap: Map<string, TravelHex>,
  startQ: number,
  startR: number,
  speedFtPerRound = 25,
): DijkstraResult {
  const speedRatio = 25 / speedFtPerRound
  const cost = new Map<string, number>()
  const prev = new Map<string, string>()
  // Min-heap simulation via sorted array (sufficient for ~1200 nodes)
  const queue: { key: string; q: number; r: number; dist: number }[] = []

  const startKey = hexKey(startQ, startR)
  cost.set(startKey, 0)
  queue.push({ key: startKey, q: startQ, r: startR, dist: 0 })

  while (queue.length > 0) {
    queue.sort((a, b) => a.dist - b.dist)
    const current = queue.shift()!

    if (current.dist > (cost.get(current.key) ?? Infinity)) continue

    for (let dirIndex = 0; dirIndex < 6; dirIndex++) {
      const dir = HEX_DIRECTIONS[dirIndex]
      const nq = current.q + dir.q
      const nr = current.r + dir.r
      const nKey = hexKey(nq, nr)

      const neighborHex = hexMap.get(nKey)
      if (!neighborHex) continue

      const baseCost = TERRAIN_TRAVEL_COST[neighborHex.terrain]
      if (!isFinite(baseCost)) continue

      const edgeMod = getEdgeCostModifier(hexMap, current.q, current.r, dirIndex)
      const moveCost = baseCost * edgeMod * speedRatio

      const newDist = current.dist + moveCost
      if (newDist < (cost.get(nKey) ?? Infinity)) {
        cost.set(nKey, newDist)
        prev.set(nKey, current.key)
        queue.push({ key: nKey, q: nq, r: nr, dist: newDist })
      }
    }
  }

  return { cost, prev }
}

// Reconstructs the path from Dijkstra result as an array of "q,r" keys
export function reconstructPath(prev: Map<string, string>, targetKey: string): string[] {
  const path: string[] = []
  let current: string | undefined = targetKey
  while (current) {
    path.unshift(current)
    current = prev.get(current)
  }
  return path
}

// Converts hours to days given hours_per_day config
export function hoursToDays(hours: number, hoursPerDay: number): number {
  return hours / hoursPerDay
}
