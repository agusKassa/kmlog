import Link from 'next/link'
import { api, formatDate, abilityMod, type ApiCharacter, type ApiPartyStateVersion } from '@/lib/api'

// ── Helpers ────────────────────────────────────────────────────────────────

const charAccents = [
  { bg: 'from-amber-950 to-stone-900',   ring: 'text-amber-400 border-amber-500/40 bg-amber-500/10' },
  { bg: 'from-sky-950 to-stone-900',     ring: 'text-sky-400 border-sky-500/40 bg-sky-500/10' },
  { bg: 'from-emerald-950 to-stone-900', ring: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' },
  { bg: 'from-rose-950 to-stone-900',    ring: 'text-rose-400 border-rose-500/40 bg-rose-500/10' },
  { bg: 'from-violet-950 to-stone-900',  ring: 'text-violet-400 border-violet-500/40 bg-violet-500/10' },
  { bg: 'from-teal-950 to-stone-900',    ring: 'text-teal-400 border-teal-500/40 bg-teal-500/10' },
]

function calcMaxHp(c: ApiCharacter): number {
  const { attributes, abilities, level } = c.build
  const conMod = abilityMod(abilities.con)
  return attributes.ancestryhp + (attributes.classhp + conMod + attributes.bonushp + attributes.bonushpPerLevel) * level
}

// ── Sub-components ─────────────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="h-px flex-1 bg-[#2a2826]" />
      <span className="font-display text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-stone-600">
        {children}
      </span>
      <div className="h-px flex-1 bg-[#2a2826]" />
    </div>
  )
}

function MemberCard({ character, index }: { character: ApiCharacter; index: number }) {
  const accent = charAccents[index % charAccents.length]
  const initial = character.build.name.charAt(0).toUpperCase()
  const maxHp = calcMaxHp(character)
  const speed = character.build.attributes.speed + (character.build.attributes.speedBonus ?? 0)
  const playerName = typeof character.user_id === 'object' ? character.user_id.username : null

  return (
    <Link
      href={`/characters/${character._id}`}
      className="group flex gap-3.5 rounded-xl border border-[#2a2826] bg-[#181412] p-3.5 transition-all hover:border-amber-500/20 hover:bg-[#1e1b19]"
      style={{ animation: `fade-in-left 0.45s ease both ${0.2 + index * 0.07}s` }}
    >
      {/* Avatar */}
      <div className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br ${accent.bg} flex items-center justify-center`}>
        {character.portrait_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={character.portrait_url}
            alt={character.build.name}
            className="h-full w-full object-cover object-top"
          />
        ) : (
          <span className={`font-display text-[1.1rem] font-bold ${accent.ring.split(' ')[0]}`}>
            {initial}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-display truncate text-[0.88rem] font-semibold tracking-[0.04em] text-stone-100 transition-colors group-hover:text-amber-400">
            {character.build.name}
          </span>
          <span className="shrink-0 rounded border border-amber-500/15 bg-amber-500/8 px-1.5 py-0.5 font-display text-[0.58rem] tracking-[0.1em] text-amber-500">
            NV {character.build.level}
          </span>
        </div>
        <div className="mt-0.5 text-[0.7rem] text-stone-600 truncate">
          {character.build.class} · {character.build.ancestry}
        </div>
        <div className="mt-1.5 flex items-center gap-3 text-[0.65rem] text-stone-700">
          <span><span className="text-stone-500">{maxHp}</span> HP</span>
          <span><span className="text-stone-500">{speed}</span>' velocidad</span>
          {playerName && <span className="ml-auto text-stone-700">{playerName}</span>}
        </div>
      </div>
    </Link>
  )
}

function VersionRow({ version, index }: { version: ApiPartyStateVersion; index: number }) {
  return (
    <div
      className="relative pl-5"
      style={{ animation: `fade-in-left 0.4s ease both ${index * 0.05}s` }}
    >
      {/* Timeline dot */}
      <div className="absolute left-0 top-1.5 h-2 w-2 rounded-full border border-[#3c3330] bg-[#2a2826]" />
      {index > 0 && <div className="absolute left-[3px] -top-3 h-3 w-px bg-[#2a2826]" />}

      <div className="mb-4 rounded-lg border border-[#2a2826] bg-[#181412] px-4 py-3">
        {version.version_note && (
          <div className="mb-2 text-[0.65rem] font-medium uppercase tracking-[0.12em] text-amber-600/70">
            {version.version_note}
          </div>
        )}
        <p className="font-body text-[0.88rem] leading-relaxed text-stone-500 line-clamp-3">
          {version.content}
        </p>
        <div className="mt-2 text-[0.62rem] uppercase tracking-[0.1em] text-stone-700">
          {formatDate(version.updated_at)}
        </div>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function PartyPage() {
  const [partyState, characters] = await Promise.all([
    api.partyState.get(),
    api.characters.findAll(),
  ])

  const hasContent = partyState?.current_content && partyState.current_content.trim().length > 0
  const versions = partyState?.versions?.slice().reverse().slice(0, 5) ?? []

  return (
    <main>
      {/* Hero */}
      <section
        className="relative overflow-hidden border-b border-[#3c3330]/40 px-6 pb-10 pt-12"
        style={{ background: 'radial-gradient(ellipse 80% 110% at 30% -10%, #0a1a14 0%, #0c0a09 60%)' }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(rgba(245,158,11,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.02) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="relative mx-auto max-w-7xl">
          <div className="mb-2 flex items-center gap-2 text-[0.68rem] font-medium uppercase tracking-[0.22em] text-amber-600">
            <Link href="/" className="transition-colors hover:text-amber-400">Inicio</Link>
            <span className="text-stone-700">/</span>
            <span>Party</span>
          </div>

          <h1 className="font-display mb-3 text-[clamp(1.6rem,3.5vw,2.6rem)] font-bold leading-tight tracking-[0.06em] text-stone-50">
            Estado del Grupo
          </h1>

          <p className="font-body text-[0.95rem] italic text-stone-600">
            Situación actual, composición del grupo y registro histórico de la campaña.
          </p>

          {partyState?.updated_at && (
            <div className="mt-3 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500/60" />
              <span className="text-[0.68rem] uppercase tracking-[0.15em] text-stone-600">
                Actualizado {formatDate(partyState.updated_at)}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Body */}
      <div className="mx-auto max-w-7xl gap-8 px-6 py-10 lg:grid lg:grid-cols-[1fr_320px]">

        {/* ── Main: current state ── */}
        <div className="mb-10 lg:mb-0">

          {/* Current content */}
          <div className="mb-10">
            <SectionHeader>Situación actual</SectionHeader>

            {hasContent ? (
              <div
                className="rounded-xl border border-[#2a2826] bg-[#181412] px-7 py-6"
                style={{ animation: 'fade-up 0.5s ease both' }}
              >
                {/* Decorative quote mark */}
                <div className="mb-4 font-display text-[3rem] leading-none text-amber-500/15 select-none">
                  ❝
                </div>
                <div className="font-body space-y-4 text-[1rem] leading-[1.9] text-stone-300">
                  {partyState!.current_content.split('\n\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
                {partyState?.updated_at && (
                  <div className="mt-6 border-t border-[#2a2826] pt-4 text-right text-[0.65rem] uppercase tracking-[0.12em] text-stone-700">
                    Última actualización · {formatDate(partyState.updated_at)}
                  </div>
                )}
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#3c3330] px-6 py-16 text-center"
                style={{ animation: 'fade-up 0.5s ease both' }}
              >
                <div className="mb-3 text-3xl opacity-30">🗺️</div>
                <div className="font-display mb-1.5 text-[0.85rem] font-semibold tracking-[0.08em] text-stone-600">
                  Sin estado registrado
                </div>
                <p className="font-body max-w-xs text-[0.9rem] italic text-stone-700">
                  El GM aún no ha registrado la situación actual del grupo.
                </p>
              </div>
            )}
          </div>

          {/* Version history */}
          {versions.length > 0 && (
            <div>
              <SectionHeader>Historial</SectionHeader>
              <div className="flex flex-col">
                {versions.map((v, i) => (
                  <VersionRow key={i} version={v} index={i} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar: party members ── */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-[76px] lg:self-start">

          {/* Members */}
          <div className="overflow-hidden rounded-xl border border-[#2a2826] bg-[#181412]">
            <div className="flex items-center justify-between border-b border-[#2a2826] px-4 py-3">
              <span className="font-display text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-stone-600">
                Miembros
              </span>
              {characters && characters.length > 0 && (
                <Link href="/characters" className="text-[0.68rem] text-stone-600 transition-colors hover:text-amber-500">
                  Ver fichas →
                </Link>
              )}
            </div>

            <div className="p-3">
              {!characters || characters.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="font-body text-[0.85rem] italic text-stone-700">
                    Ningún personaje registrado aún.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {characters.map((c, i) => (
                    <MemberCard key={c._id} character={c} index={i} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Party stats summary */}
          {characters && characters.length > 0 && (
            <div className="rounded-xl border border-[#2a2826] bg-[#181412] px-4 py-4">
              <div className="mb-3 font-display text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-stone-600">
                Resumen
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: 'Nivel medio',
                    value: (characters.reduce((s, c) => s + c.build.level, 0) / characters.length).toFixed(1),
                  },
                  {
                    label: 'HP total',
                    value: characters.reduce((s, c) => s + calcMaxHp(c), 0),
                  },
                  {
                    label: 'Personajes',
                    value: characters.length,
                  },
                  {
                    label: 'Clases',
                    value: new Set(characters.map(c => c.build.class)).size,
                  },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg border border-[#2a2826] bg-[#0e0c0b] px-3 py-2.5 text-center">
                    <div className="font-display text-[1.1rem] font-bold leading-none text-stone-100">{value}</div>
                    <div className="mt-1 text-[0.6rem] uppercase tracking-[0.1em] text-stone-700">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </aside>
      </div>
    </main>
  )
}
