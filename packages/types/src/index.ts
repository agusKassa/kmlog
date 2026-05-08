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

export type MentionEntityType = 'character' | 'npc' | 'location' | 'session' | 'hex'

// ── Hex map types ─────────────────────────────────────────────────────────────

export type TerrainType =
  | 'plains' | 'hills' | 'forest' | 'swamp' | 'mountains'
  | 'desert' | 'tundra' | 'lake' | 'ocean' | 'other'

// 0 = center, 1-6 = vertices of a pointy-top hex (1 = top, clockwise)
export type HexPoint = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type HexFeatureType =
  | 'city' | 'town' | 'village' | 'dungeon' | 'cave'
  | 'ruins' | 'fortress' | 'temple' | 'mine' | 'landmark' | 'other'

export type LinearFeatureType =
  | 'river' | 'stream' | 'road' | 'trail' | 'cliff' | 'coastline' | 'wall' | 'bridge'

export interface HexPointFeature {
  type: HexFeatureType
  position: HexPoint
  label: string | null
  location_id: string | null
}

export interface HexLinearFeature {
  type: LinearFeatureType
  path: HexPoint[]  // e.g. [6, 0, 3] = enters NW, through center, exits SE
}

export interface MapHexConfig {
  hex_size_px: number
  cols: number
  rows: number
  hex_size_miles: number
  travel_hours_per_day: number
  party_speed_ft: number
}

// ── Rules types ───────────────────────────────────────────────────────────────

export const DEFAULT_RULE_CATEGORIES = [
  'combat', 'exploration', 'social', 'conditions',
  'ancestry', 'class', 'magic', 'items', 'house-rules', 'general',
] as const

export type DefaultRuleCategorySlug = typeof DEFAULT_RULE_CATEGORIES[number]

// ── Pathbuilder2e export format (pathbuilder2e.com/json.php?id={id}) ──────────

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
