'use client'

import { signOut } from '@/app/actions/auth'

export default function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut()}
      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150"
      style={{ color: 'var(--muted)' }}
      onMouseEnter={e => {
        e.currentTarget.style.color = 'var(--ivory)'
        e.currentTarget.style.background = 'var(--obsidian-3)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color = 'var(--muted)'
        e.currentTarget.style.background = 'transparent'
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
      Sign out
    </button>
  )
}
