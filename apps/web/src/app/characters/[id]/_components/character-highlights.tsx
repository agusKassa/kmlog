'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Star, ExternalLink } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import type { ApiRuleHighlightPopulated } from '@/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

interface CharacterHighlightsProps {
  characterId: string
  ownerId: string
}

function HighlightCard({ highlight }: { highlight: ApiRuleHighlightPopulated }) {
  const rule = highlight.rule_id
  const isGlobal = highlight.character_id === null

  return (
    <div className="group relative flex flex-col gap-2 rounded-lg border border-[#222120] bg-[#181412] px-4 py-3.5 transition-colors hover:border-amber-500/20 hover:bg-[#1e1b19]">
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/rules/${rule._id}`}
          className="font-display text-[0.82rem] font-semibold tracking-[0.03em] text-stone-200 transition-colors hover:text-amber-400 line-clamp-1"
        >
          {rule.title}
        </Link>
        <div className="flex shrink-0 items-center gap-1.5">
          {isGlobal && (
            <span className="rounded border border-[#2a2826] bg-[#141210] px-1.5 py-0.5 text-[0.56rem] font-medium uppercase tracking-[0.1em] text-stone-600">
              Global
            </span>
          )}
          <Star className="h-3 w-3 fill-amber-500/60 text-amber-500/60" />
        </div>
      </div>

      {rule.short_description && (
        <p className="font-body text-[0.74rem] italic leading-relaxed text-stone-600 line-clamp-2">
          {rule.short_description}
        </p>
      )}

      {rule.nethys_url && (
        <a
          href={rule.nethys_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[0.65rem] text-stone-700 transition-colors hover:text-amber-400"
        >
          <ExternalLink className="h-2.5 w-2.5" />
          Archives of Nethys
        </a>
      )}
    </div>
  )
}

export function CharacterHighlights({ characterId, ownerId }: CharacterHighlightsProps) {
  const { user, token, isGm } = useAuth()
  const [highlights, setHighlights] = useState<ApiRuleHighlightPopulated[] | null>(null)
  const [loading, setLoading]       = useState(true)

  const isOwner = !!user && (user.sub === ownerId)
  const canView = isOwner || isGm

  const load = useCallback(async () => {
    if (!token || !canView) { setLoading(false); return }
    setLoading(true)
    try {
      const ownerParam = isGm ? `&owner_id=${ownerId}` : ''
      const res = await fetch(
        `${API_URL}/rule-highlights/character/${characterId}?${ownerParam}`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      if (res.ok) setHighlights(await res.json() as ApiRuleHighlightPopulated[])
    } finally {
      setLoading(false)
    }
  }, [characterId, ownerId, token, canView, isGm])

  useEffect(() => { void load() }, [load])

  // Only show the section to the owner and GM
  if (!canView) return null

  return (
    <div>
      {/* Header — matches SectionHeader pattern from parent page */}
      <div className="mb-4 flex items-center gap-3">
        <div className="h-4 w-0.5 rounded-full bg-amber-500/50" />
        <span className="font-display text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-stone-500">
          Reglas Destacadas
        </span>
        <div className="h-px w-16 bg-gradient-to-r from-[#2a2826] to-transparent" />
        {highlights && highlights.length > 0 && (
          <span className="rounded-full border border-[#2a2826] bg-[#141210] px-2 py-0.5 text-[0.6rem] text-stone-600">
            {highlights.length}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#3c3330] border-t-amber-500" />
        </div>
      ) : !highlights || highlights.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#2a2826] px-6 py-8 text-center">
          <Star className="mb-2 h-6 w-6 text-stone-700" />
          <p className="font-display text-[0.78rem] font-semibold tracking-[0.06em] text-stone-600">
            Sin reglas destacadas
          </p>
          <p className="font-body mt-1 text-[0.72rem] italic text-stone-700">
            Marcá reglas como importantes desde la{' '}
            <Link href="/rules" className="text-amber-600 hover:text-amber-400">wiki de reglas</Link>.
          </p>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {highlights.map(h => (
            <HighlightCard key={h._id} highlight={h} />
          ))}
        </div>
      )}
    </div>
  )
}
