interface EmptyStateProps {
  icon: string
  title: string
  description: string
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#3c3330] px-6 py-12 text-center">
      <div className="mb-3 text-3xl opacity-40">{icon}</div>
      <div className="font-display mb-1 text-[0.85rem] font-semibold tracking-[0.08em] text-stone-500">
        {title}
      </div>
      <p className="font-body max-w-xs text-[0.9rem] italic text-stone-600">{description}</p>
    </div>
  )
}
