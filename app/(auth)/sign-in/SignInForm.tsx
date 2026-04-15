'use client'

import { useState } from 'react'
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  getIdToken,
} from 'firebase/auth'
import { getClientAuth } from '@/lib/firebase/client'
import { createSession, demoSignIn } from '@/app/actions/auth'

function mapFirebaseError(code: string): string | null {
  switch (code) {
    case 'auth/user-not-found':      return 'No account found with this email.'
    case 'auth/wrong-password':      return 'Incorrect password.'
    case 'auth/invalid-credential':  return 'Invalid email or password.'
    case 'auth/too-many-requests':   return 'Too many attempts. Please try again later.'
    case 'auth/user-disabled':       return 'This account has been disabled.'
    case 'auth/popup-closed-by-user': return null
    default:                         return 'Sign-in failed. Please try again.'
  }
}

export default function SignInForm() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  async function handleGoogleSignIn() {
    setError(null)
    setLoading(true)
    try {
      const provider = new GoogleAuthProvider()
      const result   = await signInWithPopup(getClientAuth(), provider)
      const idToken  = await getIdToken(result.user)
      await createSession(idToken)
    } catch (err: unknown) {
      const code    = (err as { code?: string }).code ?? ''
      const message = mapFirebaseError(code)
      if (message) setError(message)
    } finally {
      setLoading(false)
    }
  }

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const result  = await signInWithEmailAndPassword(getClientAuth(), email, password)
      const idToken = await getIdToken(result.user)
      await createSession(idToken)
    } catch (err: unknown) {
      const code    = (err as { code?: string }).code ?? ''
      const message = mapFirebaseError(code)
      if (message) setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div
          role="alert"
          className="rounded-lg px-4 py-3 text-sm"
          style={{ background: '#e0525220', color: '#f08080', border: '1px solid #e0525240' }}
        >
          {error}
        </div>
      )}

      {/* Demo CTA — most prominent */}
      <form action={demoSignIn}>
        <button
          type="submit"
          className="w-full rounded-lg px-4 py-3 text-sm font-semibold transition-all duration-200"
          style={{
            background: 'var(--gold)',
            color: 'var(--obsidian)',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--gold-light)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--gold)')}
        >
          Try Demo — no account needed
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: 'var(--border-light)' }} />
        <span className="text-xs" style={{ color: 'var(--muted)' }}>or</span>
        <div className="flex-1 h-px" style={{ background: 'var(--border-light)' }} />
      </div>

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="flex items-center justify-center gap-3 w-full rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 disabled:opacity-40"
        style={{
          background: 'var(--obsidian-3)',
          color: 'var(--ivory)',
          border: '1px solid var(--border-light)',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--gold-dim)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-light)')}
      >
        {/* Google G */}
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: 'var(--border-light)' }} />
        <span className="text-xs" style={{ color: 'var(--muted)' }}>or email</span>
        <div className="flex-1 h-px" style={{ background: 'var(--border-light)' }} />
      </div>

      {/* Email / password */}
      <form onSubmit={handleEmailSignIn} className="flex flex-col gap-3">
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-medium mb-1.5 tracking-wide uppercase"
            style={{ color: 'var(--muted-light)' }}
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="block w-full rounded-lg px-3 py-2.5 text-sm transition-all duration-150"
            style={{
              background: 'var(--obsidian-3)',
              color: 'var(--ivory)',
              border: '1px solid var(--border-light)',
              outline: 'none',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
            onBlur={e  => (e.currentTarget.style.borderColor = 'var(--border-light)')}
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-xs font-medium mb-1.5 tracking-wide uppercase"
            style={{ color: 'var(--muted-light)' }}
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="block w-full rounded-lg px-3 py-2.5 text-sm transition-all duration-150"
            style={{
              background: 'var(--obsidian-3)',
              color: 'var(--ivory)',
              border: '1px solid var(--border-light)',
              outline: 'none',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
            onBlur={e  => (e.currentTarget.style.borderColor = 'var(--border-light)')}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 disabled:opacity-40 mt-1"
          style={{
            background: 'var(--obsidian-4)',
            color: 'var(--ivory)',
            border: '1px solid var(--border-light)',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--gold-dim)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-light)')}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
