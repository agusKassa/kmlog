import type { Metadata } from 'next'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { notFound } from 'next/navigation'
import { api, formatDate } from '@/lib/api'
import { GmEditRuleButton } from '../_components/gm-edit-rule-button'
import { RuleHighlightButton } from '../_components/rule-highlight-button'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const rule = await api.rules.findById(id)
  return { title: rule ? `${rule.title} — KMLog` : 'Regla — KMLog' }
}

// ── Markdown renderer (simple, no dependencies) ───────────────────────────────

function RuleContent({ content }: { content: string }) {
  const lines = content.split('\n')

  return (
    <div className="font-body space-y-3 text-[0.9rem] leading-relaxed text-stone-400">
      {lines.map((line, i) => {
        if (/^#{1}\s/.test(line)) {
          return (
            <h2 key={i} className="font-display pt-2 text-[1.1rem] font-bold tracking-[0.05em] text-stone-100">
              {line.replace(/^#\s/, '')}
            </h2>
          )
        }
        if (/^#{2}\s/.test(line)) {
          return (
            <h3 key={i} className="font-display pt-1 text-[0.95rem] font-semibold tracking-[0.04em] text-stone-200">
              {line.replace(/^##\s/, '')}
            </h3>
          )
        }
        if (/^#{3}\s/.test(line)) {
          return (
            <h4 key={i} className="font-display text-[0.85rem] font-semibold tracking-[0.04em] text-stone-300">
              {line.replace(/^###\s/, '')}
            </h4>
          )
        }
        if (/^[-*]\s/.test(line)) {
          return (
            <li key={i} className="ml-4 list-disc text-stone-500 marker:text-amber-700">
              {line.replace(/^[-*]\s/, '')}
            </li>
          )
        }
        if (/^\d+\.\s/.test(line)) {
          return (
            <li key={i} className="ml-4 list-decimal text-stone-500">
              {line.replace(/^\d+\.\s/, '')}
            </li>
          )
        }
        if (line.trim() === '') {
          return <div key={i} className="h-1" />
        }
        if (/^>/.test(line)) {
          return (
            <blockquote
              key={i}
              className="border-l-2 border-amber-700/40 pl-4 italic text-stone-600"
            >
              {line.replace(/^>\s?/, '')}
            </blockquote>
          )
        }
        return (
          <p key={i} className="text-stone-400">
            {line}
          </p>
        )
      })}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function RulePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [rule, categories] = await Promise.all([
    api.rules.findById(id),
    api.rules.categories(),
  ])

  if (!rule) notFound()

  const category = categories?.find(c => c._id === rule.category_id)

  return (
    <main>
      {/* Hero */}
      <section
        className="border-b border-[#3c3330]/40 px-6 pb-8 pt-10"
        style={{ background: 'radial-gradient(ellipse 60% 80% at 40% -10%, #0a0f1a 0%, #0c0a09 65%)' }}
      >
        <div className="mx-auto max-w-3xl">
          {/* Breadcrumb */}
          <div className="mb-3 flex items-center gap-2 text-[0.68rem] font-medium uppercase tracking-[0.22em] text-amber-600">
            <Link href="/" className="transition-colors hover:text-amber-400">Inicio</Link>
            <span className="text-stone-700">/</span>
            <Link href="/rules" className="transition-colors hover:text-amber-400">Reglas</Link>
            <span className="text-stone-700">/</span>
            <span className="text-stone-500 truncate max-w-[200px]">{rule.title}</span>
          </div>

          {rule.is_draft && (
            <div className="mb-3 inline-flex items-center gap-1.5 rounded border border-stone-600/40 bg-stone-700/20 px-2 py-0.5">
              <span className="text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-stone-400">Borrador</span>
              <span className="text-[0.62rem] text-stone-600">— solo visible para el GM</span>
            </div>
          )}

          <h1 className="font-display mb-2 text-[clamp(1.4rem,3vw,2rem)] font-bold leading-tight tracking-[0.06em] text-stone-50">
            {rule.title}
          </h1>

          {rule.short_description && (
            <p className="font-body mb-4 text-[0.95rem] italic leading-relaxed text-stone-500">
              {rule.short_description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <GmEditRuleButton ruleId={rule._id} />
            <RuleHighlightButton ruleId={rule._id} />
          </div>

          {/* Meta row */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {category && (
              <Link
                href={`/rules?category=${category._id}`}
                className="rounded border border-amber-500/20 bg-amber-500/8 px-2 py-0.5 text-[0.62rem] font-medium uppercase tracking-[0.12em] text-amber-500/80 transition-colors hover:border-amber-500/40 hover:text-amber-400"
              >
                {category.name}
              </Link>
            )}
            {rule.nethys_url && (
              <a
                href={rule.nethys_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[0.7rem] text-stone-600 transition-colors hover:text-amber-400"
              >
                <ExternalLink className="h-3 w-3" />
                Archives of Nethys
              </a>
            )}
            {rule.source && (
              <span className="text-[0.7rem] text-stone-600">
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
            <span className="ml-auto text-[0.65rem] text-stone-700">
              Actualizado {formatDate(rule.updatedAt)}
            </span>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="rounded-xl border border-[#2a2826] bg-[#181412] p-6">
          <RuleContent content={rule.content} />
        </div>

        <div className="mt-6">
          <Link
            href="/rules"
            className="text-[0.78rem] text-stone-600 transition-colors hover:text-amber-400"
          >
            ← Volver a Reglas
          </Link>
        </div>
      </div>
    </main>
  )
}
