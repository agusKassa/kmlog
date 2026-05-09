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

// ─── Ríos y caminos ───────────────────────────────────────────────────────────
// Edges (pointy-top): 0=NE 1=E 2=SE 3=SW 4=W 5=NW
// Keys are "col,row" in OFFSET coords
const LINEAR = {
  // Shrike River — flows south through Greenbelt toward Tuskwater
  '12,1': [{ type: 'river', path: [0, 3] }],
  '12,2': [{ type: 'river', path: [0, 3] }],
  '12,3': [{ type: 'river', path: [0, 2] }],
  '13,4': [{ type: 'river', path: [5, 2] }],
  // Thorn River — flows through upper Narlmarches
  '11,2': [{ type: 'river', path: [0, 3] }],
  '11,3': [{ type: 'river', path: [0, 3] }],
  // Murque River — through Narlmarches south
  '11,4': [{ type: 'river', path: [0, 3] }],
  '11,5': [{ type: 'river', path: [0, 3] }],
  // Skunk River — through Kamelands to Tuskwater
  '16,3': [{ type: 'river', path: [5, 3] }],
  '16,4': [{ type: 'river', path: [5, 3] }],
  '15,5': [{ type: 'river', path: [5, 3] }],
  // Sellen River — along Nomen Heights
  '18,3': [{ type: 'river', path: [5, 3] }],
  '18,4': [{ type: 'river', path: [5, 3] }],
  '17,5': [{ type: 'river', path: [5, 3] }],
  '17,6': [{ type: 'river', path: [5, 3] }],
  // Old Road — east-west through center
  '5,1':  [{ type: 'road', path: [4, 1] }],
  '6,1':  [{ type: 'road', path: [4, 1] }],
  '7,1':  [{ type: 'road', path: [4, 1] }],
  '8,1':  [{ type: 'road', path: [4, 1] }],
  '9,1':  [{ type: 'road', path: [4, 1] }],
  '10,1': [{ type: 'road', path: [4, 1] }],
  '11,1': [{ type: 'road', path: [4, 1] }],
  '12,0': [{ type: 'road', path: [4, 1] }],
  '13,0': [{ type: 'road', path: [4, 1] }],
}

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
