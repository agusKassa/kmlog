'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, Edit3, ExternalLink } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import type { ApiRule, ApiRuleCategory } from '@/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

const CONTENT_TEMPLATE = `## Descripción

Resumen de la regla.

## Cómo funciona

- Paso o condición 1
- Paso o condición 2

## Ejemplos

> Ejemplo de aplicación durante el juego.

## Notas

Aclaraciones adicionales, excepciones o interacciones con otras reglas.
`

interface RuleFormProps {
  categories: ApiRuleCategory[]
  rule?: ApiRule
}

function MarkdownPreview({ content }: { content: string }) {
  if (!content.trim()) {
    return (
      <p className="font-body italic text-stone-700 text-[0.82rem]">
        El preview aparecerá aquí...
      </p>
    )
  }

  const lines = content.split('\n')
  return (
    <div className="font-body space-y-2 text-[0.85rem] leading-relaxed text-stone-400">
      {lines.map((line, i) => {
        if (/^# /.test(line))
          return <h2 key={i} className="font-display pt-1 text-[1rem] font-bold text-stone-100">{line.slice(2)}</h2>
        if (/^## /.test(line))
          return <h3 key={i} className="font-display text-[0.9rem] font-semibold text-stone-200">{line.slice(3)}</h3>
        if (/^### /.test(line))
          return <h4 key={i} className="font-display text-[0.82rem] font-semibold text-stone-300">{line.slice(4)}</h4>
        if (/^[-*] /.test(line))
          return <li key={i} className="ml-4 list-disc text-stone-500 marker:text-amber-700">{line.slice(2)}</li>
        if (/^\d+\. /.test(line))
          return <li key={i} className="ml-4 list-decimal text-stone-500">{line.replace(/^\d+\. /, '')}</li>
        if (/^> /.test(line))
          return <blockquote key={i} className="border-l-2 border-amber-700/40 pl-3 italic text-stone-600">{line.slice(2)}</blockquote>
        if (line.trim() === '')
          return <div key={i} className="h-1" />
        return <p key={i} className="text-stone-400">{line}</p>
      })}
    </div>
  )
}

export function RuleForm({ categories, rule }: RuleFormProps) {
  const router = useRouter()
  const { token } = useAuth()
  const [isPending, startTransition] = useTransition()

  const isEdit = !!rule

  const [title, setTitle]                   = useState(rule?.title ?? '')
  const [categoryId, setCategoryId]         = useState(rule?.category_id ?? (categories[0]?._id ?? ''))
  const [shortDescription, setShortDescription] = useState(rule?.short_description ?? '')
  const [content, setContent]               = useState(rule?.content ?? (isEdit ? '' : CONTENT_TEMPLATE))
  const [source, setSource]                 = useState(rule?.source ?? '')
  const [nethysUrl, setNethysUrl]           = useState(rule?.nethys_url ?? '')
  const [tagsInput, setTagsInput]           = useState(rule?.tags.join(', ') ?? '')
  const [isPublic, setIsPublic]             = useState(rule?.is_public ?? true)
  const [isDraft, setIsDraft]               = useState(rule?.is_draft ?? false)
  const [preview, setPreview]               = useState(false)
  const [error, setError]                   = useState<string | null>(null)
  const [draftWarning, setDraftWarning]     = useState<string | null>(null)

  function validateNethysUrl(url: string): boolean {
    if (!url.trim()) return true
    try { new URL(url); return true } catch { return false }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setDraftWarning(null)

    if (!token) { setError('Sesión expirada. Volvé a ingresar.'); return }

    if (nethysUrl.trim() && !validateNethysUrl(nethysUrl)) {
      setError('La URL de Archives of Nethys no es válida.')
      return
    }

    // Auto-draft if trying to publish without short_description
    let effectiveIsDraft = isDraft
    let warning: string | null = null
    if (!isDraft && !shortDescription.trim()) {
      effectiveIsDraft = true
      warning = 'La regla se guardó como borrador porque falta la descripción corta.'
    }

    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean)

    const body = {
      title,
      category_id: categoryId,
      content,
      short_description: shortDescription.trim() || null,
      source: source.trim() || null,
      nethys_url: nethysUrl.trim() || null,
      tags,
      is_public: isPublic,
      is_draft: effectiveIsDraft,
    }

    startTransition(async () => {
      try {
        const url = isEdit ? `${API_URL}/rules/${rule._id}` : `${API_URL}/rules`
        const res = await fetch(url, {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError((data as { message?: string }).message ?? 'Error al guardar la regla.')
          return
        }

        const saved = await res.json() as { _id: string }

        if (warning) {
          setIsDraft(true)
          setDraftWarning(warning)
          router.refresh()
          router.push(`/rules/${saved._id}`)
        } else {
          router.push(`/rules/${saved._id}`)
          router.refresh()
        }
      } catch {
        setError('Error de red. Verificá tu conexión.')
      }
    })
  }

  const inputCls = 'w-full rounded-lg border border-[#2a2826] bg-[#141210] px-3.5 py-2.5 text-[0.85rem] text-stone-200 placeholder-stone-700 outline-none transition-colors focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20'
  const labelCls = 'mb-1.5 block text-[0.68rem] font-medium uppercase tracking-[0.15em] text-stone-500'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Draft banner */}
      {isDraft && (
        <div className="flex items-center gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/6 px-4 py-2.5">
          <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-amber-500">
            Borrador
          </span>
          <span className="text-[0.78rem] text-stone-500">
            Esta regla solo es visible para el GM hasta que se publique.
          </span>
        </div>
      )}

      {/* Title + Category row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className={labelCls}>Título *</label>
          <input
            type="text"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="ej: Regla de ataque de oportunidad"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Categoría *</label>
          <select
            required
            value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
            className={inputCls}
          >
            {categories.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Short description */}
      <div>
        <label className={labelCls}>
          Descripción corta
          <span className="ml-1.5 text-stone-700">(requerida para publicar)</span>
        </label>
        <input
          type="text"
          value={shortDescription}
          onChange={e => setShortDescription(e.target.value)}
          placeholder="ej: Permite reaccionar a un enemigo que abandona tu alcance cuerpo a cuerpo."
          className={inputCls}
          maxLength={200}
        />
        <p className="mt-1 text-[0.65rem] text-stone-700">
          {shortDescription.length}/200 · Aparece como resumen en la lista y en el detalle.
        </p>
      </div>

      {/* Content — split editor/preview */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className={labelCls + ' mb-0'}>Contenido (Markdown) *</label>
          <button
            type="button"
            onClick={() => setPreview(v => !v)}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[0.68rem] font-medium uppercase tracking-[0.1em] text-stone-500 transition-colors hover:bg-[#1e1c1a] hover:text-amber-400"
          >
            {preview ? <Edit3 className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {preview ? 'Editar' : 'Preview'}
          </button>
        </div>

        {preview ? (
          <div className="min-h-[280px] rounded-lg border border-[#2a2826] bg-[#141210] p-4">
            <MarkdownPreview content={content} />
          </div>
        ) : (
          <textarea
            required
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={14}
            className={inputCls + ' resize-y font-mono text-[0.8rem] leading-relaxed'}
          />
        )}
      </div>

      {/* Source + Nethys URL row */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Fuente (opcional)</label>
          <input
            type="text"
            value={source}
            onChange={e => setSource(e.target.value)}
            placeholder="ej: Core Rulebook p. 470"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls + ' flex items-center gap-1'}>
            <ExternalLink className="h-2.5 w-2.5" />
            Archives of Nethys (opcional)
          </label>
          <input
            type="url"
            value={nethysUrl}
            onChange={e => setNethysUrl(e.target.value)}
            placeholder="https://2e.aonprd.com/Rules.aspx?ID=..."
            className={inputCls}
          />
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className={labelCls}>Tags (separados por coma)</label>
        <input
          type="text"
          value={tagsInput}
          onChange={e => setTagsInput(e.target.value)}
          placeholder="ej: acción, reacción, movimiento"
          className={inputCls}
        />
      </div>

      {/* Visibility + Draft row */}
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={isPublic}
            onClick={() => setIsPublic(v => !v)}
            className={`relative h-5 w-9 rounded-full border transition-colors ${
              isPublic ? 'border-amber-500/40 bg-amber-500/20' : 'border-[#3c3330] bg-[#1e1c1a]'
            }`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full border transition-all ${
                isPublic
                  ? 'left-[18px] border-amber-500/60 bg-amber-500'
                  : 'left-0.5 border-[#3c3330] bg-stone-600'
              }`}
            />
          </button>
          <span className="text-[0.8rem] text-stone-400">
            {isPublic ? 'Visible para todos los jugadores' : 'Solo visible para el GM'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={isDraft}
            onClick={() => setIsDraft(v => !v)}
            className={`relative h-5 w-9 rounded-full border transition-colors ${
              isDraft ? 'border-stone-500/40 bg-stone-500/20' : 'border-[#3c3330] bg-[#1e1c1a]'
            }`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full border transition-all ${
                isDraft
                  ? 'left-[18px] border-stone-400/60 bg-stone-400'
                  : 'left-0.5 border-[#3c3330] bg-stone-600'
              }`}
            />
          </button>
          <span className="text-[0.8rem] text-stone-400">
            {isDraft ? 'Guardar como borrador' : 'Publicar al guardar'}
          </span>
        </div>
      </div>

      {/* Draft warning */}
      {draftWarning && (
        <p className="rounded-lg border border-amber-500/20 bg-amber-500/6 px-4 py-3 text-[0.8rem] text-amber-400">
          ⚠ {draftWarning}
        </p>
      )}

      {/* Error */}
      {error && (
        <p className="rounded-lg border border-red-500/20 bg-red-500/8 px-4 py-3 text-[0.8rem] text-red-400">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 border-t border-[#2a2826] pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-amber-500 px-5 py-2.5 text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-stone-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : isDraft ? 'Crear borrador' : 'Crear regla'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2.5 text-[0.75rem] font-medium uppercase tracking-[0.12em] text-stone-500 transition-colors hover:text-stone-300"
        >
          Cancelar
        </button>
      </div>

    </form>
  )
}
