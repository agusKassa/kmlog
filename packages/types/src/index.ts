export type UserRole = 'gm' | 'player'

export type LootStatus = 'unclaimed' | 'claimed' | 'party'
export type LootType = 'weapon' | 'armor' | 'consumable' | 'treasure' | 'magic' | 'other'

export type XpStatus = 'pending' | 'approved' | 'rejected'

export type SessionStatus = 'draft' | 'played' | 'published'

export type EventKind = 'event' | 'encounter'
export type EventType = 'exploration' | 'social' | 'narrative' | 'rest' | 'downtime'
export type EncounterDifficulty = 'trivial' | 'low' | 'moderate' | 'severe' | 'extreme'

export type LocationVisibilityMode = 'public' | 'party' | 'gm_only' | 'custom'
export type LocationType = 'city' | 'dungeon' | 'wilderness' | 'building' | 'region' | 'other'

export type NpcRole = 'ally' | 'enemy' | 'neutral' | 'unknown'

export type MentionEntityType = 'character' | 'npc' | 'location' | 'session'

// Pathbuilder2e export format (pathbuilder2e.com/json.php?id={id})
export interface PathbuilderBuild {
  name: string
  class: string
  dualClass: string | null
  level: number
  ancestry: string
  heritage: string
  background: string
  alignment: string
  gender: string
  age: string
  deity: string
  size: number
  sizeName: string
  keyability: string
  languages: string[]
  attributes: {
    ancestryhp: number
    classhp: number
    bonushp: number
    bonushpPerLevel: number
    speed: number
    speedBonus: number
  }
  abilities: {
    str: number
    dex: number
    con: number
    int: number
    wis: number
    cha: number
  }
  proficiencies: Record<string, number>
  feats: [string, string | null, string, number, string][]
  specials: string[]
  lores: [string, number][]
  equipment: unknown[]
  weapons: PathbuilderWeapon[]
  armor: PathbuilderArmor[]
  spellCasters: PathbuilderSpellCaster[]
  focusPoints: number
  money: { pp: number; gp: number; sp: number; cp: number }
  formula: unknown[]
  pets: unknown[]
  familiars: unknown[]
}

export interface PathbuilderWeapon {
  name: string
  qty: number
  prof: string
  die: string
  pot: number
  str: string
  mat: string | null
  display: string
  runes: string[]
  damageType: string
  attack: number
  damageBonus: number
  extraDamage: string[]
  normalDie: string
}

export interface PathbuilderArmor {
  name: string
  qty: number
  prof: string
  pot: number
  res: string
  mat: string | null
  display: string
  worn: boolean
  runes: string[]
}

export interface PathbuilderSpellCaster {
  name: string
  magicTradition: string
  spellcastingType: string
  proficiency: number
  focusPoints: number
  innate: boolean
  perDay: number[]
  spells: { spellLevel: number; list: string[] }[]
  prepared: { spellLevel: number; list: string[] }[]
}
