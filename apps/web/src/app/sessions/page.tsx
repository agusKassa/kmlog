import Link from 'next/link'
import { api, formatDate, type ApiSession } from '@/lib/api'
import { EmptyState } from '../_components/empty-state'

const statusStyles: Record<string, string> = {
  published: 'bg-green-500/8 text-green-300 border border-green-500/20',
  played:    'bg-orange-500/8 text-orange-300 border border-orange-500/20',
  draft:     'bg-stone-500/8 text-stone-500 border border-stone-700/40',
}
const statusLabel: Record<string, string> = {
  published: 'Publicada', played: 'Jugada', draft: 'Borrador',
}

function SessionRow({ session, index, isLast }: { session: ApiSession; index: number; isLast: boolean }) {
  return (
    <div
      className="grid gap-0"
      style={{ gridTemplateColumns: '64px 1fr', animation: `fade-in-left 0.4s ease both ${index * 0.055}s` }}
    >
      {/* Timeline column */}
      <div className="flex flex-col items-center pt-1">
        <div className="flex h-10 w-10 items-center justify-center rounded-md border border-amber-500/20 bg-amber-500/8 font-display text-[0.85rem] font-bold text-amber-500">
          #{session.session_number}
        </div>
        {!isLast && <div className="my-2 min-h-5 w-px flex-1 bg-[#2a2826]" />}
      </div>

      {/* Content column */}
      <div className={`pl-3 ${!isLast ? 'pb-8' : ''}`}>
        <div className="mb-1.5 flex flex-wrap items-start justify-between gap-3">
          <Link
            href={`/sessions/${session._id}`}
            className="font-display text-[1rem] font-semibold leading-snug tracking-[0.04em] text-stone-100 transition-colors hover:text-amber-400"
          >
            {session.title}
          </Link>
          <span className={`shrink-0 rounded px-2 py-0.5 text-[0.62rem] font-medium uppercase tracking-[0.1em] ${statusStyles[session.status]}`}>
            {statusLabel[session.status]}
          </span>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.73rem] text-stone-600">
          <span>{formatDate(session.date_played)}</span>
          {session.attendees.length > 0 && (
            <>
              <span>·</span>
              <span>{session.attendees.length} asistente{session.attendees.length !== 1 ? 's' : ''}</span>
            </>
          )}
        </div>

        {session.summary ? (
          <p className="font-body text-[0.95rem] leading-relaxed text-stone-400 line-clamp-3">
            {session.summary}
          </p>
        ) : (
          <p className="font-body text-[0.88rem] italic text-stone-700">
            Sin resumen disponible.
          </p>
        )}

        <Link
          href={`/sessions/${session._id}`}
          className="mt-3 inline-flex items-center gap-1.5 text-[0.72rem] font-medium text-amber-600 transition-colors hover:text-amber-400"
        >
          Leer crónica →
        </Link>
      </div>
    </div>
  )
}

export default async function SessionsPage() {
  const sessions = await api.sessions.findAll()

  const published = sessions?.filter(s => s.status === 'published') ?? []
  const played    = sessions?.filter(s => s.status === 'played') ?? []
  const draft     = sessions?.filter(s => s.status === 'draft') ?? []

  return (
    <main>
      {/* Hero */}
      <section
        className="relative overflow-hidden border-b border-[#3c3330]/40 px-6 pb-10 pt-12"
        style={{ background: 'radial-gradient(ellipse 80% 100% at 50% -10%, #1f150a 0%, #0c0a09 65%)' }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(rgba(245,158,11,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.025) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="relative mx-auto max-w-7xl">
          <div className="mb-2 flex items-center gap-2 text-[0.68rem] font-medium uppercase tracking-[0.22em] text-amber-600">
            <Link href="/" className="transition-colors hover:text-amber-400">Inicio</Link>
            <span className="text-stone-700">/</span>
            <span>Sesiones</span>
          </div>

          <h1 className="font-display mb-4 text-[clamp(1.6rem,3.5vw,2.6rem)] font-bold leading-tight tracking-[0.06em] text-stone-50">
            Crónicas de la Campaña
          </h1>

          <div className="flex flex-wrap gap-5 text-[0.78rem] text-stone-500">
            {[
              { val: sessions?.length ?? 0,  lbl: 'Total' },
              { val: published.length,        lbl: 'Publicadas', gold: true },
              { val: played.length,           lbl: 'Jugadas' },
              { val: draft.length,            lbl: 'Borradores' },
            ].map(({ val, lbl, gold }) => (
              <div key={lbl} className="flex items-baseline gap-1.5">
                <span className={`font-display text-[1.4rem] font-bold leading-none tracking-tight ${gold ? 'text-amber-500' : 'text-stone-200'}`}>
                  {val}
                </span>
                <span className="text-[0.65rem] uppercase tracking-[0.15em] text-stone-600">{lbl}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-6 py-12">
        {!sessions ? (
          <EmptyState
            icon="⚠️"
            title="Error al cargar sesiones"
            description="No se pudo conectar con el servidor. Intentá recargar la página."
          />
        ) : sessions.length === 0 ? (
          <EmptyState
            icon="📜"
            title="Sin sesiones aún"
            description="Las crónicas comenzarán cuando el GM publique la primera sesión."
          />
        ) : (
          <div className="flex flex-col">
            {sessions.map((session, i) => (
              <SessionRow
                key={session._id}
                session={session}
                index={i}
                isLast={i === sessions.length - 1}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
