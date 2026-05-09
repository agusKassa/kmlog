import Link from 'next/link'
import { notFound } from 'next/navigation'
import { api, abilityMod, fmtMod, type PathbuilderBuild, type PathbuilderWeapon } from '@/lib/api'

// ── Helpers ────────────────────────────────────────────────────────────────

function calcMaxHp(build: PathbuilderBuild): number {
  const conMod = abilityMod(build.abilities.con)
  const perLevel = build.attributes.classhp + conMod + build.attributes.bonushp + build.attributes.bonushpPerLevel
  return build.attributes.ancestryhp + perLevel * build.level
}

const ABILITY_LABELS: Record<string, string> = {
  str: 'FUE', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR',
}

const ALIGNMENT_LABELS: Record<string, string> = {
  LG: 'Legal Bueno', NG: 'Neutral Bueno', CG: 'Caótico Bueno',
  LN: 'Legal Neutral', N: 'Neutral', TN: 'Neutral Verdadero', CN: 'Caótico Neutral',
  LE: 'Legal Malvado', NE: 'Neutral Malvado', CE: 'Caótico Malvado',
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatCard({ label, score }: { label: string; score: number }) {
  const mod = abilityMod(score)
  const modStr = mod >= 0 ? `+${mod}` : `${mod}`
  return (
    <div className="flex flex-col items-center rounded-lg border border-[#2a2826] bg-[#181412] px-3 py-3.5 text-center">
      <div className="mb-1 text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-stone-600">{label}</div>
      <div className="font-display text-[1.4rem] font-bold leading-none text-stone-100">{modStr}</div>
      <div className="mt-1 text-[0.65rem] text-stone-600">{score}</div>
    </div>
  )
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="h-px flex-1 bg-[#2a2826]" />
      <span className="font-display text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-stone-600">
        {children}
      </span>
      <div className="h-px flex-1 bg-[#2a2826]" />
    </div>
  )
}

function Trait({ label }: { label: string }) {
  return (
    <span className="rounded border border-[#3c3330] bg-[#1e1b18] px-2 py-0.5 text-[0.7rem] text-stone-400">
      {label}
    </span>
  )
}

function WeaponRow({ weapon }: { weapon: PathbuilderWeapon }) {
  const atkStr = weapon.attack >= 0 ? `+${weapon.attack}` : `${weapon.attack}`
  const dmgStr = `${weapon.die}${weapon.damageBonus > 0 ? `+${weapon.damageBonus}` : weapon.damageBonus < 0 ? weapon.damageBonus : ''} ${weapon.damageType}`
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-[#2a2826] bg-[#181412] px-4 py-3">
      <div>
        <div className="font-display text-[0.82rem] font-semibold tracking-[0.04em] text-stone-200">{weapon.display || weapon.name}</div>
        <div className="mt-0.5 text-[0.68rem] text-stone-600">{weapon.prof} · {weapon.die} base</div>
      </div>
      <div className="flex items-center gap-4 text-right">
        <div>
          <div className="text-[0.6rem] uppercase tracking-[0.1em] text-stone-700">Ataque</div>
          <div className="font-display text-[0.9rem] font-bold text-amber-400">{atkStr}</div>
        </div>
        <div>
          <div className="text-[0.6rem] uppercase tracking-[0.1em] text-stone-700">Daño</div>
          <div className="font-display text-[0.82rem] font-semibold text-stone-300">{dmgStr}</div>
        </div>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function CharacterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const character = await api.characters.findById(id)

  if (!character) notFound()

  const build = character.build
  const playerName = typeof character.user_id === 'object' ? character.user_id.username : null
  const maxHp = calcMaxHp(build)
  const speed = build.attributes.speed + (build.attributes.speedBonus ?? 0)
  const wornArmor = build.armor.find(a => a.worn) ?? null

  const abilities = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const

  // Feats: take first 8 non-null from class/general feats
  const notableFeats = build.feats
    .filter(f => f[0] && f[0] !== 'Adopted Ancestry' && f[2] !== 'Heritage')
    .slice(0, 8)

  // Spellcasters with actual spells
  const spellcasters = (build.spellCasters ?? []).filter(
    sc => sc.spells?.some(s => s.list.length > 0) || sc.prepared?.some(p => p.list.length > 0)
  )

  return (
    <main>
      {/* Breadcrumb */}
      <div className="border-b border-[#2a2826] bg-[#0e0c0b]/80 px-6 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-2 text-[0.68rem] uppercase tracking-[0.18em] text-stone-600">
          <Link href="/" className="transition-colors hover:text-amber-500">Inicio</Link>
          <span>/</span>
          <Link href="/characters" className="transition-colors hover:text-amber-500">Personajes</Link>
          <span>/</span>
          <span className="text-stone-400">{build.name}</span>
        </div>
      </div>

      {/* Hero */}
      <section
        className="relative overflow-hidden border-b border-[#3c3330]/30"
        style={{ background: 'radial-gradient(ellipse 100% 160% at 60% -10%, #1f150a 0%, #0c0a09 60%)' }}
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-0 md:flex-row">

            {/* Portrait */}
            <div className="relative w-full shrink-0 md:w-56 lg:w-72">
              {character.portrait_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={character.portrait_url}
                  alt={build.name}
                  className="h-64 w-full object-cover object-top md:h-full"
                  style={{ minHeight: '280px', maxHeight: '380px' }}
                />
              ) : (
                <div className="flex h-64 w-full items-center justify-center bg-gradient-to-br from-amber-950 to-stone-900 md:h-full" style={{ minHeight: '280px' }}>
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-amber-500/40 bg-amber-500/10 font-display text-[2rem] font-bold text-amber-400">
                    {build.name.charAt(0)}
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0c0a09] opacity-60 md:opacity-100" />
            </div>

            {/* Info */}
            <div className="relative flex flex-1 flex-col justify-end px-6 py-8 md:px-8 md:py-10" style={{ animation: 'fade-up 0.5s ease both' }}>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded border border-amber-500/20 bg-amber-500/8 px-2.5 py-0.5 font-display text-[0.62rem] font-bold tracking-[0.15em] text-amber-500">
                  NV {build.level}
                </span>
                {build.alignment && (
                  <span className="rounded border border-[#3c3330] bg-[#181412] px-2 py-0.5 text-[0.62rem] text-stone-500">
                    {ALIGNMENT_LABELS[build.alignment] ?? build.alignment}
                  </span>
                )}
              </div>

              <h1 className="font-display mb-1 text-[clamp(1.8rem,4vw,3rem)] font-bold leading-tight tracking-[0.05em] text-stone-50">
                {build.name}
              </h1>

              <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.85rem] text-stone-400">
                <span className="font-semibold text-stone-200">
                  {build.class}{build.dualClass ? ` / ${build.dualClass}` : ''}
                </span>
                <span className="text-stone-700">·</span>
                <span>{build.ancestry}</span>
                {build.heritage && (
                  <>
                    <span className="text-stone-700">·</span>
                    <span className="italic text-stone-500">{build.heritage}</span>
                  </>
                )}
                {build.background && (
                  <>
                    <span className="text-stone-700">·</span>
                    <span className="text-stone-500">{build.background}</span>
                  </>
                )}
              </div>

              {/* Core stats row */}
              <div className="mb-5 flex flex-wrap gap-4">
                <div className="flex flex-col">
                  <span className="text-[0.58rem] uppercase tracking-[0.14em] text-stone-700">HP Máx.</span>
                  <span className="font-display text-[1.3rem] font-bold leading-none text-stone-100">{maxHp}</span>
                </div>
                <div className="w-px self-stretch bg-[#2a2826]" />
                <div className="flex flex-col">
                  <span className="text-[0.58rem] uppercase tracking-[0.14em] text-stone-700">Velocidad</span>
                  <span className="font-display text-[1.3rem] font-bold leading-none text-stone-100">{speed}'</span>
                </div>
                {wornArmor && (
                  <>
                    <div className="w-px self-stretch bg-[#2a2826]" />
                    <div className="flex flex-col">
                      <span className="text-[0.58rem] uppercase tracking-[0.14em] text-stone-700">Armadura</span>
                      <span className="font-display text-[1rem] font-bold leading-none text-stone-200">{wornArmor.display || wornArmor.name}</span>
                    </div>
                  </>
                )}
                {build.focusPoints > 0 && (
                  <>
                    <div className="w-px self-stretch bg-[#2a2826]" />
                    <div className="flex flex-col">
                      <span className="text-[0.58rem] uppercase tracking-[0.14em] text-stone-700">Puntos de Foco</span>
                      <span className="font-display text-[1.3rem] font-bold leading-none text-amber-400">{build.focusPoints}</span>
                    </div>
                  </>
                )}
              </div>

              {playerName && (
                <div className="flex items-center gap-2 text-[0.72rem] text-stone-600">
                  <div className="h-5 w-5 rounded-full border border-[#3c3330] bg-[#181412] flex items-center justify-center text-[0.55rem] text-stone-500">
                    {playerName.charAt(0).toUpperCase()}
                  </div>
                  <span>Jugado por <span className="text-stone-400">{playerName}</span></span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="mx-auto max-w-7xl gap-8 px-6 py-10 lg:grid lg:grid-cols-[280px_1fr]">

        {/* ── Left sidebar ── */}
        <aside className="mb-10 flex flex-col gap-6 lg:mb-0 lg:sticky lg:top-[76px] lg:self-start">

          {/* Ability scores */}
          <div>
            <SectionHeader>Atributos</SectionHeader>
            <div className="grid grid-cols-3 gap-2">
              {abilities.map(key => (
                <StatCard key={key} label={ABILITY_LABELS[key]} score={build.abilities[key]} />
              ))}
            </div>
          </div>

          {/* Traits */}
          <div>
            <SectionHeader>Rasgos</SectionHeader>
            <div className="flex flex-wrap gap-1.5">
              {build.deity && <Trait label={`⚑ ${build.deity}`} />}
              {build.gender && <Trait label={build.gender} />}
              {build.age && <Trait label={`${build.age} años`} />}
              {build.sizeName && <Trait label={build.sizeName} />}
              {build.keyability && <Trait label={`Clave: ${build.keyability}`} />}
            </div>
          </div>

          {/* Languages */}
          {build.languages && build.languages.length > 0 && (
            <div>
              <SectionHeader>Idiomas</SectionHeader>
              <div className="flex flex-wrap gap-1.5">
                {build.languages.map(lang => <Trait key={lang} label={lang} />)}
              </div>
            </div>
          )}

          {/* Lores */}
          {build.lores && build.lores.length > 0 && (
            <div>
              <SectionHeader>Conocimientos</SectionHeader>
              <div className="flex flex-col gap-1.5">
                {build.lores.map(([name, rank]) => (
                  <div key={name} className="flex items-center justify-between rounded border border-[#2a2826] bg-[#181412] px-3 py-2">
                    <span className="text-[0.78rem] text-stone-400">{name} Lore</span>
                    <span className="font-display text-[0.65rem] font-bold tracking-[0.08em] text-amber-500">
                      {['E', 'T', 'X', 'M', 'L'][rank] ?? rank}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Money */}
          {build.money && (
            <div>
              <SectionHeader>Monedas</SectionHeader>
              <div className="grid grid-cols-4 gap-1.5 text-center">
                {[
                  { val: build.money.pp, label: 'PP', color: 'text-violet-400' },
                  { val: build.money.gp, label: 'PO', color: 'text-amber-400' },
                  { val: build.money.sp, label: 'PP', color: 'text-stone-300' },
                  { val: build.money.cp, label: 'PC', color: 'text-orange-700' },
                ].map(({ val, label, color }) => (
                  <div key={label} className="rounded border border-[#2a2826] bg-[#181412] py-2">
                    <div className={`font-display text-[1rem] font-bold leading-none ${color}`}>{val}</div>
                    <div className="mt-0.5 text-[0.55rem] uppercase tracking-[0.1em] text-stone-700">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* ── Main content ── */}
        <div className="flex flex-col gap-8">

          {/* Bio */}
          {character.public_bio && (
            <div>
              <SectionHeader>Biografía</SectionHeader>
              <div className="rounded-xl border border-[#2a2826] bg-[#181412] px-6 py-5">
                <p className="font-body text-[1rem] italic leading-[1.85] text-stone-300">
                  {character.public_bio}
                </p>
              </div>
            </div>
          )}

          {/* Weapons */}
          {build.weapons && build.weapons.length > 0 && (
            <div>
              <SectionHeader>Armamento</SectionHeader>
              <div className="flex flex-col gap-2">
                {build.weapons.map((w, i) => <WeaponRow key={i} weapon={w} />)}
              </div>
            </div>
          )}

          {/* Spellcasting */}
          {spellcasters.length > 0 && (
            <div>
              <SectionHeader>Conjuros</SectionHeader>
              <div className="flex flex-col gap-4">
                {spellcasters.map((sc, sci) => {
                  const allSpells = [...(sc.spells ?? []), ...(sc.prepared ?? [])]
                    .filter(s => s.list.length > 0)
                    .sort((a, b) => a.spellLevel - b.spellLevel)

                  return (
                    <div key={sci} className="rounded-xl border border-[#2a2826] bg-[#181412] overflow-hidden">
                      <div className="flex items-center justify-between border-b border-[#2a2826] px-4 py-2.5">
                        <span className="font-display text-[0.78rem] font-semibold tracking-[0.06em] text-stone-300">{sc.name}</span>
                        <span className="text-[0.65rem] uppercase tracking-[0.1em] text-stone-600">
                          {sc.magicTradition} · {sc.spellcastingType}
                        </span>
                      </div>
                      <div className="divide-y divide-[#2a2826]">
                        {allSpells.map(s => (
                          <div key={s.spellLevel} className="flex gap-4 px-4 py-3">
                            <div className="shrink-0">
                              <span className="font-display text-[0.72rem] font-bold tracking-[0.08em] text-amber-500">
                                {s.spellLevel === 0 ? 'Can.' : `Nv.${s.spellLevel}`}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-x-3 gap-y-1">
                              {s.list.map(spell => (
                                <span key={spell} className="text-[0.78rem] text-stone-400">{spell}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Feats */}
          {notableFeats.length > 0 && (
            <div>
              <SectionHeader>Dotes destacadas</SectionHeader>
              <div className="grid gap-2 sm:grid-cols-2">
                {notableFeats.map(([name, , type, level], i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border border-[#2a2826] bg-[#181412] px-3.5 py-3">
                    <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500/60" />
                    <div>
                      <div className="text-[0.82rem] font-medium text-stone-300">{name}</div>
                      <div className="mt-0.5 text-[0.65rem] uppercase tracking-[0.08em] text-stone-700">
                        {type}{level ? ` · Nv. ${level}` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Specials */}
          {build.specials && build.specials.length > 0 && (
            <div>
              <SectionHeader>Habilidades especiales</SectionHeader>
              <div className="flex flex-wrap gap-1.5">
                {build.specials.map(s => <Trait key={s} label={s} />)}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
