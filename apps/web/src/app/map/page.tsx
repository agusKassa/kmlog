import Link from 'next/link'
import { api } from '@/lib/api'
import { EmptyState } from '../_components/empty-state'
import { MapView } from './_components/map-view'

export default async function MapPage() {
  const maps = await api.maps.findAll()

  if (!maps || maps.length === 0) {
    return (
      <main>
        <section
          className="relative overflow-hidden border-b border-[#3c3330]/40 px-6 pb-10 pt-12"
          style={{ background: 'radial-gradient(ellipse 80% 100% at 50% -10%, #120d06 0%, #0c0a09 65%)' }}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(rgba(245,158,11,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.025) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
          <div className="relative mx-auto max-w-7xl">
            <div className="mb-2 flex items-center gap-2 text-[0.68rem] font-medium uppercase tracking-[0.22em] text-amber-600">
              <Link href="/" className="transition-colors hover:text-amber-400">Inicio</Link>
              <span className="text-stone-700">/</span>
              <span>Mapa</span>
            </div>
            <h1 className="font-display text-[clamp(1.6rem,3.5vw,2.6rem)] font-bold leading-tight tracking-[0.06em] text-stone-50">
              Mapa de la Campaña
            </h1>
          </div>
        </section>
        <div className="mx-auto max-w-4xl px-6 py-20">
          <EmptyState
            icon="🗺️"
            title="Sin mapas disponibles"
            description="El GM aún no ha publicado ningún mapa de la campaña."
          />
        </div>
      </main>
    )
  }

  const map = maps[0]

  const [hexes, locations, sessions, npcs] = await Promise.all([
    api.hexes.findByMap(map._id),
    api.locations.findAll(),
    api.sessions.findAll(),
    api.npcs.findAll(),
  ])

  const exploredCount = hexes?.filter(h => h.is_explored).length ?? 0

  return (
    <main className="flex flex-col" style={{ height: 'calc(100vh - 60px)' }}>
      {/* Hero — compact */}
      <section
        className="relative shrink-0 overflow-hidden border-b border-[#3c3330]/40 px-6 py-4"
        style={{ background: 'radial-gradient(ellipse 60% 300% at 10% 50%, #120d06 0%, #0c0a09 55%)' }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(245,158,11,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.02) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <div className="mb-0.5 flex items-center gap-2 text-[0.65rem] font-medium uppercase tracking-[0.22em] text-amber-600">
              <Link href="/" className="transition-colors hover:text-amber-400">Inicio</Link>
              <span className="text-stone-700">/</span>
              <span>Mapa</span>
            </div>
            <h1 className="font-display text-[1.3rem] font-bold leading-tight tracking-[0.06em] text-stone-50">
              {map.name}
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-6">
            {[
              { val: exploredCount,          lbl: 'Explorados',   gold: exploredCount > 0 },
              { val: locations?.length ?? 0, lbl: 'Lugares' },
              { val: `${map.hex_config.hex_size_miles} mi`, lbl: 'por hex' },
            ].map(({ val, lbl, gold }) => (
              <div key={lbl} className="text-right">
                <div className={`font-display text-[1.1rem] font-bold leading-none ${gold ? 'text-amber-500' : 'text-stone-200'}`}>
                  {val}
                </div>
                <div className="mt-0.5 text-[0.58rem] uppercase tracking-[0.12em] text-stone-600">{lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive map — fills remaining viewport */}
      <MapView
        map={map}
        hexes={hexes ?? []}
        locations={locations ?? []}
        sessions={sessions ?? []}
        npcs={npcs ?? []}
      />
    </main>
  )
}
