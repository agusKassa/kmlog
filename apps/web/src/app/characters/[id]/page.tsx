import Link from 'next/link'
import { notFound } from 'next/navigation'
import { api, abilityMod, type PathbuilderBuild, type PathbuilderWeapon } from '@/lib/api'
import { PortraitUploader } from '../_components/portrait-uploader'
import { CharacterControls } from './_components/character-controls'
import { BackstorySection } from './_components/backstory-section'
import { SyncButton } from './_components/sync-button'
import { PublicBioEditor } from './_components/public-bio-editor'
import { CharacterNotes } from './_components/character-notes'
import { CharacterHighlights } from './_components/character-highlights'
import { NoteDrawer } from '@/app/_components/note-drawer'

// ── Helpers ────────────────────────────────────────────────────────────────

function calcMaxHp(build: PathbuilderBuild): number {
  const conMod = abilityMod(build.abilities.con)
  const perLevel = build.attributes.classhp + conMod + build.attributes.bonushp + build.attributes.bonushpPerLevel
  return build.attributes.ancestryhp + perLevel * build.level
}

function profBonus(rank: number, level: number): number {
  return rank > 0 ? rank + level : 0
}

function fmtBonus(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`
}

const RANK_LABEL: Record<number, string> = { 2: 'T', 4: 'E', 6: 'M', 8: 'L' }
const RANK_COLOR: Record<number, string> = {
  2: 'text-stone-500',
  4: 'text-sky-400',
  6: 'text-violet-400',
  8: 'text-amber-400',
}

const ABILITY_LABELS: Record<string, string> = {
  str: 'FUE', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR',
}

const ALIGNMENT_LABELS: Record<string, string> = {
  LG: 'Legal Bueno', NG: 'Neutral Bueno', CG: 'Caótico Bueno',
  LN: 'Legal Neutral', N: 'Neutral', TN: 'Neutral Verdadero', CN: 'Caótico Neutral',
  LE: 'Legal Malvado', NE: 'Neutral Malvado', CE: 'Caótico Malvado',
}

const SKILL_ABILITY: Record<string, keyof PathbuilderBuild['abilities']> = {
  acrobatics: 'dex', arcana: 'int', athletics: 'str', crafting: 'int',
  deception: 'cha', diplomacy: 'cha', intimidation: 'cha', medicine: 'wis',
  nature: 'wis', occultism: 'int', performance: 'cha', religion: 'wis',
  society: 'int', stealth: 'dex', survival: 'wis', thievery: 'dex',
}

const SKILL_LABELS: Record<string, string> = {
  acrobatics: 'Acrobacia', arcana: 'Arcana', athletics: 'Atletismo', crafting: 'Artesanía',
  deception: 'Engaño', diplomacy: 'Diplomacia', intimidation: 'Intimidación', medicine: 'Medicina',
  nature: 'Naturaleza', occultism: 'Ocultismo', performance: 'Actuación', religion: 'Religión',
  society: 'Sociedad', stealth: 'Sigilo', survival: 'Supervivencia', thievery: 'Latrocinio',
}

const FEAT_TYPE_LABELS: Record<string, string> = {
  Class: 'Clase', Ancestry: 'Ascendencia', Skill: 'Habilidad',
  General: 'General', Bonus: 'Extra', Heritage: 'Herencia',
}
const FEAT_TYPE_ORDER = ['Class', 'Ancestry', 'Skill', 'General', 'Bonus']

// ── Sub-components ─────────────────────────────────────────────────────────

function StatCard({ label, score }: { label: string; score: number }) {
  const mod = abilityMod(score)
  return (
    <div className="relative flex flex-col items-center overflow-hidden rounded-lg border border-[#2a2826] bg-[#181412] px-3 py-3.5 text-center">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
      <div className="mb-1 text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-stone-600">{label}</div>
      <div className="font-display text-[1.5rem] font-bold leading-none text-amber-400">{mod >= 0 ? `+${mod}` : `${mod}`}</div>
      <div className="mt-1.5 text-[0.65rem] text-stone-600">{score}</div>
    </div>
  )
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="h-4 w-0.5 rounded-full bg-amber-500/50" />
      <span className="font-display text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-stone-500">
        {children}
      </span>
      <div className="h-px flex-1 bg-gradient-to-r from-[#2a2826] to-transparent" />
    </div>
  )
}

function Trait({ label }: { label: string }) {
  return (
    <span className="rounded-md border border-[#3c3330]/80 bg-[#181412] px-2.5 py-1 font-sans text-[0.68rem] tracking-wide text-stone-500 transition-colors hover:border-[#4a4340] hover:text-stone-400">
      {label}
    </span>
  )
}

function WeaponRow({ weapon }: { weapon: PathbuilderWeapon }) {
  const atkStr = weapon.attack >= 0 ? `+${weapon.attack}` : `${weapon.attack}`
  const dmgStr = `${weapon.die}${weapon.damageBonus > 0 ? `+${weapon.damageBonus}` : weapon.damageBonus < 0 ? weapon.damageBonus : ''} ${weapon.damageType}`
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-[#2a2826] bg-[#181412] px-4 py-3.5 transition-colors hover:border-[#3c3330]">
      <div>
        <div className="font-display text-[0.82rem] font-semibold tracking-[0.04em] text-stone-200">{weapon.display || weapon.name}</div>
        <div className="mt-0.5 font-sans text-[0.65rem] text-stone-600">{weapon.prof} · {weapon.die} base</div>
      </div>
      <div className="flex items-center gap-5 text-right">
        <div>
          <div className="font-sans text-[0.58rem] uppercase tracking-[0.12em] text-stone-700">Ataque</div>
          <div className="font-display text-[1rem] font-bold text-amber-400">{atkStr}</div>
        </div>
        <div className="w-px self-stretch bg-[#2a2826]" />
        <div>
          <div className="font-sans text-[0.58rem] uppercase tracking-[0.12em] text-stone-700">Daño</div>
          <div className="font-display text-[0.88rem] font-semibold text-stone-300">{dmgStr}</div>
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
  const ownerId    = typeof character.user_id === 'object' ? character.user_id._id : (character.user_id as string)
  const maxHp      = calcMaxHp(build)
  const speed      = build.attributes.speed + (build.attributes.speedBonus ?? 0)
  const wornArmor  = build.armor.find(a => a.worn) ?? null
  const isDead     = character.is_alive === false

  const abilities = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const

  const p = build.proficiencies as Record<string, number>
  const fortSave   = profBonus(p.fortitude  ?? 0, build.level) + abilityMod(build.abilities.con)
  const refSave    = profBonus(p.reflex     ?? 0, build.level) + abilityMod(build.abilities.dex)
  const willSave   = profBonus(p.will       ?? 0, build.level) + abilityMod(build.abilities.wis)
  const perception = profBonus(p.perception ?? 0, build.level) + abilityMod(build.abilities.wis)

  const classDcKey  = p.classDC !== undefined ? 'classDC' : 'classDc'
  const classDcRank = p[classDcKey] ?? 0
  const keyScore    = build.abilities[build.keyability as keyof typeof build.abilities] ?? 10
  const classDc     = 10 + profBonus(classDcRank, build.level) + abilityMod(keyScore)

  const trainedSkills = Object.entries(SKILL_ABILITY)
    .filter(([skill]) => (p[skill] ?? 0) > 0)
    .map(([skill, abilityKey]) => ({
      name: SKILL_LABELS[skill],
      rank: p[skill],
      mod:  profBonus(p[skill], build.level) + abilityMod(build.abilities[abilityKey]),
    }))
    .sort((a, b) => b.mod - a.mod)

  const loreSkills = (build.lores ?? []).map(([name, rank]) => ({
    name: `${name} Lore`,
    rank,
    mod: profBonus(rank, build.level) + abilityMod(build.abilities.int),
  }))

  const featsByType: Record<string, typeof build.feats> = {}
  build.feats
    .filter(f => f[0] && f[2] !== 'Heritage')
    .forEach(feat => {
      const type = feat[2] || 'Other'
      if (!featsByType[type]) featsByType[type] = []
      featsByType[type].push(feat)
    })
  const orderedFeatTypes = [
    ...FEAT_TYPE_ORDER.filter(t => featsByType[t]),
    ...Object.keys(featsByType).filter(t => !FEAT_TYPE_ORDER.includes(t)),
  ]

  const spellcasters = (build.spellCasters ?? []).filter(
    sc => sc.spells?.some(s => s.list.length > 0) || sc.prepared?.some(prep => prep.list.length > 0)
  )

  return (
    <main>
      {/* Breadcrumb */}
      <div className="border-b border-[#1e1c1a] bg-[#0c0a09]/90 px-6 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-2 font-sans text-[0.65rem] uppercase tracking-[0.2em] text-stone-700">
          <Link href="/" className="transition-colors hover:text-amber-500/80">Inicio</Link>
          <span className="text-[#2a2826]">◆</span>
          <Link href="/characters" className="transition-colors hover:text-amber-500/80">Personajes</Link>
          <span className="text-[#2a2826]">◆</span>
          <span className="text-stone-500">{build.name}</span>
        </div>
      </div>

      {/* Hero */}
      <section
        className="relative overflow-hidden border-b border-[#2a2826]/50"
        style={{ background: 'radial-gradient(ellipse 120% 200% at 70% -20%, #1a0f04 0%, #110d09 40%, #0c0a09 70%)' }}
      >
        {/* Subtle decorative grain enhancement for hero */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 3px)' }} />

        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row">

            {/* Portrait */}
            <div className="relative shrink-0 md:w-56 lg:w-72">
              <PortraitUploader
                characterId={character._id}
                ownerId={ownerId}
                portraitUrl={character.portrait_url}
                name={build.name}
                isAlive={!isDead}
              />
              {isDead && (
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-stone-900/40 to-transparent" />
              )}
            </div>

            {/* Info panel */}
            <div
              className="relative flex flex-1 flex-col gap-0 px-7 py-8 md:px-10 md:py-10"
              style={{ animation: 'fade-up 0.45s ease both' }}
            >
              {/* Vertical amber accent line */}
              <div className="absolute left-0 top-8 bottom-8 w-px bg-gradient-to-b from-transparent via-amber-500/20 to-transparent hidden md:block" />

              {/* Badges */}
              <div className="mb-3 flex flex-wrap items-center gap-1.5">
                <span className="rounded border border-amber-500/25 bg-amber-500/8 px-2.5 py-0.5 font-display text-[0.6rem] font-bold tracking-[0.18em] text-amber-500/90">
                  NV {build.level}
                </span>
                {isDead && (
                  <span className="rounded border border-stone-600/40 bg-stone-900/60 px-2.5 py-0.5 font-display text-[0.6rem] font-bold tracking-[0.18em] text-stone-600">
                    ✦ Muerto
                  </span>
                )}
                {build.alignment && (
                  <span className="rounded border border-[#2a2826] bg-[#181412]/60 px-2 py-0.5 font-sans text-[0.6rem] text-stone-600">
                    {ALIGNMENT_LABELS[build.alignment] ?? build.alignment}
                  </span>
                )}
              </div>

              {/* Name + sync */}
              <div className="mb-1 flex items-center gap-3">
                <h1 className={`font-display text-[clamp(1.75rem,4vw,2.8rem)] font-bold leading-tight tracking-[0.04em] ${isDead ? 'text-stone-600' : 'text-stone-50'}`}>
                  {build.name}
                </h1>
                <SyncButton
                  characterId={character._id}
                  ownerId={ownerId}
                  hasPbuilder={character.has_pathbuilder_id ?? false}
                  lastSyncedAt={character.last_synced_at ?? null}
                />
              </div>

              {/* Class / ancestry subtitle */}
              <div className="mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 font-sans text-[0.82rem] text-stone-500">
                <span className="font-semibold text-stone-300">
                  {build.class}{build.dualClass ? ` / ${build.dualClass}` : ''}
                </span>
                <span className="text-[#3c3330]">·</span>
                <span>{build.ancestry}</span>
                {build.heritage && (
                  <>
                    <span className="text-[#3c3330]">·</span>
                    <span className="italic text-stone-600">{build.heritage}</span>
                  </>
                )}
                {build.background && (
                  <>
                    <span className="text-[#3c3330]">·</span>
                    <span className="text-stone-600">{build.background}</span>
                  </>
                )}
              </div>

              {/* Public description + backstory trigger */}
              <div className="mb-5">
                <PublicBioEditor
                  characterId={character._id}
                  ownerId={ownerId}
                  initialBio={character.public_bio ?? ''}
                />
                <BackstorySection characterId={character._id} ownerId={ownerId} />
              </div>

              {/* Saves + Perception */}
              <div className="mb-4 flex flex-wrap gap-1.5">
                {[
                  { label: 'Fort', mod: fortSave, rank: p.fortitude ?? 0, color: 'text-emerald-400' },
                  { label: 'Ref',  mod: refSave,  rank: p.reflex    ?? 0, color: 'text-sky-400' },
                  { label: 'Vol',  mod: willSave, rank: p.will      ?? 0, color: 'text-violet-400' },
                  { label: 'Perc', mod: perception, rank: p.perception ?? 0, color: 'text-amber-300' },
                ].map(({ label, mod, rank, color }) => (
                  <div key={label} className="flex items-center gap-1.5 rounded-md border border-[#252220] bg-[#181412]/70 px-2.5 py-1.5">
                    <span className="font-sans text-[0.55rem] uppercase tracking-[0.14em] text-stone-700">{label}</span>
                    <span className={`font-display text-[0.95rem] font-bold leading-none ${color}`}>{fmtBonus(mod)}</span>
                    {RANK_LABEL[rank] && (
                      <span className={`text-[0.52rem] font-bold ${RANK_COLOR[rank] ?? 'text-stone-700'}`}>{RANK_LABEL[rank]}</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Speed / Armor / Focus */}
              <div className="mb-5 flex flex-wrap items-center gap-5">
                <div className="flex flex-col">
                  <span className="font-sans text-[0.55rem] uppercase tracking-[0.16em] text-stone-700">Velocidad</span>
                  <span className="font-display text-[1.2rem] font-bold leading-none text-stone-200">{speed}&apos;</span>
                </div>
                {wornArmor && (
                  <>
                    <div className="h-6 w-px bg-[#2a2826]" />
                    <div className="flex flex-col">
                      <span className="font-sans text-[0.55rem] uppercase tracking-[0.16em] text-stone-700">Armadura</span>
                      <span className="font-display text-[0.95rem] font-bold leading-none text-stone-200">{wornArmor.display || wornArmor.name}</span>
                    </div>
                  </>
                )}
                {build.focusPoints > 0 && (
                  <>
                    <div className="h-6 w-px bg-[#2a2826]" />
                    <div className="flex flex-col">
                      <span className="font-sans text-[0.55rem] uppercase tracking-[0.16em] text-stone-700">Foco</span>
                      <span className="font-display text-[1.2rem] font-bold leading-none text-amber-400">{build.focusPoints}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Character controls */}
              <div className="mb-4">
                <CharacterControls
                  characterId={character._id}
                  ownerId={ownerId}
                  isAlive={!isDead}
                  inParty={character.in_party ?? true}
                  currentHp={character.current_hp}
                  maxHp={maxHp}
                />
              </div>

              {/* Player attribution */}
              {playerName && (
                <div className="flex items-center gap-2 font-sans text-[0.68rem] text-stone-700">
                  <div className="flex h-4 w-4 items-center justify-center rounded-full border border-[#3c3330] bg-[#181412] text-[0.5rem] text-stone-600">
                    {playerName.charAt(0).toUpperCase()}
                  </div>
                  <span>Jugado por <span className="text-stone-500">{playerName}</span></span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="mx-auto max-w-7xl gap-10 px-6 py-10 lg:grid lg:grid-cols-[260px_1fr]">

        {/* ── Left sidebar ── */}
        <aside className="mb-10 flex flex-col gap-7 lg:mb-0 lg:sticky lg:top-[76px] lg:self-start">

          {/* Class DC */}
          {classDcRank > 0 && (
            <div>
              <SectionHeader>CD de Clase</SectionHeader>
              <div className="relative overflow-hidden rounded-lg border border-[#2a2826] bg-[#181412] px-4 py-4 text-center">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
                <div className="font-display text-[2rem] font-bold leading-none text-amber-400">{classDc}</div>
                <div className="mt-1.5 font-sans text-[0.56rem] uppercase tracking-[0.14em] text-stone-700">
                  {ABILITY_LABELS[build.keyability] ?? build.keyability} · {RANK_LABEL[classDcRank] ?? ''}
                </div>
              </div>
            </div>
          )}

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

          {/* Money */}
          {build.money && (
            <div>
              <SectionHeader>Monedas</SectionHeader>
              <div className="grid grid-cols-4 gap-1.5 text-center">
                {[
                  { val: build.money.pp, label: 'PP', color: 'text-violet-400' },
                  { val: build.money.gp, label: 'PO', color: 'text-amber-400' },
                  { val: build.money.sp, label: 'PA', color: 'text-stone-300' },
                  { val: build.money.cp, label: 'PC', color: 'text-orange-700' },
                ].map(({ val, label, color }) => (
                  <div key={label} className="relative overflow-hidden rounded border border-[#2a2826] bg-[#181412] py-2.5">
                    <div className={`font-display text-[1rem] font-bold leading-none ${color}`}>{val}</div>
                    <div className="mt-1 font-sans text-[0.52rem] uppercase tracking-[0.12em] text-stone-700">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* ── Main content ── */}
        <div className="flex flex-col gap-9">

          {/* Trained skills */}
          {(trainedSkills.length > 0 || loreSkills.length > 0) && (
            <div>
              <SectionHeader>Habilidades</SectionHeader>
              <div className="grid gap-1 sm:grid-cols-2">
                {[...trainedSkills, ...loreSkills].map(({ name, rank, mod }) => (
                  <div key={name} className="flex items-center justify-between rounded-md border border-[#222120] bg-[#181412] px-3.5 py-2.5 transition-colors hover:border-[#2a2826]">
                    <span className="font-sans text-[0.78rem] text-stone-400">{name}</span>
                    <div className="flex items-center gap-2.5">
                      {RANK_LABEL[rank] && (
                        <span className={`font-sans text-[0.56rem] font-semibold uppercase tracking-[0.1em] ${RANK_COLOR[rank] ?? 'text-stone-600'}`}>
                          {RANK_LABEL[rank]}
                        </span>
                      )}
                      <span className={`font-display min-w-[2.2rem] text-right text-[0.92rem] font-bold ${mod >= 0 ? 'text-amber-400' : 'text-stone-500'}`}>
                        {fmtBonus(mod)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ability scores */}
          <div>
            <SectionHeader>Atributos</SectionHeader>
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
              {abilities.map(key => (
                <StatCard key={key} label={ABILITY_LABELS[key]} score={build.abilities[key]} />
              ))}
            </div>
          </div>

          {/* Weapons */}
          {build.weapons && build.weapons.length > 0 && (
            <div>
              <SectionHeader>Armamento</SectionHeader>
              <div className="flex flex-col gap-1.5">
                {build.weapons.map((w, i) => <WeaponRow key={i} weapon={w} />)}
              </div>
            </div>
          )}

          {/* Spellcasting */}
          {spellcasters.length > 0 && (
            <div>
              <SectionHeader>Conjuros</SectionHeader>
              <div className="flex flex-col gap-3">
                {spellcasters.map((sc, sci) => {
                  const allSpells = [...(sc.spells ?? []), ...(sc.prepared ?? [])]
                    .filter(s => s.list.length > 0)
                    .sort((a, b) => a.spellLevel - b.spellLevel)

                  return (
                    <div key={sci} className="overflow-hidden rounded-xl border border-[#2a2826] bg-[#181412]">
                      <div className="flex items-center justify-between border-b border-[#222120] px-4 py-2.5">
                        <span className="font-display text-[0.75rem] font-semibold tracking-[0.06em] text-stone-300">{sc.name}</span>
                        <span className="font-sans text-[0.62rem] uppercase tracking-[0.1em] text-stone-600">
                          {sc.magicTradition} · {sc.spellcastingType}
                        </span>
                      </div>
                      <div className="divide-y divide-[#1e1c1a]">
                        {allSpells.map(s => (
                          <div key={s.spellLevel} className="flex gap-4 px-4 py-3">
                            <div className="w-10 shrink-0">
                              <span className="font-display text-[0.7rem] font-bold tracking-[0.08em] text-amber-500/80">
                                {s.spellLevel === 0 ? 'Can.' : `Nv.${s.spellLevel}`}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-x-3 gap-y-1">
                              {s.list.map(spell => (
                                <span key={spell} className="font-sans text-[0.76rem] text-stone-500">{spell}</span>
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

          {/* Feats grouped by type */}
          {orderedFeatTypes.length > 0 && (
            <div>
              <SectionHeader>Dotes</SectionHeader>
              <div className="flex flex-col gap-6">
                {orderedFeatTypes.map(type => (
                  <div key={type}>
                    <div className="mb-2 font-sans text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-stone-700">
                      {FEAT_TYPE_LABELS[type] ?? type}
                    </div>
                    <div className="grid gap-1 sm:grid-cols-2">
                      {featsByType[type].map(([name, , , level], i) => (
                        <div key={i} className="flex items-start gap-2.5 rounded-md border border-[#222120] bg-[#181412] px-3 py-2.5 transition-colors hover:border-[#2a2826]">
                          <div className="mt-[5px] h-1.5 w-1.5 shrink-0 rotate-45 bg-amber-500/40" />
                          <div>
                            <div className="font-sans text-[0.78rem] text-stone-300">{name}</div>
                            {level > 0 && <div className="font-sans text-[0.6rem] text-stone-700">Nv. {level}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Special abilities */}
          {build.specials && build.specials.length > 0 && (
            <div>
              <SectionHeader>Habilidades especiales</SectionHeader>
              <div className="flex flex-wrap gap-1.5">
                {build.specials.map(s => <Trait key={s} label={s} />)}
              </div>
            </div>
          )}

          {/* Highlighted rules */}
          <CharacterHighlights characterId={character._id} ownerId={ownerId} />

          {/* Character notes */}
          <CharacterNotes characterId={character._id} ownerId={ownerId} />

          {/* Notes drawer */}
          <NoteDrawer entityType="character" entityId={character._id} />

        </div>
      </div>
    </main>
  )
}
