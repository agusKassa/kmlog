'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { Star, ChevronDown, Users, User, X } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import type { ApiRuleHighlight, ApiCharacter } from '@/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

interface RuleHighlightButtonProps {
  ruleId: string
}

type ScopeOption =
  | { type: 'all' }
  | { type: 'character'; characterId: string; characterName: string }

async function fetchMyHighlights(ruleId: string, token: string): Promise<ApiRuleHighlight[]> {
  const res = await fetch(`${API_URL}/rule-highlights/my?rule_id=${ruleId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return []
  return res.json()
}

async function fetchMyCharacters(token: string): Promise<ApiCharacter[]> {
  const res = await fetch(`${API_URL}/characters`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return []
  return res.json()
}

function getScopeLabel(highlight: ApiRuleHighlight): string {
  return highlight.character_id ? 'personaje específico' : 'todos tus personajes'
}

export function RuleHighlightButton({ ruleId }: RuleHighlightButtonProps) {
  const { user, token, isAuthenticated, loading } = useAuth()
  const [highlights, setHighlights]     = useState<ApiRuleHighlight[]>([])
  const [characters, setCharacters]     = useState<ApiCharacter[] | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [isPending, startTransition]    = useTransition()
  const [error, setError]               = useState<string | null>(null)
  const dropdownRef                     = useRef<HTMLDivElement>(null)

  // Load current highlights
  useEffect(() => {
    if (!token) return
    fetchMyHighlights(ruleId, token).then(setHighlights)
  }, [ruleId, token])

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  // Lazy-load characters when dropdown opens
  async function handleOpenDropdown() {
    setDropdownOpen(v => !v)
    if (characters === null && token) {
      const all = await fetchMyCharacters(token)
      // Filter to own characters
      const mine = all.filter(c => {
        const uid = typeof c.user_id === 'string' ? c.user_id : c.user_id._id
        return uid === user?.sub
      })
      setCharacters(mine)
    }
  }

  async function addHighlight(scope: ScopeOption) {
    if (!token) return
    setError(null)
    setDropdownOpen(false)

    startTransition(async () => {
      const body: Record<string, string> = { rule_id: ruleId }
      if (scope.type === 'character') body['character_id'] = scope.characterId

      const res = await fetch(`${API_URL}/rule-highlights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError((data as { message?: string }).message ?? 'Error al destacar la regla.')
        return
      }

      const newHighlight = await res.json() as ApiRuleHighlight
      setHighlights(prev => [...prev, newHighlight])
    })
  }

  async function removeHighlight(highlightId: string) {
    if (!token) return
    setError(null)

    startTransition(async () => {
      const res = await fetch(`${API_URL}/rule-highlights/${highlightId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok && res.status !== 204) {
        setError('No se pudo quitar el destaque.')
        return
      }
      setHighlights(prev => prev.filter(h => h._id !== highlightId))
    })
  }

  if (loading || !isAuthenticated) return null

  const hasHighlights = highlights.length > 0
  const isHighlightedForAll = highlights.some(h => h.character_id === null)

  return (
    <div className="relative inline-flex flex-col gap-2">

      {/* Active highlights — chips */}
      {hasHighlights && (
        <div className="flex flex-wrap gap-1.5">
          {highlights.map(h => (
            <span
              key={h._id}
              className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[0.65rem] font-medium text-amber-400"
            >
              <Star className="h-2.5 w-2.5 fill-amber-400" />
              Destacada · {getScopeLabel(h)}
              <button
                onClick={() => removeHighlight(h._id)}
                disabled={isPending}
                className="ml-0.5 rounded-full text-amber-500/60 transition-colors hover:text-amber-300 disabled:opacity-40"
                aria-label="Quitar destaque"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Add highlight button */}
      <div ref={dropdownRef} className="relative inline-flex">
        <button
          onClick={handleOpenDropdown}
          disabled={isPending}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[0.72rem] font-medium transition-all disabled:opacity-50 ${
            hasHighlights
              ? 'border-amber-500/30 bg-amber-500/8 text-amber-500 hover:bg-amber-500/15'
              : 'border-[#2a2826] bg-[#181412] text-stone-500 hover:border-amber-500/20 hover:text-amber-400'
          }`}
        >
          <Star className={`h-3.5 w-3.5 ${hasHighlights ? 'fill-amber-500' : ''}`} />
          {hasHighlights ? 'Destacar más' : 'Destacar'}
          <ChevronDown className={`h-3 w-3 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown */}
        {dropdownOpen && (
          <div className="absolute left-0 top-full z-20 mt-1.5 min-w-[220px] rounded-xl border border-[#2a2826] bg-[#181412] py-1 shadow-xl">
            <p className="px-3 py-1.5 text-[0.6rem] font-medium uppercase tracking-[0.15em] text-stone-600">
              Alcance
            </p>

            {/* All characters */}
            <button
              onClick={() => addHighlight({ type: 'all' })}
              disabled={isHighlightedForAll}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[0.78rem] text-stone-300 transition-colors hover:bg-[#1e1c1a] hover:text-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Users className="h-3.5 w-3.5 shrink-0 text-stone-600" />
              <span>Todos mis personajes</span>
              {isHighlightedForAll && (
                <Star className="ml-auto h-3 w-3 shrink-0 fill-amber-500 text-amber-500" />
              )}
            </button>

            {/* Character list */}
            {characters === null ? (
              <p className="px-3 py-2 text-[0.72rem] italic text-stone-700">Cargando personajes...</p>
            ) : characters.length > 0 ? (
              <>
                <div className="my-1 border-t border-[#2a2826]" />
                {characters.map(c => {
                  const isHighlightedForChar = highlights.some(h => h.character_id === c._id)
                  return (
                    <button
                      key={c._id}
                      onClick={() => addHighlight({ type: 'character', characterId: c._id, characterName: c.build.name })}
                      disabled={isHighlightedForChar}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[0.78rem] text-stone-300 transition-colors hover:bg-[#1e1c1a] hover:text-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <User className="h-3.5 w-3.5 shrink-0 text-stone-600" />
                      <span className="truncate">{c.build.name}</span>
                      {isHighlightedForChar && (
                        <Star className="ml-auto h-3 w-3 shrink-0 fill-amber-500 text-amber-500" />
                      )}
                    </button>
                  )
                })}
              </>
            ) : null}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-[0.72rem] text-red-400">{error}</p>
      )}
    </div>
  )
}
