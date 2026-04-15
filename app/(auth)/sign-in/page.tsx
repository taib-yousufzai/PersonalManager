import SignInForm from './SignInForm'

export default function SignInPage() {
  return (
    <main className="min-h-screen flex">
      {/* ── Left panel: brand statement ── */}
      <div
        className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'var(--obsidian-2)' }}
      >
        {/* Subtle grid texture */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(var(--obsidian-4) 1px, transparent 1px),
              linear-gradient(90deg, var(--obsidian-4) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            opacity: 0.3,
          }}
        />

        {/* Glow orb */}
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-32 w-96 h-96 rounded-full"
          style={{
            background: 'radial-gradient(circle, var(--gold-dim) 0%, transparent 70%)',
          }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <span
            className="text-sm font-medium tracking-[0.2em] uppercase"
            style={{ color: 'var(--gold)' }}
          >
            Ledger
          </span>
        </div>

        {/* Headline */}
        <div className="relative z-10 space-y-6">
          <h1
            className="text-5xl font-light leading-[1.1] tracking-tight"
            style={{ color: 'var(--ivory)' }}
          >
            Your money,
            <br />
            <span className="gold-shimmer font-semibold">clearly.</span>
          </h1>
          <p className="text-base leading-relaxed max-w-xs" style={{ color: 'var(--muted-light)' }}>
            Track income, control spending, and reach your savings goals — all in one place.
          </p>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-xs" style={{ color: 'var(--muted)' }}>
          Personal Finance Manager
        </p>
      </div>

      {/* ── Right panel: form ── */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-6 py-12"
        style={{ background: 'var(--obsidian)' }}
      >
        {/* Mobile logo */}
        <div className="lg:hidden mb-10">
          <span
            className="text-sm font-medium tracking-[0.2em] uppercase"
            style={{ color: 'var(--gold)' }}
          >
            Ledger
          </span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2
              className="text-2xl font-semibold tracking-tight"
              style={{ color: 'var(--ivory)' }}
            >
              Welcome back
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--muted-light)' }}>
              Sign in to your account
            </p>
          </div>

          <SignInForm />
        </div>
      </div>
    </main>
  )
}
