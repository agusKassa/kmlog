import { LoginForm } from './_components/login-form'

export const metadata = { title: 'KMLog — Ingresar' }

export default function LoginPage() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Left: atmospheric panel ── */}
      <div className="relative hidden flex-1 items-center justify-center overflow-hidden border-r border-[#3c3330]/60 lg:flex"
        style={{ background: 'radial-gradient(ellipse 90% 90% at 50% 50%, #18110a 0%, #0c0a09 75%)' }}
      >
        {/* Grid lines */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(rgba(245,158,11,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.04) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        {/* Vignette */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 70% at 50% 50%, transparent 40%, #0c0a09 100%)' }} />

        {/* Rotating rings */}
        <div className="absolute h-[520px] w-[520px] rounded-full border border-dashed border-amber-500/12" style={{ animation: 'ring-spin 160s linear infinite' }} />
        <div className="absolute h-[400px] w-[400px] rounded-full border border-dashed border-amber-500/9" style={{ animation: 'ring-spin 90s linear infinite reverse' }} />
        <div
          className="absolute h-[300px] w-[300px] rounded-full"
          style={{
            border: '1px solid transparent',
            borderTopColor: 'rgba(245,158,11,0.28)',
            borderRightColor: 'rgba(245,158,11,0.08)',
            animation: 'ring-spin 14s linear infinite',
          }}
        />

        {/* Dot on outer ring */}
        <div
          className="absolute"
          style={{
            width: '520px',
            height: '520px',
            animation: 'ring-spin 160s linear infinite',
          }}
        >
          <div className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.6)]" />
        </div>

        {/* Decorative diamonds */}
        <div className="absolute left-[20%] top-[20%] h-2 w-2 rotate-45 border border-amber-500/30 bg-amber-500/15" />
        <div className="absolute bottom-[22%] right-[18%] h-2 w-2 rotate-45 border border-amber-500/30 bg-amber-500/15" />
        <div className="absolute left-[12%] top-[55%] h-1.5 w-1.5 rotate-45 border border-amber-500/20 bg-amber-500/10" />
        <div className="absolute right-[22%] top-[25%] h-1.5 w-1.5 rotate-45 border border-amber-500/20 bg-amber-500/10" />

        {/* Content */}
        <div className="relative z-10 px-12 text-center">
          {/* Sigil */}
          <div className="mx-auto mb-7 h-[72px] w-[72px]">
            <svg viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="6" y="6" width="60" height="60" rx="6" fill="rgba(245,158,11,0.06)" stroke="rgba(245,158,11,0.35)" strokeWidth="1.5"/>
              <rect x="14" y="14" width="44" height="44" rx="3" fill="none" stroke="rgba(245,158,11,0.15)" strokeWidth="1" strokeDasharray="3 3"/>
              <line x1="22" y1="24" x2="50" y2="24" stroke="rgba(245,158,11,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="22" y1="30" x2="50" y2="30" stroke="rgba(245,158,11,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="22" y1="36" x2="44" y2="36" stroke="rgba(245,158,11,0.3)" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="22" y1="42" x2="38" y2="42" stroke="rgba(245,158,11,0.25)" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M28 54 L32 48 L36 52 L40 48 L44 54 Z" fill="rgba(245,158,11,0.15)" stroke="rgba(245,158,11,0.6)" strokeWidth="1.2" strokeLinejoin="round"/>
              <circle cx="28" cy="54" r="2" fill="rgba(245,158,11,0.7)"/>
              <circle cx="36" cy="52" r="2" fill="rgba(245,158,11,0.9)"/>
              <circle cx="44" cy="54" r="2" fill="rgba(245,158,11,0.7)"/>
            </svg>
          </div>

          <div className="font-display mb-1 text-[3.8rem] font-bold leading-none tracking-[0.12em] text-stone-50" style={{ textShadow: '0 0 60px rgba(245,158,11,0.18)' }}>
            KMLog
          </div>
          <div className="font-display mb-8 text-[0.65rem] uppercase tracking-[0.5em] text-amber-500">
            King Maker Chronicles
          </div>

          {/* Ornament */}
          <div className="mx-auto mb-6 flex max-w-[240px] items-center gap-4">
            <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, rgba(245,158,11,0.35))' }} />
            <div className="h-1.5 w-1.5 rotate-45 bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
            <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, transparent, rgba(245,158,11,0.35))' }} />
          </div>

          <p className="font-body mx-auto max-w-[280px] text-[1.2rem] italic leading-[1.8] text-stone-400">
            La crónica aguarda.<br />
            Cada sesión, un capítulo.<br />
            Cada decisión, historia.
          </p>

          <div className="mx-auto mb-0 mt-6 flex max-w-[240px] items-center gap-4">
            <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, rgba(245,158,11,0.35))' }} />
            <div className="h-1.5 w-1.5 rotate-45 bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
            <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, transparent, rgba(245,158,11,0.35))' }} />
          </div>

          <div className="mt-6 text-[0.7rem] uppercase tracking-[0.18em] text-stone-600">
            Pathfinder 2e Remaster · <span className="text-stone-500">Temporada I</span>
          </div>
        </div>
      </div>

      {/* ── Right: form ── */}
      <LoginForm />
    </div>
  )
}
