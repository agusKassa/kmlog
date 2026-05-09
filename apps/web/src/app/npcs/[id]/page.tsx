import Link from 'next/link'
import { notFound } from 'next/navigation'
import { api } from '@/lib/api'
import { ROLE_CONFIG } from '../page'

export default async function NpcDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [npc, sessions] = await Promise.all([
    api.npcs.findById(id),
    api.sessions.findAll(),
  ])

  if (!npc) notFound()

  const roleConf = ROLE_CONFIG[npc.role]
  const firstSession = npc.first_seen_session_id
    ? sessions?.find(s => s._id === npc.first_seen_session_id)
    : null

  return (
    <main>
      {/* Breadcrumb */}
      <div className="border-b border-[#2a2826] bg-[#0e0c0b]/80 px-6 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-2 text-[0.68rem] uppercase tracking-[0.18em] text-stone-600">
          <Link href="/" className="transition-colors hover:text-amber-500">Inicio</Link>
          <span>/</span>
          <Link href="/npcs" className="transition-colors hover:text-amber-500">NPCs</Link>
          <span>/</span>
          <span className="truncate text-stone-400">{npc.name}</span>
        </div>
      </div>

      {/* Hero */}
      <section
        className="relative overflow-hidden border-b border-[#3c3330]/30 px-6 pb-12 pt-14"
        style={{ background: 'radial-gradient(ellipse 90% 120% at 50% -5%, #1a0a1a 0%, #0c0a09 60%)' }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(rgba(245,158,11,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.02) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative mx-auto flex max-w-5xl flex-wrap items-start gap-8" style={{ animation: 'fade-up 0.5s ease both' }}>
          {/* Portrait */}
          <div className={`flex h-36 w-36 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${roleConf.avatarBg} border border-[#2a2826] shadow-[0_16px_48px_rgba(0,0,0,0.6)]`}>
            {npc.portrait_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={npc.portrait_url}
                alt={npc.name}
                className="h-full w-full object-cover object-top"
              />
            ) : (
              <span className={`font-display text-[3rem] font-bold ${roleConf.avatarText}`}>
                {npc.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Identity */}
          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className={`rounded border px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] ${roleConf.tw}`}>
                {roleConf.label}
              </span>
              {npc.is_alive ? (
                <span className="flex items-center gap-1.5 rounded border border-emerald-500/25 bg-emerald-500/8 px-2.5 py-1 text-[0.68rem] uppercase tracking-[0.12em] text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Vivo
                </span>
              ) : (
                <span className="rounded border border-stone-700/40 bg-stone-500/8 px-2.5 py-1 text-[0.68rem] uppercase tracking-[0.12em] text-stone-600">
                  💀 Muerto
                </span>
              )}
            </div>

            <h1
              className="font-display mb-4 text-[clamp(1.8rem,4vw,3rem)] font-bold leading-tight tracking-[0.05em] text-stone-50"
              style={{ textShadow: '0 0 60px rgba(245,158,11,0.06)' }}
            >
              {npc.name}
            </h1>

            {/* First seen session */}
            {firstSession && (
              <div className="flex items-center gap-2 text-[0.72rem] text-stone-600">
                <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className="text-amber-600/60">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                <span>Visto por primera vez en{' '}</span>
                <Link
                  href={`/sessions/${firstSession._id}`}
                  className="font-medium text-amber-600 transition-colors hover:text-amber-400"
                >
                  Sesión #{firstSession.session_number} — {firstSession.title}
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="mx-auto max-w-5xl px-6 py-12">

        {/* Description */}
        {npc.public_description ? (
          <div style={{ animation: 'fade-up 0.5s ease both 0.1s' }}>
            <div className="mb-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#2a2826]" />
              <span className="font-display text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-stone-600">
                Descripción
              </span>
              <div className="h-px flex-1 bg-[#2a2826]" />
            </div>
            <div className="font-body space-y-4 text-[1rem] leading-[1.85] text-stone-300">
              {npc.public_description.split('\n\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#3c3330] px-6 py-16 text-center"
            style={{ animation: 'fade-up 0.5s ease both 0.1s' }}
          >
            <div className="mb-3 text-3xl opacity-25">👤</div>
            <div className="font-display mb-1 text-[0.85rem] font-semibold tracking-[0.08em] text-stone-600">
              Sin descripción pública
            </div>
            <p className="font-body text-[0.9rem] italic text-stone-700">
              El GM aún no ha añadido información pública sobre este personaje.
            </p>
          </div>
        )}

        {/* Public images */}
        {npc.public_image_urls.length > 0 && (
          <div className="mt-10" style={{ animation: 'fade-up 0.5s ease both 0.18s' }}>
            <div className="mb-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#2a2826]" />
              <span className="font-display text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-stone-600">
                Imágenes
              </span>
              <div className="h-px flex-1 bg-[#2a2826]" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {npc.public_image_urls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`${npc.name} — imagen ${i + 1}`}
                    className="aspect-square w-full rounded-lg border border-[#2a2826] object-cover transition-opacity hover:opacity-80"
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Back link */}
        <div className="mt-14 border-t border-[#2a2826] pt-8 text-center">
          <Link
            href="/npcs"
            className="text-[0.73rem] text-stone-600 transition-colors hover:text-amber-500"
          >
            ← Volver a todos los NPCs
          </Link>
        </div>
      </div>
    </main>
  )
}
