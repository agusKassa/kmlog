import Link from 'next/link'
import { api, type ApiCharacter } from '@/lib/api'
import { EmptyState } from '../_components/empty-state'
import { CreateCharacterButton } from './_components/create-character-modal'

const charAccents = [
  { bg: 'from-amber-950 to-stone-900',   ring: 'text-amber-400 border-amber-500/40 bg-amber-500/10',   bar: 'bg-amber-500' },
  { bg: 'from-sky-950 to-stone-900',     ring: 'text-sky-400 border-sky-500/40 bg-sky-500/10',         bar: 'bg-sky-500' },
  { bg: 'from-emerald-950 to-stone-900', ring: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10', bar: 'bg-emerald-500' },
  { bg: 'from-rose-950 to-stone-900',    ring: 'text-rose-400 border-rose-500/40 bg-rose-500/10',      bar: 'bg-rose-500' },
  { bg: 'from-violet-950 to-stone-900',  ring: 'text-violet-400 border-violet-500/40 bg-violet-500/10', bar: 'bg-violet-500' },
  { bg: 'from-teal-950 to-stone-900',    ring: 'text-teal-400 border-teal-500/40 bg-teal-500/10',      bar: 'bg-teal-500' },
]

function CharacterCard({ character, index }: { character: ApiCharacter; index: number }) {
  const accent = charAccents[index % charAccents.length]
  const initial = character.build.name.charAt(0).toUpperCase()
  const playerName = typeof character.user_id === 'object' ? character.user_id.username : null
  const isDead = character.is_alive === false

  return (
    <Link
      href={`/characters/${character._id}`}
      className="group overflow-hidden rounded-xl border border-[#2a2826] bg-[#181412] transition-all hover:-translate-y-0.5 hover:border-amber-500/25 hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
      style={{ animation: `fade-in-left 0.5s ease both ${index * 0.07}s` }}
    >
      {/* Portrait */}
      <div className={`relative aspect-[3/4] overflow-hidden bg-gradient-to-br ${accent.bg}`}>
        {character.portrait_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={character.portrait_url}
            alt={character.build.name}
            className={`h-full w-full object-cover object-top ${isDead ? 'grayscale' : ''}`}
          />
        ) : (
          <div className={`flex h-full w-full items-center justify-center ${isDead ? 'grayscale' : ''}`}>
            <div className={`flex h-16 w-16 items-center justify-center rounded-full border-2 font-display text-[1.5rem] font-bold ${accent.ring}`}>
              {initial}
            </div>
          </div>
        )}

        {/* Dead overlay */}
        {isDead && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/45">
            <span className="rounded border border-stone-500/40 bg-stone-900/80 px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.15em] text-stone-400">
              Muerto
            </span>
          </div>
        )}

        {/* Level badge overlay */}
        <div className="absolute right-2.5 top-2.5 rounded border border-amber-500/20 bg-[#0c0a09]/80 px-2 py-0.5 backdrop-blur-sm">
          <span className="font-display text-[0.62rem] font-bold tracking-[0.1em] text-amber-400">
            NV {character.build.level}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="font-display mb-1 truncate text-[0.9rem] font-semibold tracking-[0.04em] text-stone-100 transition-colors group-hover:text-amber-400">
          {character.build.name}
        </div>
        <div className="mb-2 text-[0.72rem] text-stone-500">
          {character.build.class}
          {character.build.dualClass ? ` / ${character.build.dualClass}` : ''}
          {' · '}
          {character.build.ancestry}
        </div>
        {character.build.background && (
          <div className="mb-3 text-[0.65rem] uppercase tracking-[0.1em] text-stone-700">
            {character.build.background}
          </div>
        )}
        {playerName && (
          <div className="flex items-center gap-1.5 border-t border-[#2a2826] pt-2.5">
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[#2a2826] text-[0.5rem] text-stone-500">
              {playerName.charAt(0).toUpperCase()}
            </div>
            <span className="text-[0.68rem] text-stone-600">{playerName}</span>
          </div>
        )}
      </div>
    </Link>
  )
}

export default async function CharactersPage() {
  const characters = await api.characters.findAll()

  return (
    <main>
      {/* Hero */}
      <section
        className="relative overflow-hidden border-b border-[#3c3330]/40 px-6 pb-10 pt-12"
        style={{ background: 'radial-gradient(ellipse 80% 100% at 50% -10%, #1a0f1a 0%, #0c0a09 65%)' }}
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
            <span>Personajes</span>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display mb-4 text-[clamp(1.6rem,3.5vw,2.6rem)] font-bold leading-tight tracking-[0.06em] text-stone-50">
                La Party
              </h1>
              <p className="font-body mb-4 text-[1rem] italic text-stone-500">
                Los aventureros que dan forma a las crónicas de la campaña.
              </p>
              {characters && characters.length > 0 && (
                <div className="text-[0.72rem] text-stone-600">
                  <span className="font-display text-[1.3rem] font-bold text-stone-200">{characters.length}</span>
                  {' '}personaje{characters.length !== 1 ? 's' : ''} activo{characters.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
            <div className="shrink-0 pt-1">
              <CreateCharacterButton />
            </div>
          </div>
        </div>
      </section>

      {/* Grid */}
      <div className="mx-auto max-w-7xl px-6 py-12">
        {!characters ? (
          <EmptyState
            icon="⚠️"
            title="Error al cargar personajes"
            description="No se pudo conectar con el servidor. Intentá recargar la página."
          />
        ) : characters.length === 0 ? (
          <EmptyState
            icon="⚔️"
            title="Sin personajes registrados"
            description="Los jugadores aún no han importado sus personajes desde Pathbuilder."
          />
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {characters.map((c, i) => (
              <CharacterCard key={c._id} character={c} index={i} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
