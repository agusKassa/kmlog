'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Swords, Scroll } from 'lucide-react'
import type { ApiEvent, ApiEventSession } from '@/lib/api'

// ── Label maps ─────────────────────────────────────────────────────────────

const KIND_LABEL: Record<string, string> = {
  event: 'Evento', encounter: 'Encuentro',
}

const DIFFICULTY_LABEL: Record<string, string> = {
  trivial: 'Trivial', low: 'Bajo', moderate: 'Moderado', severe: 'Severo', extreme: 'Extremo',
}

const DIFFICULTY_CLS: Record<string, string> = {
  trivial:  'text-stone-400 border-stone-500/30 bg-stone-500/10',
  low:      'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  moderate: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  severe:   'text-orange-400 border-orange-500/30 bg-orange-500/10',
  extreme:  'text-red-400 border-red-500/30 bg-red-500/10',
}

const EVENT_TYPE_LABEL: Record<string, string> = {
  exploration: 'Exploración', social: 'Social', narrative: 'Narrativa',
  rest: 'Descanso', downtime: 'Tiempo libre',
}

// ── Helpers ────────────────────────────────────────────────────────────────

function resolveSession(session_id: ApiEvent['session_id']): ApiEventSession | null {
  return typeof session_id === 'object' ? session_id : null
}

function excerpt(text: string, max = 120): string {
  return text.length > max ? text.slice(0, max).trimEnd() + '…' : text
}

// ── Component ──────────────────────────────────────────────────────────────

interface EventsCarouselProps {
  events: ApiEvent[]
}

export function EventsCarousel({ events }: EventsCarouselProps) {
  const [current, setCurrent] = useState(0)

  if (events.length === 0) return null

  const prev = () => setCurrent(i => (i - 1 + events.length) % events.length)
  const next = () => setCurrent(i => (i + 1) % events.length)

  const ev = events[current]
  const session = resolveSession(ev.session_id)
  const sessionHref = session ? `/sessions/${session._id}` : null
  const isEncounter = ev.kind === 'encounter'

  return (
    <div>
      {/* Card */}
      <div
        key={ev._id}
        className="overflow-hidden rounded-xl border border-[#2a2826] bg-[#181412]"
        style={{ animation: 'fade-up 0.25s ease both' }}
      >
        {/* Header */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#1e1c1a] px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            {isEncounter ? (
              <Swords className="h-3 w-3 text-red-400/60" />
            ) : (
              <Scroll className="h-3 w-3 text-amber-400/60" />
            )}
            <span className="text-[0.6rem] uppercase tracking-[0.18em] text-stone-600">
              {KIND_LABEL[ev.kind]}
            </span>
          </div>

          {ev.difficulty && (
            <span className={`rounded border px-1.5 py-0.5 text-[0.57rem] font-medium uppercase tracking-[0.08em] ${DIFFICULTY_CLS[ev.difficulty] ?? ''}`}>
              {DIFFICULTY_LABEL[ev.difficulty]}
            </span>
          )}

          {ev.event_type && (
            <span className="rounded border border-sky-500/20 bg-sky-500/8 px-1.5 py-0.5 text-[0.57rem] uppercase tracking-[0.08em] text-sky-400">
              {EVENT_TYPE_LABEL[ev.event_type] ?? ev.event_type}
            </span>
          )}

          {session && (
            <span className="ml-auto shrink-0 text-[0.6rem] text-stone-700">
              Ses. #{session.session_number}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="px-4 py-3.5">
          <h3 className="font-display mb-2 text-[0.9rem] font-semibold leading-snug tracking-[0.03em] text-stone-100">
            {ev.title}
          </h3>

          {ev.description ? (
            <p className="font-body text-[0.8rem] leading-relaxed text-stone-600">
              {excerpt(ev.description)}
            </p>
          ) : (
            <p className="font-body text-[0.78rem] italic text-stone-700">Sin descripción.</p>
          )}

          {sessionHref && (
            <Link
              href={sessionHref}
              className="mt-3 inline-block text-[0.7rem] text-amber-600 transition-colors hover:text-amber-400"
            >
              Ver sesión →
            </Link>
          )}
        </div>
      </div>

      {/* Navigation */}
      {events.length > 1 && (
        <div className="mt-2.5 flex items-center justify-between px-0.5">
          <button
            onClick={prev}
            aria-label="Anterior"
            className="rounded-md p-1 text-stone-700 transition-colors hover:text-stone-400"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1.5">
            {events.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Evento ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i === current ? 'w-4 bg-amber-500' : 'w-1.5 bg-[#3c3330] hover:bg-[#524844]'
                }`}
              />
            ))}
          </div>

          <button
            onClick={next}
            aria-label="Siguiente"
            className="rounded-md p-1 text-stone-700 transition-colors hover:text-stone-400"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
