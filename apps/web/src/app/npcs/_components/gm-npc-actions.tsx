'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

export function GmNpcActions() {
  const { isGm } = useAuth()
  if (!isGm) return null

  return (
    <Link
      href="/npcs/new"
      className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-stone-950 transition-colors hover:bg-amber-400"
    >
      <Plus className="h-3.5 w-3.5" />
      Nuevo NPC
    </Link>
  )
}
