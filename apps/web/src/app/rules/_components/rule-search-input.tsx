'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { Search } from 'lucide-react'

export function RuleSearchInput({ defaultValue }: { defaultValue?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const params = new URLSearchParams(searchParams.toString())
    if (e.target.value) {
      params.set('q', e.target.value)
    } else {
      params.delete('q')
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <div className="relative">
      <Search className={`absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 ${isPending ? 'text-amber-500/70' : 'text-stone-600'}`} />
      <input
        type="search"
        defaultValue={defaultValue}
        onChange={handleChange}
        placeholder="Buscar reglas..."
        className="w-full rounded-lg border border-[#2a2826] bg-[#141210] py-2 pl-9 pr-4 text-[0.82rem] text-stone-300 placeholder-stone-700 outline-none transition-colors focus:border-amber-500/30 focus:ring-1 focus:ring-amber-500/20 sm:w-72"
      />
    </div>
  )
}
