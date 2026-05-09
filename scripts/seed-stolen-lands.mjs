#!/usr/bin/env node
/**
 * seed-stolen-lands.mjs
 * Seeds the Stolen Lands hex map into KMLog from the Pathfinder Kingmaker map.
 *
 * Usage: node scripts/seed-stolen-lands.mjs <gm_email> <gm_password>
 *
 * Grid: 14 cols × 16 rows — 1 hex = 12 miles
 * Layout:
 *   NW (q0-6,  r0-7)  → Tors de Levenies (montañas) + comienzo de Narlmarches
 *   NE (q7-13, r0-7)  → Pantano Hooktongue Slough
 *   SW (q0-6,  r8-15) → Narlmarches (bosque denso) + Lago Tuskwater/Candlemere
 *   SE (q7-13, r8-15) → Kamelands (planicies + montañas rocosas)
 */

const API = 'https://kmlogapi-production.up.railway.app/api'

// ─── Terrain shorthand ────────────────────────────────────────────────────────
const PL = 'plains'
const HI = 'hills'
const MT = 'mountains'
const FO = 'forest'
const SW = 'swamp'
const LK = 'lake'

// ─── Terrain grid [r][q] — r=0 norte, q=0 oeste ──────────────────────────────
//         q0   q1   q2   q3   q4   q5   q6     q7   q8   q9   q10  q11  q12  q13
const GRID = [
  [ HI,  PL,  PL,  PL,  PL,  PL,  PL,   PL,  PL,  PL,  PL,  PL,  PL,  PL ],  // r=0
  [ MT,  HI,  PL,  PL,  PL,  PL,  PL,   PL,  PL,  PL,  PL,  PL,  PL,  PL ],  // r=1
  [ MT,  MT,  HI,  PL,  PL,  PL,  PL,   PL,  PL,  PL,  PL,  PL,  PL,  PL ],  // r=2
  [ MT,  MT,  PL,  PL,  PL,  PL,  PL,   PL,  PL,  SW,  SW,  LK,  LK,  PL ],  // r=3
  [ MT,  MT,  PL,  PL,  PL,  PL,  PL,   PL,  SW,  LK,  LK,  LK,  SW,  PL ],  // r=4
  [ MT,  FO,  FO,  PL,  PL,  PL,  PL,   PL,  SW,  LK,  LK,  LK,  SW,  FO ],  // r=5
  [ FO,  FO,  FO,  PL,  PL,  PL,  LK,   PL,  SW,  SW,  SW,  SW,  SW,  FO ],  // r=6
  [ FO,  FO,  PL,  PL,  PL,  PL,  PL,   PL,  PL,  SW,  SW,  SW,  SW,  PL ],  // r=7
  [ FO,  FO,  FO,  PL,  PL,  PL,  PL,   PL,  PL,  SW,  SW,  PL,  PL,  PL ],  // r=8
  [ FO,  FO,  FO,  FO,  FO,  PL,  PL,   PL,  PL,  PL,  PL,  PL,  PL,  PL ],  // r=9
  [ FO,  FO,  FO,  FO,  FO,  FO,  PL,   PL,  MT,  PL,  PL,  PL,  PL,  PL ],  // r=10
  [ FO,  FO,  FO,  FO,  FO,  PL,  PL,   PL,  MT,  MT,  PL,  PL,  PL,  PL ],  // r=11
  [ FO,  FO,  FO,  FO,  LK,  LK,  PL,   LK,  MT,  MT,  PL,  PL,  PL,  PL ],  // r=12
  [ FO,  FO,  FO,  FO,  LK,  PL,  PL,   LK,  PL,  PL,  PL,  PL,  PL,  PL ],  // r=13
  [ FO,  FO,  FO,  PL,  PL,  PL,  PL,   PL,  PL,  MT,  MT,  PL,  PL,  PL ],  // r=14
  [ FO,  FO,  PL,  PL,  PL,  PL,  PL,   PL,  PL,  PL,  MT,  MT,  PL,  PL ],  // r=15
]

// ─── Regiones ─────────────────────────────────────────────────────────────────
function getRegion(q, r, terrain) {
  if ((terrain === MT || terrain === HI) && q <= 2) return 'Tors de Levenies'
  if (terrain === MT && q >= 7) return 'Kamelands'
  if (terrain === FO) return 'Narlmarches'
  if (terrain === SW) return 'Pantano Hooktongue'
  if (terrain === LK && r <= 7 && q >= 7) return 'Pantano Hooktongue'
  if (terrain === LK && q === 6 && r === 6) return 'Lago del Aguijón'
  if (terrain === LK && r >= 12 && q >= 4 && q <= 6) return 'Lago Tuskwater'
  if (terrain === LK && r >= 12 && q === 7) return 'Lago Candlemere'
  if (q >= 8) return 'Kamelands'
  return 'Tierras Robadas'
}

// ─── Ríos y caminos ───────────────────────────────────────────────────────────
// Edges pointy-top: 0=NE 1=E 2=SE 3=SW 4=W 5=NW
// path: [edge_entrada, edge_salida]
const LINEAR = {
  // Shrike River (Río Aguijón) — nace en las montañas, fluye al sur
  '2,2': [{ type: 'river', path: [5, 3] }],
  '3,3': [{ type: 'river', path: [5, 3] }],
  '3,4': [{ type: 'river', path: [5, 2] }],
  '4,5': [{ type: 'river', path: [5, 3] }],
  '4,6': [{ type: 'river', path: [5, 3] }],
  '4,7': [{ type: 'river', path: [5, 3] }],
  '4,8': [{ type: 'river', path: [5, 2] }],
  '5,9': [{ type: 'river', path: [5, 2] }],
  '6,10': [{ type: 'river', path: [5, 3] }],
  '6,11': [{ type: 'river', path: [5, 3] }],
  // Thorn River (Río Espino) — tributario NE, desemboca en Hooktongue
  '8,1': [{ type: 'river', path: [5, 3] }],
  '8,2': [{ type: 'river', path: [5, 3] }],
  '9,3': [{ type: 'river', path: [5, 3] }],
  // Murque River — atraviesa Narlmarches hacia el sur
  '2,9':  [{ type: 'river', path: [0, 3] }],
  '2,10': [{ type: 'river', path: [0, 3] }],
  '3,11': [{ type: 'river', path: [5, 3] }],
  '3,12': [{ type: 'river', path: [5, 2] }],
  // SE river — hacia Kamelands
  '8,9':  [{ type: 'river', path: [5, 3] }],
  '7,10': [{ type: 'river', path: [0, 3] }],
  '7,11': [{ type: 'river', path: [0, 3] }],
  '7,12': [{ type: 'river', path: [0, 2] }],
  '8,13': [{ type: 'river', path: [5, 3] }],
  // Old Road (Camino del Sur) — E-O en el norte
  '2,1':  [{ type: 'road', path: [4, 1] }],
  '3,1':  [{ type: 'road', path: [4, 1] }],
  '4,1':  [{ type: 'road', path: [4, 1] }],
  '5,1':  [{ type: 'road', path: [4, 1] }],
  '6,1':  [{ type: 'road', path: [4, 1] }],
  '7,1':  [{ type: 'road', path: [4, 1] }],
  '8,0':  [{ type: 'road', path: [4, 1] }],
  '9,0':  [{ type: 'road', path: [4, 1] }],
  '10,0': [{ type: 'road', path: [4, 1] }],
  '11,0': [{ type: 'road', path: [4, 1] }],
}

// ─── Build hex array ──────────────────────────────────────────────────────────
function buildHexes() {
  const hexes = []
  for (let r = 0; r < 16; r++) {
    for (let q = 0; q < 14; q++) {
      const terrain = GRID[r][q]
      hexes.push({
        q,
        r,
        terrain,
        region: getRegion(q, r, terrain),
        is_explored: false,
        point_features: [],
        linear_features: LINEAR[`${q},${r}`] ?? [],
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

  // 2. Create map
  process.stdout.write('Creando mapa... ')
  const mapRes = await fetch(`${API}/maps`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'Tierras Robadas',
      hex_config: {
        hex_size_px: 64,
        cols: 14,
        rows: 16,
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

  // 3. Bulk import hexes
  const hexes = buildHexes()
  process.stdout.write(`Importando ${hexes.length} hexes... `)
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

  console.log('\n✓ Seed completo. El mapa está listo en KMLog.')
  console.log(`  Mapa ID: ${map._id}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
