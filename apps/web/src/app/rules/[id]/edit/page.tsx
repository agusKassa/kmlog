import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { api } from '@/lib/api'
import { RuleForm } from '../../_components/rule-form'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const rule = await api.rules.findById(id)
  return { title: rule ? `Editar: ${rule.title} — KMLog` : 'Editar regla — KMLog' }
}

export default async function EditRulePage({
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

  return (
    <main>
      <section
        className="border-b border-[#3c3330]/40 px-6 pb-8 pt-10"
        style={{ background: 'radial-gradient(ellipse 60% 80% at 40% -10%, #0a0f1a 0%, #0c0a09 65%)' }}
      >
        <div className="mx-auto max-w-3xl">
          <div className="mb-3 flex items-center gap-2 text-[0.68rem] font-medium uppercase tracking-[0.22em] text-amber-600">
            <Link href="/" className="transition-colors hover:text-amber-400">Inicio</Link>
            <span className="text-stone-700">/</span>
            <Link href="/rules" className="transition-colors hover:text-amber-400">Reglas</Link>
            <span className="text-stone-700">/</span>
            <Link href={`/rules/${rule._id}`} className="max-w-[180px] truncate transition-colors hover:text-amber-400">
              {rule.title}
            </Link>
            <span className="text-stone-700">/</span>
            <span className="text-stone-500">Editar</span>
          </div>
          <h1 className="font-display text-[clamp(1.4rem,3vw,2rem)] font-bold tracking-[0.06em] text-stone-50">
            Editar regla
          </h1>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <RuleForm categories={categories ?? []} rule={rule} />
      </div>
    </main>
  )
}
