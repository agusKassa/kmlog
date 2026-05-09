import type { Metadata } from 'next'
import { NotesPanel } from './_components/notes-panel'

export const metadata: Metadata = {
  title: 'Notas — KMLog',
}

export default function NotesPage() {
  return (
    <main>
      {/* Hero */}
      <section
        className="border-b border-[#3c3330]/40 px-6 pb-6 pt-8"
        style={{ background: 'radial-gradient(ellipse 60% 80% at 50% -10%, #0a0f1a 0%, #0c0a09 60%)' }}
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-1 text-[0.68rem] font-medium uppercase tracking-[0.22em] text-stone-600">
            Campaña · King Maker Chronicles
          </div>
          <h1 className="font-display text-[clamp(1.4rem,3vw,2rem)] font-bold tracking-[0.06em] text-stone-50">
            Notas de campaña
          </h1>
          <p className="font-body mt-1 text-[0.88rem] italic text-stone-600">
            Tus notas personales — solo vos (y el GM) pueden verlas.
          </p>
        </div>
      </section>

      <NotesPanel />
    </main>
  )
}
