'use client'

import { useOfflineSync } from '@/lib/hooks/useOfflineSync'

export default function OfflineBanner() {
  const { isOnline, pendingCount } = useOfflineSync()

  if (isOnline && pendingCount === 0) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white ${
        isOnline ? 'bg-yellow-500' : 'bg-gray-700'
      }`}
    >
      {!isOnline ? (
        <>
          <span aria-hidden="true">⚡</span>
          <span>You&apos;re offline. Changes will sync when you reconnect.</span>
        </>
      ) : pendingCount > 0 ? (
        <>
          <span aria-hidden="true" className="animate-spin inline-block">↻</span>
          <span>
            Syncing {pendingCount} pending {pendingCount === 1 ? 'entry' : 'entries'}…
          </span>
        </>
      ) : null}
    </div>
  )
}
