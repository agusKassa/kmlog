import Link from 'next/link'
import { api, type ApiNpc } from '@/lib/api'
import { EmptyState } from '../_components/empty-state'

// ── Design constants ──────────────────────────────────────────────────────────

export const ROLE_CONFIG: Record<ApiNpc['role'], {
  label: string
  tw: string
  avatarBg: string
  avatarText: string
  dot: string
}> = {
  ally:    {
    label: 'Aliado',
    tw: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
    avatarBg: 'from-emerald-950 to-stone-900',
    avatarText: 'text-emerald-400',
    dot: 'bg-emerald-500',
  },
  enemy:   {
    label: 'Enemigo',
    tw: 'text-rose-400 bg-rose-500/10 border-rose-500/25',
    avatarBg: 'from-rose-950 to-stone-900',
    avatarText: 'text-rose-400',
    dot: 'bg-rose-500',
  },
  neutral: {
    label: 'Neutral',
    tw: 'text-sky-400 bg-sky-500/10 border-sky-500/25',
    avatarBg: 'from-sky-950 to-stone-900',
    avatarText: 'text-sky-400',
    dot: 'bg-sky-400',
  },
  unknown: {
    label: 'Desconocido',
    tw: 'text-stone-500 bg-stone-500/8 border-stone-700/40',
    avatarBg: 'from-stone-900 to-stone-950',
    avatarText: 'text-stone-500',
    dot: 'bg-stone-600',
  },
}

const ROLE_ORDER: ApiNpc['role'][] = ['enemy', 'ally', 'neutral', 'unknown']

// ── Sub-components ────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: ApiNpc['role'] }) {
  const c = ROLE_CONFIG[role]
  return (
    <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[0.6rem] font-medium uppercase tracking-[0.1em] ${c.tw}`}>
      {c.label}
    </span>
  )
}

function NpcCard({ npc, index }: { npc: ApiNpc; index: number }) {
  const c = ROLE_CONFIG[npc.role]

  return (
    <Link
      href={`/npcs/${npc._id}`}
      className="group flex gap-3.5 rounded-xl border border-[#2a2826] bg-[#181412] p-3.5 transition-all hover:border-amber-500/20 hover:bg-[#1e1b19]"
      style={{ animation: `fade-in-left 0.4s ease both ${index * 0.05}s` }}
    >
      {/* Avatar */}
      <div className={`relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br ${c.avatarBg}`}>
        {npc.portrait_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={npc.portrait_url}
            alt={npc.name}
            className="h-full w-full object-cover object-top"
          />
        ) : (
          <span className={`font-display text-[1.1rem] font-bold ${c.avatarText}`}>
            {npc.name.charAt(0).toUpperCase()}
          </span>
        )}

        {/* Dead overlay */}
        {!npc.is_alive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <span className="text-[0.7rem]">💀</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <div className="mb-1 flex flex-wrap items-baseline gap-2">
          <span className="font-display truncate text-[0.88rem] font-semibold tracking-[0.04em] text-stone-100 transition-colors group-hover:text-amber-400">
            {npc.name}
          </span>
          <RoleBadge role={npc.role} />
          {!npc.is_alive && (
            <span className="text-[0.6rem] uppercase tracking-[0.1em] text-stone-700">Muerto</span>
          )}
        </div>

        {npc.public_description ? (
          <p className="font-body text-[0.78rem] italic leading-snug text-stone-600 line-clamp-2">
            {npc.public_description}
          </p>
        ) : (
          <p className="font-body text-[0.75rem] italic text-stone-700">
            Sin descripción disponible.
          </p>
        )}
      </div>
    </Link>
  )
}

function FilterChip({
  label,
  href,
  active,
  dot,
}: {
  label: string
  href: string
  active: boolean
  dot?: string
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.68rem] font-medium uppercase tracking-[0.1em] transition-all ${
        active
          ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
          : 'border-[#2a2826] text-stone-600 hover:border-[#3c3330] hover:text-stone-400'
      }`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />}
      {label}
    </Link>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function NpcsPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>
}) {
  const { role: roleFilter } = await searchParams
  const npcs = await api.npcs.findAll()

  const allNpcs = npcs ?? []
  const filtered = roleFilter
    ? allNpcs.filter(n => n.role === roleFilter)
    : allNpcs

  // Sort: role order, then alive before dead, then alphabetical
  const sorted = [...filtered].sort((a, b) => {
    const ri = ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role)
    if (ri !== 0) return ri
    if (a.is_alive !== b.is_alive) return a.is_alive ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  const counts = {
    total:   allNpcs.length,
    ally:    allNpcs.filter(n => n.role === 'ally').length,
    enemy:   allNpcs.filter(n => n.role === 'enemy').length,
    neutral: allNpcs.filter(n => n.role === 'neutral').length,
    unknown: allNpcs.filter(n => n.role === 'unknown').length,
    dead:    allNpcs.filter(n => !n.is_alive).length,
  }

  return (
    <main>
      {/* Hero */}
      <section
        className="relative overflow-hidden border-b border-[#3c3330]/40 px-6 pb-10 pt-12"
        style={{ background: 'radial-gradient(ellipse 80% 100% at 60% -10%, #140a14 0%, #0c0a09 65%)' }}
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
            <span>NPCs</span>
          </div>

          <h1 className="font-display mb-3 text-[clamp(1.6rem,3.5vw,2.6rem)] font-bold leading-tight tracking-[0.06em] text-stone-50">
            Personas de la Campaña
          </h1>

          <p className="font-body mb-5 text-[1rem] italic text-stone-500">
            Aliados, enemigos y figuras que la party ha conocido en las Tierras Robadas.
          </p>

          {/* Counters */}
          <div className="mb-5 flex flex-wrap gap-5">
            {[
              { val: counts.total,   lbl: 'Total' },
              { val: counts.enemy,   lbl: 'Enemigos', gold: false, color: 'text-rose-400' },
              { val: counts.ally,    lbl: 'Aliados',  gold: false, color: 'text-emerald-400' },
              { val: counts.neutral, lbl: 'Neutrales' },
              ...(counts.dead > 0 ? [{ val: counts.dead, lbl: 'Muertos', color: 'text-stone-600' }] : []),
            ].map(({ val, lbl, color }) => (
              <div key={lbl} className="flex items-baseline gap-1.5">
                <span className={`font-display text-[1.4rem] font-bold leading-none ${color ?? 'text-stone-200'}`}>
                  {val}
                </span>
                <span className="text-[0.65rem] uppercase tracking-[0.15em] text-stone-600">{lbl}</span>
              </div>
            ))}
          </div>

          {/* Role filter */}
          <div className="flex flex-wrap gap-2">
            <FilterChip
              label="Todos"
              href="/npcs"
              active={!roleFilter}
            />
            {(['ally', 'enemy', 'neutral', 'unknown'] as const).map(r => (
              counts[r] > 0 && (
                <FilterChip
                  key={r}
                  label={`${ROLE_CONFIG[r].label} (${counts[r]})`}
                  href={`/npcs?role=${r}`}
                  active={roleFilter === r}
                  dot={ROLE_CONFIG[r].dot}
                />
              )
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-6 py-10">
        {!npcs ? (
          <EmptyState
            icon="⚠️"
            title="Error al cargar NPCs"
            description="No se pudo conectar con el servidor. Intentá recargar la página."
          />
        ) : sorted.length === 0 ? (
          <EmptyState
            icon="👤"
            title={roleFilter ? `Sin NPCs de tipo "${ROLE_CONFIG[roleFilter as ApiNpc['role']]?.label}"` : 'Sin NPCs registrados'}
            description={
              roleFilter
                ? 'Probá con otro filtro o volvé a todos.'
                : 'El GM aún no ha registrado personajes no jugadores en la campaña.'
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {sorted.map((npc, i) => (
              <NpcCard key={npc._id} npc={npc} index={i} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
