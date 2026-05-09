#!/usr/bin/env node
/**
 * seed-stolen-lands.mjs
 * Seeds the Stolen Lands hex map based on the official PF Kingmaker map images.
 *
 * Usage: node scripts/seed-stolen-lands.mjs <gm_email> <gm_password>
 *
 * Grid: 22 cols × 8 rows in OFFSET coordinates, converted to axial.
 * Offset→Axial: q = col - floor(row/2),  r = row
 * This ensures the rendered grid is rectangular, not a parallelogram.
 *
 * Regions (west→east):
 *   Thousand Voices · Brantlend Mountains · Glenebon Uplands/Lowlands ·
 *   Tiger Lords · Hooktongue Slough · Narlmarches · Greenbelt ·
 *   Tuskwater · Kamelands · Nomen Heights · Sellen Hills · Tors de Levenies ·
 *   Rostland Hinterlands · Dunsward
 */

const API = 'https://kmlogapi-production.up.railway.app/api'

// ─── Terrain shorthand ────────────────────────────────────────────────────────
const PL = 'plains'
const HI = 'hills'
const MT = 'mountains'
const FO = 'forest'
const SW = 'swamp'
const LK = 'lake'

// ─── Terrain grid [row][col] in OFFSET coords ─────────────────────────────────
//   row 0 = north, col 0 = west
//   c0   c1   c2   c3   c4   c5   c6   c7   c8   c9  c10  c11  c12  c13  c14  c15  c16  c17  c18  c19  c20  c21
const GRID = [
  [FO,  MT,  MT,  PL,  PL,  PL,  PL,  PL,  PL,  PL,  PL,  PL,  PL,  PL,  PL,  PL,  PL,  PL,  PL,  PL,  PL,  PL],  // r0
  [FO,  MT,  MT,  PL,  PL,  PL,  PL,  PL,  PL,  PL,  SW,  FO,  PL,  PL,  PL,  PL,  PL,  PL,  PL,  PL,  HI,  PL],  // r1
  [FO,  MT,  HI,  PL,  PL,  PL,  PL,  PL,  PL,  SW,  SW,  FO,  FO,  PL,  PL,  PL,  PL,  PL,  HI,  HI,  PL,  PL],  // r2
  [FO,  FO,  HI,  PL,  PL,  PL,  PL,  PL,  SW,  LK,  SW,  FO,  FO,  FO,  PL,  PL,  HI,  HI,  HI,  HI,  MT,  PL],  // r3
  [FO,  FO,  FO,  PL,  PL,  PL,  PL,  SW,  SW,  LK,  LK,  FO,  FO,  PL,  PL,  LK,  HI,  HI,  HI,  MT,  MT,  HI],  // r4
  [FO,  FO,  PL,  PL,  PL,  PL,  PL,  SW,  SW,  LK,  SW,  FO,  PL,  PL,  LK,  HI,  HI,  HI,  MT,  MT,  HI,  HI],  // r5
  [FO,  FO,  PL,  PL,  PL,  PL,  PL,  PL,  SW,  SW,  SW,  PL,  PL,  LK,  HI,  HI,  HI,  HI,  HI,  MT,  MT,  HI],  // r6
  [FO,  PL,  PL,  PL,  PL,  PL,  PL,  PL,  PL,  SW,  SW,  PL,  PL,  HI,  HI,  HI,  HI,  HI,  HI,  MT,  MT,  MT],  // r7
]

const ROWS = GRID.length     // 8
const COLS = GRID[0].length  // 22

// ─── Offset → Axial ───────────────────────────────────────────────────────────
function offsetToAxial(col, row) {
  return { q: col - Math.floor(row / 2), r: row }
}

// ─── Regiones ─────────────────────────────────────────────────────────────────
function getRegion(col, row, terrain) {
  // Mountains & forests of the west
  if (col <= 2 && (terrain === MT || terrain === HI) && row <= 2) return 'Brantlend Mountains'
  if (col <= 2 && terrain === FO) return 'Thousand Voices'
  // Glenebon
  if (col >= 3 && col <= 7 && row <= 2) return 'Glenebon Uplands'
  if (col >= 3 && col <= 7 && row >= 3 && row <= 5) return 'Glenebon Lowlands'
  // Tiger Lords (northern plains, center)
  if (col >= 7 && col <= 10 && row <= 2 && terrain === PL) return 'Tiger Lords'
  // Hooktongue Slough (swamp/lake, center-left)
  if ((terrain === SW || terrain === LK) && col >= 7 && col <= 11) return 'Hooktongue Slough'
  // Narlmarches (forest, center)
  if (terrain === FO && col >= 10 && col <= 13) return 'Narlmarches'
  // Rostland Hinterlands (north plains, right half)
  if (col >= 10 && col <= 18 && row <= 1 && terrain === PL) return 'Rostland Hinterlands'
  // Greenbelt (center)
  if (col >= 10 && col <= 14 && row >= 2 && row <= 4 && terrain === PL) return 'Greenbelt'
  // Tuskwater (center lake and plains)
  if (terrain === LK && col >= 13 && col <= 15) return 'Lago Tuskwater'
  if (col >= 13 && col <= 16 && row >= 3 && row <= 6 && terrain === PL) return 'Tuskwater'
  // Kamelands (hills, south-center)
  if (terrain === HI && col >= 14 && col <= 18 && row >= 3 && row <= 5) return 'Kamelands'
  // Sellen Hills (hills, south)
  if (terrain === HI && col >= 13 && col <= 18 && row >= 6) return 'Sellen Hills'
  // Nomen Heights (east hills)
  if (terrain === HI && col >= 17 && col <= 20 && row <= 5) return 'Nomen Heights'
  // Dunsward (northeast plains)
  if (col >= 18 && col <= 21 && row <= 2 && terrain === PL) return 'Dunsward'
  // Tors de Levenies (east mountains)
  if (terrain === MT && col >= 19) return 'Tors de Levenies'
  return 'Tierras Robadas'
}

// ─── Ríos y caminos (path-based, auto-continuity) ────────────────────────────
// Edges pointy-top: 0=NE 1=E 2=SE 3=SW 4=W 5=NW
//
// Instead of manually assigning entry/exit edges (which breaks continuity),
// we define paths as sequences of [col, row] offset coordinates.
// getEdgeTo() computes which edge of hex A faces hex B, and each hex in the
// sequence gets path=[entry, exit] that precisely matches its neighbors.
// Because two adjacent hexes share a physical edge, the endpoint of the
// bezier in hex A (at the shared edge midpoint) equals the startpoint in hex B.

const OPPOSITE = [3, 4, 5, 0, 1, 2]  // edge i → opposite edge

function getEdgeTo(fromCol, fromRow, toCol, toRow) {
  const even = fromRow % 2 === 0
  const dc = toCol - fromCol
  const dr = toRow - fromRow
  if (dr ===  0 && dc ===  1) return 1  // E
  if (dr ===  0 && dc === -1) return 4  // W
  if (dr === -1) return (even ? dc === 0 : dc === 1) ? 0 : 5  // NE or NW
  if (dr ===  1) return (even ? dc === 0 : dc === 1) ? 2 : 3  // SE or SW
  throw new Error(`Non-adjacent hexes: (${fromCol},${fromRow})→(${toCol},${toRow})`)
}

function buildLinearFeatures(pathDefs) {
  const map = {}
  for (const { type, hexes } of pathDefs) {
    for (let i = 0; i < hexes.length; i++) {
      const [col, row] = hexes[i]
      let entryEdge, exitEdge
      if (hexes.length === 1) {
        entryEdge = 0; exitEdge = 3
      } else if (i === 0) {
        exitEdge  = getEdgeTo(col, row, hexes[1][0], hexes[1][1])
        entryEdge = OPPOSITE[exitEdge]
      } else if (i === hexes.length - 1) {
        entryEdge = getEdgeTo(col, row, hexes[i-1][0], hexes[i-1][1])
        exitEdge  = OPPOSITE[entryEdge]
      } else {
        entryEdge = getEdgeTo(col, row, hexes[i-1][0], hexes[i-1][1])
        exitEdge  = getEdgeTo(col, row, hexes[i+1][0], hexes[i+1][1])
      }
      const key = `${col},${row}`
      if (!map[key]) map[key] = []
      map[key].push({ type, path: [entryEdge, exitEdge] })
    }
  }
  return map
}

// Each river/road is a list of adjacent [col, row] offset coords (N→S / W→E).
// Adjacency is verified at build time; an error will throw if a step is wrong.
const LINEAR_PATHS = [
  // Shrike River — main river of the Greenbelt, flows south into Tuskwater Lake
  { type: 'river', hexes: [[12,0],[12,1],[12,2],[12,3],[13,4],[14,4],[15,4]] },

  // Thorn River — flows south through Narlmarches, confluences with Shrike at (12,3)
  { type: 'river', hexes: [[11,0],[11,1],[11,2],[11,3],[12,3]] },

  // Murque River — cuts south through Narlmarches into the Tuskwater south bay
  { type: 'river', hexes: [[10,2],[10,3],[11,4],[11,5],[12,6],[13,6]] },

  // Skunk River — flows west through Kamelands hills into Tuskwater
  { type: 'river', hexes: [[17,2],[16,3],[16,4],[15,4]] },

  // Sellen River — flows south along Nomen Heights toward Sellen Hills
  { type: 'river', hexes: [[18,1],[18,2],[17,3],[17,4],[17,5],[17,6],[17,7]] },

  // Old Road — main east-west road from Rostland south into the Stolen Lands
  { type: 'road', hexes: [[5,0],[6,0],[7,0],[8,0],[9,0],[10,0],[11,0],[12,0],[13,0],[14,0],[15,0],[16,0],[17,0]] },

  // South Road — branches from Old Road at (13,0), descends into the Greenbelt
  { type: 'road', hexes: [[13,0],[12,1],[12,2],[12,3],[12,4]] },
]

const LINEAR = buildLinearFeatures(LINEAR_PATHS)

// ─── Build hex array ──────────────────────────────────────────────────────────
function buildHexes() {
  const hexes = []
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const terrain = GRID[row][col]
      const { q, r } = offsetToAxial(col, row)
      hexes.push({
        q,
        r,
        terrain,
        region: getRegion(col, row, terrain),
        is_discovered: false,
        is_explored: false,
        point_features: [],
        linear_features: LINEAR[`${col},${row}`] ?? [],
      })
    }
  }
  return hexes
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const [email, password] = process.argv.slice(2)
  if (!email || !password) {
    console.error('Usage: node scripts/seed-stolen-lands.mjs <gm_email> <gm_password>')
    process.exit(1)
  }

  // 1. Login
  process.stdout.write('Logging in... ')
  const loginRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!loginRes.ok) {
    console.error('\nError en login:', await loginRes.text())
    process.exit(1)
  }
  const { access_token } = await loginRes.json()
  console.log('✓')

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${access_token}`,
  }

  // 2. Delete existing map(s) named "Tierras Robadas"
  process.stdout.write('Verificando mapas existentes... ')
  const mapsRes = await fetch(`${API}/maps`, { headers })
  if (mapsRes.ok) {
    const maps = await mapsRes.json()
    const existing = maps.filter(m => m.name === 'Tierras Robadas')
    if (existing.length > 0) {
      console.log(`encontrado(s): ${existing.length}`)
      for (const m of existing) {
        process.stdout.write(`  Eliminando mapa ${m._id}... `)
        const delRes = await fetch(`${API}/maps/${m._id}`, { method: 'DELETE', headers })
        console.log(delRes.ok ? '✓' : `⚠ ${delRes.status}`)
      }
    } else {
      console.log('ninguno previo')
    }
  } else {
    console.log('(no se pudo verificar, continuando)')
  }

  // 3. Create map
  process.stdout.write('Creando mapa... ')
  const mapRes = await fetch(`${API}/maps`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'Tierras Robadas',
      hex_config: {
        hex_size_px: 64,
        cols: COLS,
        rows: ROWS,
        hex_size_miles: 12,
        travel_hours_per_day: 8,
        party_speed_ft: 25,
      },
      is_public: true,
    }),
  })
  if (!mapRes.ok) {
    console.error('\nError creando mapa:', await mapRes.text())
    process.exit(1)
  }
  const map = await mapRes.json()
  console.log(`✓  (id: ${map._id})`)

  // 4. Bulk import hexes
  const hexes = buildHexes()
  process.stdout.write(`Importando ${hexes.length} hexes (${COLS}×${ROWS})... `)
  const importRes = await fetch(`${API}/maps/${map._id}/hexes/import`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ hexes }),
  })
  if (!importRes.ok) {
    console.error('\nError en import:', await importRes.text())
    process.exit(1)
  }
  const { inserted, updated } = await importRes.json()
  console.log(`✓  (${inserted} insertados, ${updated} actualizados)`)

  console.log('\n✓ Seed completo.')
  console.log(`  Mapa ID : ${map._id}`)
  console.log(`  Grid    : ${COLS} cols × ${ROWS} rows = ${hexes.length} hexes`)
  console.log(`  Escala  : 12 millas/hex`)
  console.log('')
  console.log('  Regiones:')
  const regionCounts = {}
  hexes.forEach(h => { regionCounts[h.region] = (regionCounts[h.region] ?? 0) + 1 })
  Object.entries(regionCounts).sort(([,a],[,b]) => b-a).forEach(([r, n]) => {
    console.log(`    ${n.toString().padStart(3)} hexes — ${r}`)
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
