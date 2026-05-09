const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

export type SessionStatus = 'draft' | 'played' | 'published'

export interface ApiSession {
  _id: string
  session_number: number
  title: string
  date_played: string | null
  summary: string
  preamble: string
  status: SessionStatus
  attendees: Array<string | { _id: string; build: { name: string } }>
  createdAt: string
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
}

export interface ApiCharacter {
  _id: string
  portrait_url: string | null
  public_bio: string
  is_active: boolean
  user_id: { _id: string; username: string } | string
  build: PathbuilderBuild
}

export type MentionEntityType = 'character' | 'npc' | 'location' | 'session' | 'hex'

export interface ApiNoteMention {
  entity_type: MentionEntityType
  entity_id: string
}

export interface ApiNote {
  _id: string
  author_id: string
  title: string | null
  content: string
  mentions: ApiNoteMention[]
  createdAt: string
  updatedAt: string
}

export interface ApiPartyStateVersion {
  content: string
  updated_by: string
  updated_at: string
  version_note: string | null
}

export interface ApiPartyState {
  _id: string
  current_content: string
  versions: ApiPartyStateVersion[]
  updated_at: string | null
  last_updated_by: string | null
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      next: { revalidate: 60 },
      ...options,
    })
    if (!res.ok) return null
    return res.json() as Promise<T>
  } catch {
    return null
  }
}

export const api = {
  sessions: {
    findAll: () => apiFetch<ApiSession[]>('/sessions'),
    findById: (id: string) => apiFetch<ApiSession>(`/sessions/${id}`),
  },
  characters: {
    findAll: () => apiFetch<ApiCharacter[]>('/characters'),
    findById: (id: string) => apiFetch<ApiCharacter>(`/characters/${id}`),
  },
  partyState: {
    get: () => apiFetch<ApiPartyState>('/party-state'),
  },
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** PF2e ability modifier from score */
export function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2)
}

/** Format modifier with sign: +3, -1, +0 */
export function fmtMod(score: number): string {
  const m = abilityMod(score)
  return m >= 0 ? `+${m}` : `${m}`
}
