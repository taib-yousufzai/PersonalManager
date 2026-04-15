'use client'

import { useOfflineSync } from '@/lib/hooks/useOfflineSync'

export default function OfflineBanner() {
  const { isOnline, pendingCount } = useOfflineSync()

  if (isOnline && pendingCount === 0) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium"
      style={{
        background: isOnline ? 'var(--warning)' : 'var(--obsidian-4)',
        color: isOnline ? 'var(--obsidian)' : 'var(--muted-light)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {!isOnline ? (
        <>
          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
          Offline — changes will sync when you reconnect
        </>
      ) : pendingCount > 0 ? (
        <>
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
          Syncing {pendingCount} pending {pendingCount === 1 ? 'entry' : 'entries'}…
        </>
      ) : null}
    </div>
  )
}
