import Link from 'next/link'
import { api, formatDate, type ApiSession, type ApiCharacter, type ApiPartyState } from '@/lib/api'
import { EmptyState } from './_components/empty-state'
import { EventsCarousel } from './_components/events-carousel'
import { MapPreview } from './_components/map-preview'

// ── Status helpers ─────────────────────────────────────────────────────────

const statusStyles: Record<string, string> = {
  published: 'bg-green-500/8 text-green-300 border border-green-500/20',
  played:    'bg-orange-500/8 text-orange-300 border border-orange-500/20',
  draft:     'bg-stone-500/8 text-stone-500 border border-stone-700/40',
}
const statusLabel: Record<string, string> = {
  published: 'Publicada', played: 'Jugada', draft: 'Borrador',
}

// Character accent colors cycling by index
const charAccents = [
  { bg: 'from-amber-950 to-stone-900', ring: 'text-amber-400 border-amber-500/40 bg-amber-500/10', bar: 'from-amber-500 to-amber-400' },
  { bg: 'from-sky-950 to-stone-900',   ring: 'text-sky-400 border-sky-500/40 bg-sky-500/10',       bar: 'from-sky-500 to-sky-400' },
  { bg: 'from-emerald-950 to-stone-900', ring: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10', bar: 'from-emerald-500 to-emerald-400' },
  { bg: 'from-rose-950 to-stone-900',  ring: 'text-rose-400 border-rose-500/40 bg-rose-500/10',    bar: 'from-rose-500 to-rose-400' },
]

// ── Sub-components ─────────────────────────────────────────────────────────

function SessionsList({ sessions }: { sessions: ApiSession[] }) {
  if (sessions.length === 0) {
    return (
      <EmptyState
        icon="📜"
        title="Sin sesiones aún"
        description="Las crónicas comenzarán cuando el GM publique la primera sesión."
      />
    )
  }

  return (
    <div className="flex flex-col">
      {sessions.map((s, i) => (
        <div
          key={s._id}
          className="grid gap-0"
          style={{ gridTemplateColumns: '52px 1fr', animation: `fade-in-left 0.4s ease both ${i * 0.06}s` }}
        >
          <div className="flex flex-col items-center pt-0.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-amber-500/20 bg-amber-500/8 font-display text-[0.88rem] font-bold text-amber-500">
              #{s.session_number}
            </div>
            {i < sessions.length - 1 && <div className="my-1.5 min-h-4 w-px flex-1 bg-[#2a2826]" />}
          </div>

          <div className={`pl-2 ${i < sessions.length - 1 ? 'pb-7' : ''}`}>
            <div className="mb-1.5 flex items-start justify-between gap-3">
              <Link
                href={`/sessions/${s._id}`}
                className="font-display text-[0.95rem] font-semibold leading-tight tracking-[0.04em] text-stone-100 transition-colors hover:text-amber-400"
              >
                {s.title}
              </Link>
              <span className={`shrink-0 rounded px-2 py-0.5 text-[0.62rem] font-medium uppercase tracking-[0.1em] ${statusStyles[s.status]}`}>
                {statusLabel[s.status]}
              </span>
            </div>

            <div className="mb-2.5 flex items-center gap-2 text-[0.73rem] text-stone-600">
              <span>{formatDate(s.date_played)}</span>
              {s.attendees.length > 0 && (
                <>
                  <span>·</span>
                  <span>{s.attendees.length} asistente{s.attendees.length !== 1 ? 's' : ''}</span>
                </>
              )}
            </div>

            {s.summary ? (
              <p className="font-body mb-3 line-clamp-2 text-[0.98rem] leading-[1.65] text-stone-400">
                {s.summary}
              </p>
            ) : (
              <p className="font-body mb-3 text-[0.88rem] italic text-stone-700">
                Sin resumen disponible.
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function PartyWidget({ state }: { state: ApiPartyState | null }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#2a2826] bg-[#181412]">
      <div className="flex items-center justify-between border-b border-[#2a2826] px-4 py-3">
        <span className="font-display text-[0.62rem] font-semibold uppercase tracking-[0.25em] text-stone-600">
          Estado de la Party
        </span>
        <Link href="/party" className="text-[0.7rem] text-stone-600 hover:text-amber-500">
          Ver →
        </Link>
      </div>

      <div className="p-4">
        {!state || !state.current_content ? (
          <p className="font-body text-center text-[0.9rem] italic text-stone-700 py-4">
            El GM aún no ha registrado el estado del grupo.
          </p>
        ) : (
          <>
            <p className="font-body text-[0.95rem] leading-relaxed text-stone-400 line-clamp-6">
              {state.current_content}
            </p>
            {state.updated_at && (
              <div className="mt-3 text-[0.65rem] uppercase tracking-[0.1em] text-stone-700">
                Actualizado {formatDate(state.updated_at)}
              </div>
            )}
            <Link
              href="/party"
              className="mt-3 block text-[0.75rem] font-medium text-amber-500 hover:opacity-80 transition-opacity"
            >
              Ver estado completo →
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

function CharacterStrip({ characters }: { characters: ApiCharacter[] }) {
  const partyMembers = characters.filter(c => c.in_party !== false)

  if (partyMembers.length === 0) {
    return (
      <EmptyState
        icon="⚔️"
        title="Sin personajes registrados"
        description="Los jugadores aún no han importado sus personajes desde Pathbuilder."
      />
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {partyMembers.map((c, i) => {
        const accent = charAccents[i % charAccents.length]
        const initial = c.build.name.charAt(0).toUpperCase()
        const playerName = typeof c.user_id === 'object' ? c.user_id.username : '—'
        const isDead = c.is_alive === false

        return (
          <Link
            key={c._id}
            href={`/characters/${c._id}`}
            className="group overflow-hidden rounded-xl border border-[#2a2826] bg-[#181412] transition-all hover:-translate-y-0.5 hover:border-amber-500/25 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
            style={{ animation: `fade-in-left 0.5s ease both ${0.4 + i * 0.06}s` }}
          >
            <div className={`relative aspect-[4/3] overflow-hidden bg-gradient-to-br ${accent.bg}`}>
              {c.portrait_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.portrait_url}
                  alt={c.build.name}
                  className={`h-full w-full object-cover object-top transition-all ${isDead ? 'grayscale' : ''}`}
                />
              ) : (
                <div className={`flex h-full w-full items-center justify-center ${isDead ? 'grayscale' : ''}`}>
                  <div className={`flex h-14 w-14 items-center justify-center rounded-full border-2 font-display text-[1.3rem] font-bold ${accent.ring}`}>
                    {initial}
                  </div>
                </div>
              )}
              {isDead && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <span className="rounded border border-stone-500/40 bg-stone-900/80 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.15em] text-stone-400">
                    Muerto
                  </span>
                </div>
              )}
            </div>

            <div className="p-3">
              <div className={`font-display mb-0.5 truncate text-[0.82rem] font-semibold tracking-[0.04em] transition-colors group-hover:text-amber-400 ${isDead ? 'text-stone-500' : 'text-stone-100'}`}>
                {c.build.name}
              </div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[0.68rem] text-stone-600">
                  {c.build.class} · {c.build.ancestry}
                </span>
                <span className="font-display rounded border border-amber-500/15 bg-amber-500/8 px-1.5 py-0.5 text-[0.6rem] tracking-[0.08em] text-amber-500">
                  NV {c.build.level}
                </span>
              </div>
              <div className="text-[0.64rem] text-stone-600">{playerName}</div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const [sessions, characters, partyState, recentEvents, maps] = await Promise.all([
    api.sessions.findAll(),
    api.characters.findAll(),
    api.partyState.get(),
    api.events.recent(5),
    api.maps.findAll(),
  ])

  const mapData  = maps?.[0] ?? null
  const mapHexes = mapData ? (await api.hexes.findByMap(mapData._id)) ?? [] : []

  const publishedCount = sessions?.filter(s => s.status === 'published').length ?? 0

  return (
    <main>
      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden border-b border-[#3c3330]/40 px-6 pb-8 pt-10"
        style={{ background: 'radial-gradient(ellipse 80% 120% at 50% -10%, #1f150a 0%, #0c0a09 60%)' }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(rgba(245,158,11,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.03) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="relative mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-6">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-amber-500">
              <span className="h-px w-5 bg-amber-500/60" />
              Campaña activa — Temporada I
            </div>
            <h1 className="font-display mb-3 text-[clamp(1.8rem,4vw,3rem)] font-bold leading-[1.1] tracking-[0.05em] text-stone-50" style={{ textShadow: '0 0 40px rgba(245,158,11,0.12)' }}>
              King Maker Chronicles
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.78rem] text-stone-500">
              <span className="flex items-center gap-1.5">
                <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/></svg>
                Pathfinder 2e Remaster
              </span>
            </div>
          </div>

          <div className="flex gap-6">
            {[
              { val: String(sessions?.length ?? '—'), lbl: 'Sesiones' },
              { val: String(characters?.length ?? '—'), lbl: 'Personajes' },
              { val: String(publishedCount), lbl: 'Publicadas', gold: true },
            ].map(({ val, lbl, gold }) => (
              <div key={lbl} className="flex flex-col items-end">
                <div className={`font-display text-[1.6rem] font-bold leading-none tracking-[0.04em] ${gold ? 'text-amber-500' : 'text-stone-50'}`}>
                  {val}
                </div>
                <div className="mt-1 text-[0.65rem] uppercase tracking-[0.15em] text-stone-600">{lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MAIN GRID ── */}
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[1fr_300px]">

        {/* Sessions */}
        <div>
          <div className="mb-6 flex items-baseline justify-between">
            <span className="font-display text-[0.72rem] font-semibold uppercase tracking-[0.25em] text-stone-500">
              Última sesión
            </span>
            {sessions && sessions.length > 0 && (
              <Link href="/sessions" className="text-[0.75rem] font-medium text-amber-500 transition-colors hover:text-amber-400">
                Ver todas →
              </Link>
            )}
          </div>

          {!sessions ? (
            <EmptyState
              icon="⚠️"
              title="Error al cargar sesiones"
              description="No se pudo conectar con el servidor. Intentá recargar la página."
            />
          ) : (
            <SessionsList sessions={sessions.slice(0, 1)} />
          )}
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-[76px] lg:self-start">
          <PartyWidget state={partyState} />

          {/* Recent events carousel */}
          {recentEvents && recentEvents.length > 0 && (
            <div>
              <div className="mb-3 flex items-baseline justify-between px-0.5">
                <span className="font-display text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-stone-600">
                  Eventos recientes
                </span>
                <span className="text-[0.6rem] text-stone-700">{recentEvents.length} más recientes</span>
              </div>
              <EventsCarousel events={recentEvents} />
            </div>
          )}
        </aside>
      </div>

      {/* ── MAP PREVIEW ── */}
      {mapData && <MapPreview map={mapData} hexes={mapHexes} />}

      {/* ── CHARACTERS STRIP ── */}
      <section
        className="border-t border-[#2a2826] px-6 py-10"
        style={{ background: 'radial-gradient(ellipse 60% 80% at 50% 100%, #141008 0%, #0c0a09 70%)' }}
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-baseline justify-between">
            <span className="font-display text-[0.72rem] font-semibold uppercase tracking-[0.25em] text-stone-500">
              La Party
            </span>
            {characters && characters.length > 0 && (
              <Link href="/characters" className="text-[0.75rem] font-medium text-amber-500 transition-colors hover:text-amber-400">
                Ver todos los personajes →
              </Link>
            )}
          </div>

          {!characters ? (
            <EmptyState
              icon="⚠️"
              title="Error al cargar personajes"
              description="No se pudo conectar con el servidor. Intentá recargar la página."
            />
          ) : (
            <CharacterStrip characters={characters} />
          )}
        </div>
      </section>
    </main>
  )
}
