#!/usr/bin/env node
/**
 * map-visibility.mjs — toggle discovery state of all hexes in bulk
 *
 * Usage:
 *   node scripts/map-visibility.mjs discover <email> <password>
 *   node scripts/map-visibility.mjs reset    <email> <password>
 *
 *   discover → is_discovered: true,  is_explored: false  (terrain visible, no POIs)
 *   reset    → is_discovered: false, is_explored: false  (all dark)
 */

const API = 'https://kmlogapi-production.up.railway.app/api'
const BATCH = 20  // parallel requests per batch

const [mode, email, password] = process.argv.slice(2)

if (!['discover', 'reset'].includes(mode) || !email || !password) {
  console.error('Usage:')
  console.error('  node scripts/map-visibility.mjs discover <email> <password>')
  console.error('  node scripts/map-visibility.mjs reset    <email> <password>')
  process.exit(1)
}

const patch =
  mode === 'discover'
    ? { is_discovered: true,  is_explored: false }
    : { is_discovered: false, is_explored: false }

// ─── Login ────────────────────────────────────────────────────────────────────
process.stdout.write('Logging in... ')
const loginRes = await fetch(`${API}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
})
if (!loginRes.ok) { console.error('\nLogin failed:', await loginRes.text()); process.exit(1) }
const { access_token } = await loginRes.json()
console.log('✓')

const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${access_token}` }

// ─── Get first map ────────────────────────────────────────────────────────────
process.stdout.write('Fetching map... ')
const mapsRes = await fetch(`${API}/maps`, { headers })
if (!mapsRes.ok) { console.error('\nFailed to fetch maps'); process.exit(1) }
const maps = await mapsRes.json()
if (maps.length === 0) { console.error('\nNo maps found'); process.exit(1) }
const map = maps[0]
console.log(`✓  (${map.name})`)

// ─── Get all hexes ────────────────────────────────────────────────────────────
process.stdout.write('Fetching hexes... ')
const hexesRes = await fetch(`${API}/maps/${map._id}/hexes`, { headers })
if (!hexesRes.ok) { console.error('\nFailed to fetch hexes'); process.exit(1) }
const hexes = await hexesRes.json()
console.log(`✓  (${hexes.length} hexes)`)

// ─── Patch in batches ─────────────────────────────────────────────────────────
const label = mode === 'discover' ? 'Marcando como descubiertos' : 'Reseteando a no descubiertos'
process.stdout.write(`${label}... `)

let done = 0
let errors = 0

for (let i = 0; i < hexes.length; i += BATCH) {
  const batch = hexes.slice(i, i + BATCH)
  const results = await Promise.all(
    batch.map(h =>
      fetch(`${API}/maps/${map._id}/hexes/${h._id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(patch),
      }).then(r => r.ok ? null : r.status)
    )
  )
  done  += results.filter(r => r === null).length
  errors += results.filter(r => r !== null).length
  process.stdout.write(`\r${label}... ${done}/${hexes.length}`)
}

console.log(errors === 0 ? '  ✓' : `  ⚠ ${errors} errores`)

console.log(`\n✓ Listo — modo: ${mode.toUpperCase()}`)
if (mode === 'discover') {
  console.log('  Todos los hexes están descubiertos (terreno visible, sin POIs).')
  console.log('  Tip: para explorar todo, cambiá is_explored manualmente o usá el panel.')
} else {
  console.log('  Todos los hexes están en negro (sin descubrir).')
}
