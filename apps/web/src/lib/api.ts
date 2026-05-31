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
  backstory?: string
  is_active: boolean
  is_alive: boolean
  in_party: boolean
  current_hp: number | null
  last_synced_at: string | null
  has_pathbuilder_id?: boolean
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
  is_public: boolean
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

export interface ApiGameMap {
  _id: string
  name: string
  hex_config: {
    hex_size_px: number
    cols: number
    rows: number
    hex_size_miles: number
    travel_hours_per_day: number
    party_speed_ft: number
  }
  current_party_hex_id: string | null
  reference_image_url: string | null
  is_public: boolean
}

export interface ApiHexPointFeature {
  type: string
  position: number
  label: string | null
  location_id: string | null
}

export interface ApiHex {
  _id: string
  map_id: string
  q: number
  r: number
  terrain: string
  region: string | null
  is_discovered: boolean
  is_explored: boolean
  point_features: ApiHexPointFeature[]
  linear_features: Array<{ type: string; path: number[] }>
  party_summary: string | null
  session_ids: string[]
  location_ids: string[]
}

export interface ApiLocation {
  _id: string
  name: string
  type: string
  parent_location_id: string | null
  discovered_in_session_id: string | null
  public_description: string
  public_image_urls: string[]
  visibility: {
    mode: string
    allowed_user_ids: string[]
  }
}

export const api = {
  sessions: {
    findAll: () => apiFetch<ApiSession[]>('/sessions'),
    findById: (id: string) => apiFetch<ApiSession>(`/sessions/${id}`),
  },
  characters: {
    findAll: () => apiFetch<ApiCharacter[]>('/characters', { next: { revalidate: 0 } }),
    findById: (id: string) => apiFetch<ApiCharacter>(`/characters/${id}`, { next: { revalidate: 0 } }),
  },
  partyState: {
    get: () => apiFetch<ApiPartyState>('/party-state'),
  },
  maps: {
    findAll: () => apiFetch<ApiGameMap[]>('/maps'),
    findById: (id: string) => apiFetch<ApiGameMap>(`/maps/${id}`),
  },
  hexes: {
    findByMap: (mapId: string) => apiFetch<ApiHex[]>(`/maps/${mapId}/hexes`),
  },
  locations: {
    findAll: () => apiFetch<ApiLocation[]>('/locations'),
    findById: (id: string) => apiFetch<ApiLocation>(`/locations/${id}`),
  },
  npcs: {
    findAll: () => apiFetch<ApiNpc[]>('/npcs'),
    findById: (id: string) => apiFetch<ApiNpc>(`/npcs/${id}`),
    findAllGm: (token: string) => apiFetch<ApiNpc[]>('/npcs', { headers: { Authorization: `Bearer ${token}` } }),
  },
  users: {
    me: (token: string) => apiFetch<ApiUser>('/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    }),
  },
  events: {
    findBySession: (sessionId: string) => apiFetch<ApiEvent[]>(`/sessions/${sessionId}/events`),
    recent: (limit = 5) => apiFetch<ApiEvent[]>(`/events/recent?limit=${limit}`, { next: { revalidate: 60 } }),
  },
  notes: {
    byCharacter: (characterId: string) =>
      apiFetch<ApiNote[]>(`/notes/by-character/${characterId}`, { next: { revalidate: 0 } }),
  },
  rules: {
    findAll: (q?: string, categoryId?: string) => {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (categoryId) params.set('category', categoryId)
      const qs = params.toString()
      return apiFetch<ApiRule[]>(`/rules${qs ? `?${qs}` : ''}`)
    },
    findById: (id: string) => apiFetch<ApiRule>(`/rules/${id}`),
    categories: () => apiFetch<ApiRuleCategory[]>('/rules/categories'),
  },
  ruleHighlights: {
    my: (ruleId?: string, token?: string) => {
      const qs = ruleId ? `?rule_id=${ruleId}` : ''
      return apiFetch<ApiRuleHighlight[]>(`/rule-highlights/my${qs}`, {
        next: { revalidate: 0 },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
    },
    byRule: (ruleId: string, token: string) =>
      apiFetch<ApiRuleHighlight[]>(`/rule-highlights/rule/${ruleId}`, {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 0 },
      }),
    byCharacter: (characterId: string, token: string) =>
      apiFetch<ApiRuleHighlight[]>(`/rule-highlights/character/${characterId}`, {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 0 },
      }),
  },
}

export interface ApiXpEntry {
  _id: string
  amount: number
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  submitted_by: string
  reviewed_by: string | null
  reviewed_at: string | null
}

export interface ApiLootEntry {
  _id: string
  name: string
  type: 'weapon' | 'armor' | 'consumable' | 'treasure' | 'magic' | 'other'
  value_gp: number
  quantity: number
  description: string
  status: 'unclaimed' | 'claimed' | 'party'
  owner_character_id: string | null
}

export interface ApiEventSession {
  _id: string
  session_number: number
  title: string
  date_played: string | null
}

export interface ApiEvent {
  _id: string
  session_id: string | ApiEventSession
  kind: 'event' | 'encounter'
  event_type: string | null
  difficulty: string | null
  title: string
  description: string
  order: number
  xp_entries: ApiXpEntry[]
  loot: ApiLootEntry[]
}

export interface ApiUser {
  _id: string
  email: string
  username: string
  role: 'gm' | 'player'
  character_id: string | null
  createdAt: string
}

export interface ApiRuleCategory {
  _id: string
  name: string
  slug: string
  is_default: boolean
}

export interface ApiRuleHighlight {
  _id: string
  rule_id: string
  user_id: string
  character_id: string | null
  assigned_by: string
  createdAt: string
}

export interface ApiRuleHighlightPopulated {
  _id: string
  rule_id: {
    _id: string
    title: string
    short_description: string | null
    category_id: string
    nethys_url: string | null
    is_draft: boolean
  }
  user_id: string
  character_id: string | null
  assigned_by: string
  createdAt: string
}

export interface ApiRule {
  _id: string
  title: string
  category_id: string
  content: string
  short_description: string | null
  tags: string[]
  source: string | null
  nethys_url: string | null
  is_public: boolean
  is_draft: boolean
  createdAt: string
  updatedAt: string
}

export interface ApiNpc {
  _id: string
  name: string
  role: 'ally' | 'enemy' | 'neutral' | 'unknown'
  is_alive: boolean
  is_with_party: boolean
  portrait_url: string | null
  public_description: string
  public_image_urls: string[]
  gm_notes?: string
  true_motives?: string
  stats?: Record<string, unknown> | null
  location_id: string | null
  first_seen_session_id: string | null
  last_seen_hex_id: string | null
  last_seen_description: string
  last_seen_at: string | null
  createdAt: string
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
