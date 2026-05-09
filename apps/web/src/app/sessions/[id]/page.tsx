import Link from 'next/link'
import { notFound } from 'next/navigation'
import { api, formatDate, type ApiEvent } from '@/lib/api'

const statusStyles: Record<string, string> = {
  published: 'bg-green-500/8 text-green-300 border border-green-500/20',
  played:    'bg-orange-500/8 text-orange-300 border border-orange-500/20',
  draft:     'bg-stone-500/8 text-stone-500 border border-stone-700/40',
}
const statusLabel: Record<string, string> = {
  published: 'Publicada', played: 'Jugada', draft: 'Borrador',
}

const DIFFICULTY_COLOR: Record<string, string> = {
  trivial:    'text-stone-500  border-stone-700/40  bg-stone-500/8',
  low:        'text-sky-400    border-sky-500/25    bg-sky-500/8',
  moderate:   'text-amber-400  border-amber-500/25  bg-amber-500/8',
  severe:     'text-orange-400 border-orange-500/25 bg-orange-500/8',
  extreme:    'text-rose-400   border-rose-500/25   bg-rose-500/8',
}

function EventCard({ event, index }: { event: ApiEvent; index: number }) {
  const isEncounter = event.kind === 'encounter'
  const approvedXp  = event.xp_entries.filter(x => x.status === 'approved')
  const totalXp     = approvedXp.reduce((s, x) => s + x.amount, 0)
  const unclaimedLoot = event.loot.filter(l => l.status !== 'claimed' && l.status !== 'party')
  const lootValue   = event.loot.reduce((s, l) => s + l.value_gp * l.quantity, 0)

  return (
    <div
      className="rounded-xl border border-[#2a2826] bg-[#181412] px-5 py-4"
      style={{ animation: `fade-up 0.4s ease both ${0.05 * index}s` }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className={`rounded border px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-[0.1em] ${
              isEncounter
                ? 'border-rose-500/25 bg-rose-500/8 text-rose-400'
                : 'border-sky-500/25 bg-sky-500/8 text-sky-400'
            }`}>
              {isEncounter ? 'Encuentro' : 'Evento'}
            </span>
            {event.difficulty && (
              <span className={`rounded border px-2 py-0.5 text-[0.58rem] font-medium uppercase tracking-[0.1em] ${
                DIFFICULTY_COLOR[event.difficulty] ?? DIFFICULTY_COLOR.moderate
              }`}>
                {event.difficulty}
              </span>
            )}
            {event.event_type && (
              <span className="text-[0.65rem] text-stone-600">{event.event_type}</span>
            )}
          </div>

          <h3 className="font-display text-[0.95rem] font-semibold tracking-[0.04em] text-stone-100">
            {event.title}
          </h3>
          {event.description && (
            <p className="mt-1.5 text-[0.84rem] leading-relaxed text-stone-400 line-clamp-3">
              {event.description}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5 text-right">
          {totalXp > 0 && (
            <div className="flex items-baseline gap-1">
              <span className="font-display text-[1.1rem] font-bold leading-none text-amber-400">{totalXp}</span>
              <span className="text-[0.58rem] uppercase tracking-[0.1em] text-stone-600">XP</span>
            </div>
          )}
          {lootValue > 0 && (
            <div className="flex items-baseline gap-1">
              <span className="font-display text-[0.85rem] font-semibold leading-none text-amber-600/70">
                {lootValue} gp
              </span>
              {unclaimedLoot.length > 0 && (
                <span className="text-[0.58rem] text-stone-600">loot</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* XP entries */}
      {approvedXp.length > 0 && (
        <div className="mt-3 border-t border-[#2a2826] pt-3">
          <div className="flex flex-wrap gap-2">
            {approvedXp.map(xp => (
              <div key={xp._id} className="flex items-center gap-1.5 rounded-lg border border-[#2a2826] bg-[#0e0c0b] px-2.5 py-1">
                <span className="font-display text-[0.75rem] font-bold text-amber-400">{xp.amount}</span>
                <span className="text-[0.58rem] text-stone-600">XP</span>
                <span className="text-[0.72rem] text-stone-500">{xp.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loot pills */}
      {event.loot.length > 0 && (
        <div className="mt-3 border-t border-[#2a2826] pt-3">
          <div className="flex flex-wrap gap-2">
            {event.loot.map(item => (
              <div key={item._id} className="flex items-center gap-1.5 rounded-lg border border-[#2a2826] bg-[#0e0c0b] px-2.5 py-1">
                <span className="text-[0.72rem] text-stone-400">{item.name}</span>
                {item.quantity > 1 && (
                  <span className="text-[0.65rem] text-stone-600">×{item.quantity}</span>
                )}
                {item.value_gp > 0 && (
                  <span className="text-[0.62rem] text-amber-600/60">{item.value_gp} gp</span>
                )}
                <span className={`text-[0.58rem] font-medium ${
                  item.status === 'unclaimed' ? 'text-stone-600'
                  : item.status === 'party'   ? 'text-sky-500'
                  : 'text-emerald-500'
                }`}>
                  {item.status === 'unclaimed' ? '◌' : item.status === 'party' ? '⚔' : '✓'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Decorative divider
function Divider() {
  return (
    <div className="flex items-center gap-4 py-1">
      <div className="h-px flex-1 bg-[#2a2826]" />
      <div className="h-1 w-1 rotate-45 bg-amber-500/40" />
      <div className="h-px flex-1 bg-[#2a2826]" />
    </div>
  )
}

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [session, allSessions, events] = await Promise.all([
    api.sessions.findById(id),
    api.sessions.findAll(),
    api.events.findBySession(id),
  ])

  if (!session) notFound()

  // Adjacent sessions for prev/next navigation
  const sorted  = (allSessions ?? []).sort((a, b) => a.session_number - b.session_number)
  const idx     = sorted.findIndex(s => s._id === id)
  const prev    = idx > 0 ? sorted[idx - 1] : null
  const next    = idx !== -1 && idx < sorted.length - 1 ? sorted[idx + 1] : null

  const attendeeNames = session.attendees
    .map(a => (typeof a === 'object' ? a.build?.name : null))
    .filter(Boolean) as string[]

  return (
    <main>
      {/* Top bar */}
      <div className="border-b border-[#2a2826] bg-[#0e0c0b]/80 px-6 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center gap-2 text-[0.68rem] uppercase tracking-[0.18em] text-stone-600">
          <Link href="/" className="transition-colors hover:text-amber-500">Inicio</Link>
          <span>/</span>
          <Link href="/sessions" className="transition-colors hover:text-amber-500">Sesiones</Link>
          <span>/</span>
          <span className="text-stone-400">Sesión #{session.session_number}</span>
        </div>
      </div>

      {/* Hero */}
      <section
        className="relative overflow-hidden border-b border-[#3c3330]/30 px-6 pb-12 pt-14"
        style={{ background: 'radial-gradient(ellipse 90% 120% at 50% -5%, #1f150a 0%, #0c0a09 60%)' }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(rgba(245,158,11,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.02) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="relative mx-auto max-w-4xl" style={{ animation: 'fade-up 0.5s ease both' }}>
          {/* Session number + status */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-amber-500/25 bg-amber-500/8 font-display text-[0.82rem] font-bold text-amber-500">
              #{session.session_number}
            </div>
            <span className={`rounded px-2.5 py-1 text-[0.62rem] font-medium uppercase tracking-[0.12em] ${statusStyles[session.status]}`}>
              {statusLabel[session.status]}
            </span>
            <span className="text-[0.72rem] text-stone-600">{formatDate(session.date_played)}</span>
          </div>

          <h1 className="font-display mb-4 text-[clamp(1.5rem,4vw,2.8rem)] font-bold leading-tight tracking-[0.05em] text-stone-50" style={{ textShadow: '0 0 60px rgba(245,158,11,0.08)' }}>
            {session.title}
          </h1>

          {attendeeNames.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-[0.72rem] text-stone-600">
              <span className="uppercase tracking-[0.12em]">Asistentes</span>
              <span>·</span>
              {attendeeNames.map(name => (
                <span key={name} className="rounded border border-[#3c3330] bg-[#181412] px-2 py-0.5 text-stone-400">
                  {name}
                </span>
              ))}
            </div>
          )}

          {session.attendees.length > 0 && attendeeNames.length === 0 && (
            <div className="text-[0.72rem] text-stone-600">
              {session.attendees.length} asistente{session.attendees.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </section>

      {/* Body */}
      <div className="mx-auto max-w-4xl px-6 py-12">
        {/* Preamble */}
        {session.preamble && (
          <div className="mb-10" style={{ animation: 'fade-up 0.5s ease both 0.1s' }}>
            <div className="relative rounded-xl border border-amber-500/10 bg-amber-500/4 px-8 py-7">
              <div className="absolute -top-2.5 left-8 bg-[#0c0a09] px-3">
                <span className="font-display text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-amber-600/60">
                  Prólogo
                </span>
              </div>
              <p className="font-body text-[1.05rem] italic leading-[1.9] text-stone-300">
                {session.preamble}
              </p>
            </div>
          </div>
        )}

        {/* Divider */}
        {session.preamble && session.summary && <Divider />}

        {/* Summary */}
        {session.summary ? (
          <div className="mt-10" style={{ animation: 'fade-up 0.5s ease both 0.18s' }}>
            <div className="mb-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#2a2826]" />
              <span className="font-display text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-stone-600">
                Crónica
              </span>
              <div className="h-px flex-1 bg-[#2a2826]" />
            </div>
            <div className="font-body space-y-5 text-[1rem] leading-[1.85] text-stone-300">
              {session.summary.split('\n\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-10 rounded-xl border border-dashed border-[#3c3330] px-6 py-14 text-center" style={{ animation: 'fade-up 0.5s ease both 0.18s' }}>
            <div className="mb-3 text-3xl opacity-30">📜</div>
            <div className="font-display mb-1 text-[0.85rem] font-semibold tracking-[0.08em] text-stone-600">
              Sin crónica registrada
            </div>
            <p className="font-body text-[0.9rem] italic text-stone-700">
              El GM aún no ha redactado el resumen de esta sesión.
            </p>
          </div>
        )}

        {/* Events & Encounters */}
        {events && events.length > 0 && (
          <div className="mt-14" style={{ animation: 'fade-up 0.5s ease both 0.25s' }}>
            <div className="mb-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#2a2826]" />
              <span className="font-display text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-stone-600">
                Eventos de sesión
              </span>
              <div className="h-px flex-1 bg-[#2a2826]" />
            </div>
            <div className="flex flex-col gap-3">
              {[...events].sort((a, b) => a.order - b.order).map((event, i) => (
                <EventCard key={event._id} event={event} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Prev / Next navigation */}
        <div className="mt-16 border-t border-[#2a2826] pt-8">
          <div className="grid grid-cols-2 gap-4">
            <div>
              {prev && (
                <Link
                  href={`/sessions/${prev._id}`}
                  className="group flex flex-col gap-1 rounded-lg border border-[#2a2826] bg-[#181412] p-4 transition-all hover:border-amber-500/20 hover:bg-[#1e1b19]"
                >
                  <span className="text-[0.65rem] uppercase tracking-[0.15em] text-stone-600 transition-colors group-hover:text-amber-600">
                    ← Sesión anterior
                  </span>
                  <span className="font-display text-[0.85rem] font-semibold tracking-[0.04em] text-stone-300 transition-colors group-hover:text-stone-100 line-clamp-1">
                    #{prev.session_number} — {prev.title}
                  </span>
                </Link>
              )}
            </div>
            <div className="flex justify-end">
              {next && (
                <Link
                  href={`/sessions/${next._id}`}
                  className="group flex flex-col items-end gap-1 rounded-lg border border-[#2a2826] bg-[#181412] p-4 transition-all hover:border-amber-500/20 hover:bg-[#1e1b19] w-full"
                >
                  <span className="text-[0.65rem] uppercase tracking-[0.15em] text-stone-600 transition-colors group-hover:text-amber-600">
                    Sesión siguiente →
                  </span>
                  <span className="font-display text-[0.85rem] font-semibold tracking-[0.04em] text-stone-300 transition-colors group-hover:text-stone-100 line-clamp-1">
                    #{next.session_number} — {next.title}
                  </span>
                </Link>
              )}
            </div>
          </div>

          <div className="mt-4 text-center">
            <Link
              href="/sessions"
              className="text-[0.73rem] text-stone-600 transition-colors hover:text-amber-500"
            >
              ← Volver a todas las sesiones
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
