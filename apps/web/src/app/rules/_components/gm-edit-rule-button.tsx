'use client'

import Link from 'next/link'
import { Pencil } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

export function GmEditRuleButton({ ruleId }: { ruleId: string }) {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) return null

  return (
    <Link
      href={`/rules/${ruleId}/edit`}
      className="mb-4 inline-flex items-center gap-1.5 rounded-lg border border-[#3c3330] bg-[#181412] px-3 py-1.5 text-[0.72rem] font-medium uppercase tracking-[0.1em] text-stone-500 transition-colors hover:border-amber-500/30 hover:text-amber-400"
    >
      <Pencil className="h-3 w-3" />
      Editar regla
    </Link>
  )
}
