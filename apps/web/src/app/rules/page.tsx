import type { Metadata } from 'next'
import Link from 'next/link'
import { api, type ApiRule, type ApiRuleCategory } from '@/lib/api'
import { EmptyState } from '../_components/empty-state'
import { RuleSearchInput } from './_components/rule-search-input'
import { GmRuleActions } from './_components/gm-rule-actions'

export const metadata: Metadata = { title: 'Reglas — KMLog' }

// ── Sub-components ────────────────────────────────────────────────────────────

function CategoryChip({
  category,
  active,
  count,
}: {
  category: ApiRuleCategory
  active: boolean
  count: number
}) {
  return (
    <Link
      href={active ? '/rules' : `/rules?category=${category._id}`}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.68rem] font-medium uppercase tracking-[0.1em] transition-all ${
        active
          ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
          : 'border-[#2a2826] text-stone-600 hover:border-[#3c3330] hover:text-stone-400'
      }`}
    >
      {category.name}
      <span className={`${active ? 'text-amber-600' : 'text-stone-700'}`}>({count})</span>
    </Link>
  )
}

function RuleCard({
  rule,
  categoryName,
  index,
}: {
  rule: ApiRule
  categoryName: string
  index: number
}) {
  const preview = rule.short_description ?? rule.content
    .replace(/#{1,6}\s/g, '')
    .replace(/[*_`>~\-]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n+/g, ' ')
    .trim()
    .slice(0, 150)

  return (
    <Link
      href={`/rules/${rule._id}`}
      className="group flex flex-col gap-2.5 rounded-xl border border-[#2a2826] bg-[#181412] p-4 transition-all hover:border-amber-500/20 hover:bg-[#1e1b19]"
      style={{ animation: `fade-in-left 0.4s ease both ${index * 0.04}s` }}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-display text-[0.9rem] font-semibold leading-snug tracking-[0.04em] text-stone-100 transition-colors group-hover:text-amber-400">
          {rule.title}
        </h3>
        <div className="flex shrink-0 items-center gap-1.5">
          {rule.is_draft && (
            <span className="rounded border border-stone-600/40 bg-stone-700/20 px-1.5 py-0.5 text-[0.58rem] font-medium uppercase tracking-[0.12em] text-stone-500">
              Borrador
            </span>
          )}
          <span className="rounded border border-amber-500/20 bg-amber-500/8 px-1.5 py-0.5 text-[0.58rem] font-medium uppercase tracking-[0.12em] text-amber-500/70">
            {categoryName}
          </span>
        </div>
      </div>

      {preview && (
        <p className="font-body text-[0.78rem] italic leading-relaxed text-stone-600 line-clamp-2">
          {preview}{!rule.short_description && preview.length >= 150 ? '…' : ''}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {rule.source && (
          <span className="text-[0.63rem] tracking-[0.06em] text-stone-700">
            📖 {rule.source}
          </span>
        )}
        {rule.tags.map(tag => (
          <span
            key={tag}
            className="rounded border border-[#2a2826] bg-[#141210] px-1.5 py-0.5 text-[0.6rem] font-medium uppercase tracking-[0.1em] text-stone-600"
          >
            {tag}
          </span>
        ))}
      </div>
    </Link>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function RulesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>
}) {
  const { q, category: categoryId } = await searchParams

  const [categories, rules] = await Promise.all([
    api.rules.categories(),
    api.rules.findAll(q, categoryId),
  ])

  const allCategories = categories ?? []
  const allRules = rules ?? []

  const categoryMap = Object.fromEntries(allCategories.map(c => [c._id, c]))
  const activeCat = categoryId ? allCategories.find(c => c._id === categoryId) : null

  const countByCategory = allRules.reduce<Record<string, number>>((acc, r) => {
    acc[r.category_id] = (acc[r.category_id] ?? 0) + 1
    return acc
  }, {})

  return (
    <main>
      {/* Hero */}
      <section
        className="relative overflow-hidden border-b border-[#3c3330]/40 px-6 pb-10 pt-12"
        style={{ background: 'radial-gradient(ellipse 80% 100% at 40% -10%, #0a0f1a 0%, #0c0a09 65%)' }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(245,158,11,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.015) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="relative mx-auto max-w-7xl">
          <div className="mb-2 flex items-center gap-2 text-[0.68rem] font-medium uppercase tracking-[0.22em] text-amber-600">
            <Link href="/" className="transition-colors hover:text-amber-400">Inicio</Link>
            <span className="text-stone-700">/</span>
            <span>Reglas</span>
          </div>

          <h1 className="font-display mb-3 text-[clamp(1.6rem,3.5vw,2.6rem)] font-bold leading-tight tracking-[0.06em] text-stone-50">
            {activeCat ? activeCat.name : 'Wiki de Reglas'}
          </h1>

          <p className="font-body mb-6 text-[1rem] italic text-stone-500">
            {activeCat
              ? `Reglas de la categoría "${activeCat.name}"`
              : 'Referencia rápida de reglas de Pathfinder 2e Remaster para la campaña.'}
          </p>

          {/* Counters + search + GM action */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-5">
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-[1.4rem] font-bold leading-none text-stone-200">
                  {allRules.length}
                </span>
                <span className="text-[0.65rem] uppercase tracking-[0.15em] text-stone-600">
                  {allRules.length === 1 ? 'Regla' : 'Reglas'}
                </span>
              </div>
              {!categoryId && (
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display text-[1.4rem] font-bold leading-none text-stone-200">
                    {allCategories.filter(c => (countByCategory[c._id] ?? 0) > 0).length}
                  </span>
                  <span className="text-[0.65rem] uppercase tracking-[0.15em] text-stone-600">Categorías</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <RuleSearchInput defaultValue={q} />
              <GmRuleActions />
            </div>
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2">
            <Link
              href={q ? `/rules?q=${q}` : '/rules'}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.68rem] font-medium uppercase tracking-[0.1em] transition-all ${
                !categoryId
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                  : 'border-[#2a2826] text-stone-600 hover:border-[#3c3330] hover:text-stone-400'
              }`}
            >
              Todas ({allRules.length})
            </Link>
            {allCategories
              .filter(c => (countByCategory[c._id] ?? 0) > 0)
              .map(cat => (
                <CategoryChip
                  key={cat._id}
                  category={cat}
                  active={categoryId === cat._id}
                  count={countByCategory[cat._id] ?? 0}
                />
              ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-6 py-10">
        {!rules ? (
          <EmptyState
            icon="⚠️"
            title="Error al cargar reglas"
            description="No se pudo conectar con el servidor. Intentá recargar la página."
          />
        ) : allRules.length === 0 ? (
          <EmptyState
            icon="📖"
            title={q ? `Sin resultados para "${q}"` : activeCat ? `Sin reglas en "${activeCat.name}"` : 'Sin reglas registradas'}
            description={
              q
                ? 'Probá con otros términos de búsqueda.'
                : 'El GM aún no ha cargado reglas en la wiki de la campaña.'
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {allRules.map((rule, i) => (
              <RuleCard
                key={rule._id}
                rule={rule}
                categoryName={categoryMap[rule.category_id]?.name ?? 'Sin categoría'}
                index={i}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
