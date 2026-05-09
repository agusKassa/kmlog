'use client'

import { useState, useEffect, useCallback } from 'react'
import { clientFetch } from '@/lib/client-api'
import type { ApiSession, ApiEvent, ApiLootEntry, ApiCharacter } from '@/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

type LootFilter = 'unclaimed' | 'claimed' | 'party'

type FlatLoot = ApiLootEntry & {
  eventId: string
  eventTitle: string
  sessionId: string
  sessionNumber: number
  sessionTitle: string
}

const TYPE_LABEL: Record<ApiLootEntry['type'], string> = {
  weapon:     'Arma',
  armor:      'Armadura',
  consumable: 'Consumible',
  treasure:   'Tesoro',
  magic:      'Mágico',
  other:      'Otro',
}

const TYPE_COLOR: Record<ApiLootEntry['type'], string> = {
  weapon:     'text-rose-400   border-rose-500/25   bg-rose-500/8',
  armor:      'text-sky-400    border-sky-500/25    bg-sky-500/8',
  consumable: 'text-emerald-400 border-emerald-500/25 bg-emerald-500/8',
  treasure:   'text-amber-400  border-amber-500/25  bg-amber-500/8',
  magic:      'text-violet-400 border-violet-500/25 bg-violet-500/8',
  other:      'text-stone-500  border-stone-700/40  bg-stone-500/8',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function loadAllLoot(sessions: ApiSession[]): Promise<FlatLoot[]> {
  const allEvents = await Promise.all(
    sessions.map(s =>
      fetch(`${API_URL}/sessions/${s._id}/events`)
        .then(r => r.ok ? (r.json() as Promise<ApiEvent[]>) : ([] as ApiEvent[]))
        .catch(() => [] as ApiEvent[])
    )
  )
  const result: FlatLoot[] = []
  sessions.forEach((session, i) => {
    allEvents[i].forEach(event => {
      event.loot.forEach(item => {
        result.push({
          ...item,
          eventId: event._id,
          eventTitle: event.title,
          sessionId: session._id,
          sessionNumber: session.session_number,
          sessionTitle: session.title,
        })
      })
    })
  })
  return result
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FilterTab({
  id, label, count, active, onClick,
}: {
  id: LootFilter; label: string; count: number; active: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-[0.75rem] font-medium transition-colors ${
        active ? 'border-amber-500 text-amber-400' : 'border-transparent text-stone-600 hover:text-stone-400'
      }`}
    >
      {label}
      {count > 0 && (
        <span className={`rounded-full px-1.5 py-0.5 text-[0.58rem] font-bold leading-none ${
          active ? 'bg-amber-500/20 text-amber-400' : 'bg-[#232120] text-stone-600'
        }`}>
          {count}
        </span>
      )}
    </button>
  )
}

function LootCard({
  item,
  characters,
  onAssign,
  assigning,
}: {
  item: FlatLoot
  characters: ApiCharacter[]
  onAssign: (item: FlatLoot, status: 'claimed' | 'party', ownerId: string | null) => void
  assigning: boolean
}) {
  const [selectedChar, setSelectedChar] = useState<string>('')

  const owner = item.owner_character_id
    ? characters.find(c => c._id === item.owner_character_id)
    : null

  return (
    <div
      className="rounded-xl border border-[#2a2826] bg-[#181412] px-5 py-4"
      style={{ animation: 'fade-in-left 0.35s ease both' }}
    >
      {/* Session › Event breadcrumb */}
      <div className="mb-2.5 flex items-center gap-1.5 text-[0.63rem] text-stone-700">
        <span className="font-display font-semibold text-amber-600/80">
          #{item.sessionNumber}
        </span>
        <span className="truncate">{item.sessionTitle}</span>
        <span className="shrink-0 text-[#2a2826]">›</span>
        <span className="truncate text-stone-600">{item.eventTitle}</span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display text-[1rem] font-bold text-stone-100">{item.name}</span>
            {item.quantity > 1 && (
              <span className="text-[0.68rem] text-stone-600">×{item.quantity}</span>
            )}
            <span className={`rounded border px-1.5 py-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.1em] ${TYPE_COLOR[item.type]}`}>
              {TYPE_LABEL[item.type]}
            </span>
          </div>

          {item.description && (
            <p className="mt-1 text-[0.82rem] text-stone-400 line-clamp-2">{item.description}</p>
          )}

          <div className="mt-1.5 flex items-center gap-3 text-[0.65rem] text-stone-600">
            <span className="font-display font-semibold text-amber-500/70">
              {item.value_gp > 0 ? `${item.value_gp} gp` : '—'}
            </span>
            {item.status === 'claimed' && owner && (
              <span className="text-emerald-500/70">
                → {owner.build.name}
              </span>
            )}
            {item.status === 'party' && (
              <span className="text-sky-500/70">Loot de grupo</span>
            )}
          </div>
        </div>

        {item.status === 'unclaimed' ? (
          <div className="flex shrink-0 items-center gap-2">
            <select
              value={selectedChar}
              onChange={e => setSelectedChar(e.target.value)}
              disabled={assigning}
              className="rounded-lg border border-[#3c3330] bg-[#0e0c0b] px-2.5 py-1.5 text-[0.72rem] text-stone-300 focus:border-amber-500/40 focus:outline-none disabled:opacity-40"
            >
              <option value="">Personaje…</option>
              {characters.map(c => (
                <option key={c._id} value={c._id}>{c.build.name}</option>
              ))}
            </select>
            <button
              onClick={() => {
                if (selectedChar) onAssign(item, 'claimed', selectedChar)
              }}
              disabled={assigning || !selectedChar}
              className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[0.72rem] font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:opacity-40"
            >
              Asignar
            </button>
            <button
              onClick={() => onAssign(item, 'party', null)}
              disabled={assigning}
              className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-[0.72rem] font-semibold text-sky-400 transition-colors hover:bg-sky-500/20 disabled:opacity-40"
            >
              Grupal
            </button>
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-2">
            <span className={`rounded border px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-[0.1em] ${
              item.status === 'party'
                ? 'border-sky-500/25 bg-sky-500/8 text-sky-400'
                : 'border-emerald-500/25 bg-emerald-500/8 text-emerald-400'
            }`}>
              {item.status === 'party' ? '⚔ Grupal' : '✓ Asignado'}
            </span>
            <button
              onClick={() => onAssign(item, 'claimed', null)}
              disabled={assigning}
              title="Devolver a sin reclamar"
              className="rounded-lg border border-[#3c3330] px-2 py-1 text-[0.65rem] text-stone-600 transition-colors hover:border-stone-600 hover:text-stone-400 disabled:opacity-40"
            >
              ↩
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main tab ──────────────────────────────────────────────────────────────────

export function LootTab({ token }: { token: string }) {
  const [flat, setFlat] = useState<FlatLoot[]>([])
  const [characters, setCharacters] = useState<ApiCharacter[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<LootFilter>('unclaimed')
  const [assigning, setAssigning] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [sessions, chars] = await Promise.all([
        fetch(`${API_URL}/sessions`).then(r => r.json()) as Promise<ApiSession[]>,
        fetch(`${API_URL}/characters`).then(r => r.json()) as Promise<ApiCharacter[]>,
      ])
      const result = await loadAllLoot(Array.isArray(sessions) ? sessions : [])
      setFlat(result)
      setCharacters(Array.isArray(chars) ? chars : [])
    } catch {
      setFlat([])
      setCharacters([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleAssign(
    item: FlatLoot,
    status: 'claimed' | 'party',
    ownerId: string | null,
  ) {
    setAssigning(item._id)
    try {
      await clientFetch(
        `/sessions/${item.sessionId}/events/${item.eventId}/loot/${item._id}/claim`,
        token,
        {
          method: 'PATCH',
          body: JSON.stringify({
            status,
            ...(ownerId ? { owner_character_id: ownerId } : {}),
          }),
        }
      )
      setFlat(prev =>
        prev.map(x =>
          x._id === item._id
            ? { ...x, status, owner_character_id: ownerId }
            : x
        )
      )
    } catch { /* ignore */ } finally {
      setAssigning(null)
    }
  }

  async function handleUnclaim(item: FlatLoot) {
    setAssigning(item._id)
    try {
      await clientFetch(
        `/sessions/${item.sessionId}/events/${item.eventId}/loot/${item._id}/claim`,
        token,
        { method: 'PATCH', body: JSON.stringify({ status: 'unclaimed', owner_character_id: null }) }
      )
      setFlat(prev =>
        prev.map(x =>
          x._id === item._id
            ? { ...x, status: 'unclaimed', owner_character_id: null }
            : x
        )
      )
    } catch { /* ignore */ } finally {
      setAssigning(null)
    }
  }

  const counts = {
    unclaimed: flat.filter(x => x.status === 'unclaimed').length,
    claimed:   flat.filter(x => x.status === 'claimed').length,
    party:     flat.filter(x => x.status === 'party').length,
  }
  const unclaimedGp = flat
    .filter(x => x.status === 'unclaimed')
    .reduce((sum, x) => sum + x.value_gp * x.quantity, 0)
  const totalGp = flat.reduce((sum, x) => sum + x.value_gp * x.quantity, 0)

  const filtered = flat.filter(x => x.status === filter)

  function dispatchAssign(item: FlatLoot, status: 'claimed' | 'party', ownerId: string | null) {
    if (status === 'claimed' && ownerId === null) {
      handleUnclaim(item)
    } else {
      handleAssign(item, status, ownerId)
    }
  }

  return (
    <div>
      {/* Stats summary */}
      <div className="mb-6 flex flex-wrap gap-6">
        {[
          { val: counts.unclaimed,       lbl: 'Sin reclamar', color: counts.unclaimed > 0 ? 'text-amber-400' : 'text-stone-200' },
          { val: `${unclaimedGp} gp`,    lbl: 'Valor pendiente', color: 'text-amber-500' },
          { val: `${totalGp} gp`,         lbl: 'Total loot', color: 'text-stone-400' },
        ].map(({ val, lbl, color }) => (
          <div key={lbl} className="flex items-baseline gap-1.5">
            <span className={`font-display text-[1.5rem] font-bold leading-none ${color}`}>{val}</span>
            <span className="text-[0.62rem] uppercase tracking-[0.12em] text-stone-600">{lbl}</span>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="mb-5 flex border-b border-[#2a2826]">
        {(['unclaimed', 'claimed', 'party'] as LootFilter[]).map(id => (
          <FilterTab
            key={id}
            id={id}
            label={{ unclaimed: 'Sin reclamar', claimed: 'Asignado', party: 'Grupal' }[id]}
            count={counts[id]}
            active={filter === id}
            onClick={() => setFilter(id)}
          />
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-[#181412]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#3c3330] py-16 text-center">
          <div className="mb-2 text-3xl opacity-20">🎁</div>
          <div className="font-display text-[0.85rem] font-semibold tracking-[0.08em] text-stone-600">
            {filter === 'unclaimed'
              ? 'Todo el loot está reclamado'
              : filter === 'claimed'
                ? 'Ningún item asignado aún'
                : 'Sin loot de grupo'}
          </div>
          {filter === 'unclaimed' && counts.claimed + counts.party > 0 && (
            <p className="font-body mt-1 text-[0.88rem] italic text-stone-700">
              Todo el loot de la campaña ya fue distribuido.
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(item => (
            <LootCard
              key={item._id}
              item={item}
              characters={characters}
              onAssign={dispatchAssign}
              assigning={assigning === item._id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
