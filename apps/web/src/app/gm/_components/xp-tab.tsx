'use client'

import { useState, useEffect, useCallback } from 'react'
import { clientFetch } from '@/lib/client-api'
import type { ApiSession, ApiEvent, ApiXpEntry } from '@/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

type XpFilter = 'pending' | 'approved' | 'rejected'

type FlatXp = ApiXpEntry & {
  eventId: string
  eventTitle: string
  sessionId: string
  sessionNumber: number
  sessionTitle: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function loadAllEvents(sessions: ApiSession[]): Promise<FlatXp[]> {
  const allEvents = await Promise.all(
    sessions.map(s =>
      fetch(`${API_URL}/sessions/${s._id}/events`)
        .then(r => r.ok ? (r.json() as Promise<ApiEvent[]>) : ([] as ApiEvent[]))
        .catch(() => [] as ApiEvent[])
    )
  )
  const result: FlatXp[] = []
  sessions.forEach((session, i) => {
    allEvents[i].forEach(event => {
      event.xp_entries.forEach(xp => {
        result.push({
          ...xp,
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
  id: XpFilter; label: string; count: number; active: boolean; onClick: () => void
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

function XpCard({
  xp,
  onReview,
  reviewing,
}: {
  xp: FlatXp
  onReview: (xp: FlatXp, status: 'approved' | 'rejected') => void
  reviewing: boolean
}) {
  return (
    <div
      className="rounded-xl border border-[#2a2826] bg-[#181412] px-5 py-4"
      style={{ animation: 'fade-in-left 0.35s ease both' }}
    >
      {/* Session › Event breadcrumb */}
      <div className="mb-2.5 flex items-center gap-1.5 text-[0.63rem] text-stone-700">
        <span className="font-display font-semibold text-amber-600/80">
          #{xp.sessionNumber}
        </span>
        <span className="truncate">{xp.sessionTitle}</span>
        <span className="shrink-0 text-[#2a2826]">›</span>
        <span className="truncate text-stone-600">{xp.eventTitle}</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-[1.4rem] font-bold leading-none text-amber-400">
              {xp.amount}
            </span>
            <span className="text-[0.65rem] uppercase tracking-[0.12em] text-stone-600">XP</span>
          </div>
          <p className="mt-1 text-[0.84rem] text-stone-300">{xp.reason}</p>
          <p className="mt-0.5 text-[0.62rem] text-stone-700">
            Enviado · {xp.submitted_by?.toString().slice(-6)}
          </p>
        </div>

        {xp.status === 'pending' ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onReview(xp, 'approved')}
              disabled={reviewing}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-[0.72rem] font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:opacity-40"
            >
              ✓ Aprobar
            </button>
            <button
              onClick={() => onReview(xp, 'rejected')}
              disabled={reviewing}
              className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-[0.72rem] font-semibold text-rose-400 transition-colors hover:bg-rose-500/20 disabled:opacity-40"
            >
              ✗ Rechazar
            </button>
          </div>
        ) : (
          <span className={`rounded border px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-[0.1em] ${
            xp.status === 'approved'
              ? 'border-emerald-500/25 bg-emerald-500/8 text-emerald-400'
              : 'border-rose-500/25 bg-rose-500/8 text-rose-400'
          }`}>
            {xp.status === 'approved' ? '✓ Aprobado' : '✗ Rechazado'}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Main tab ──────────────────────────────────────────────────────────────────

export function XpTab({ token }: { token: string }) {
  const [flat, setFlat] = useState<FlatXp[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<XpFilter>('pending')
  const [reviewing, setReviewing] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const sessions: ApiSession[] = await fetch(`${API_URL}/sessions`).then(r => r.json())
      const result = await loadAllEvents(Array.isArray(sessions) ? sessions : [])
      setFlat(result)
    } catch {
      setFlat([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleReview(xp: FlatXp, status: 'approved' | 'rejected') {
    setReviewing(xp._id)
    try {
      await clientFetch(
        `/sessions/${xp.sessionId}/events/${xp.eventId}/xp/${xp._id}/review`,
        token,
        { method: 'PATCH', body: JSON.stringify({ status }) }
      )
      setFlat(prev => prev.map(x => x._id === xp._id ? { ...x, status } : x))
    } catch { /* ignore */ } finally {
      setReviewing(null)
    }
  }

  const counts = {
    pending:  flat.filter(x => x.status === 'pending').length,
    approved: flat.filter(x => x.status === 'approved').length,
    rejected: flat.filter(x => x.status === 'rejected').length,
  }
  const totalApproved = flat
    .filter(x => x.status === 'approved')
    .reduce((sum, x) => sum + x.amount, 0)

  const filtered = flat.filter(x => x.status === filter)

  return (
    <div>
      {/* Stats summary */}
      <div className="mb-6 flex flex-wrap gap-6">
        {[
          { val: counts.pending,          lbl: 'Pendientes', color: counts.pending > 0 ? 'text-amber-400' : 'text-stone-200' },
          { val: `${totalApproved} XP`,   lbl: 'Total aprobado', color: 'text-emerald-400' },
          { val: counts.rejected,         lbl: 'Rechazados', color: 'text-stone-600' },
        ].map(({ val, lbl, color }) => (
          <div key={lbl} className="flex items-baseline gap-1.5">
            <span className={`font-display text-[1.5rem] font-bold leading-none ${color}`}>{val}</span>
            <span className="text-[0.62rem] uppercase tracking-[0.12em] text-stone-600">{lbl}</span>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="mb-5 flex border-b border-[#2a2826]">
        {(['pending', 'approved', 'rejected'] as XpFilter[]).map(id => (
          <FilterTab
            key={id}
            id={id}
            label={{ pending: 'Pendiente', approved: 'Aprobado', rejected: 'Rechazado' }[id]}
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
          <div className="mb-2 text-3xl opacity-20">⭐</div>
          <div className="font-display text-[0.85rem] font-semibold tracking-[0.08em] text-stone-600">
            {filter === 'pending'
              ? 'Sin XP pendiente de revisión'
              : `Sin XP ${filter === 'approved' ? 'aprobado' : 'rechazado'} aún`}
          </div>
          {filter === 'pending' && (
            <p className="font-body mt-1 text-[0.88rem] italic text-stone-700">
              Los players pueden enviar XP desde los eventos de sesión.
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(xp => (
            <XpCard
              key={xp._id}
              xp={xp}
              onReview={handleReview}
              reviewing={reviewing === xp._id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
