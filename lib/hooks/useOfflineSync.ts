'use client'

import { useEffect, useState, useCallback } from 'react'
import { dequeueAllMutations } from '@/lib/db/offlineQueue'

export interface OfflineSyncState {
  isOnline: boolean
  pendingCount: number
}

export function useOfflineSync(): OfflineSyncState {
  // Always start with true to match SSR — real value set in useEffect
  const [isOnline, setIsOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)

  const refreshPendingCount = useCallback(async () => {
    try {
      const mutations = await dequeueAllMutations()
      setPendingCount(mutations.length)
    } catch {
      // IndexedDB may not be available in SSR or private browsing
      setPendingCount(0)
    }
  }, [])

  const triggerSync = useCallback(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
    navigator.serviceWorker.ready
      .then((reg) => {
        // Try Background Sync API first
        if ('sync' in reg) {
          return (reg.sync as { register(tag: string): Promise<void> }).register(
            'offline-mutations'
          )
        }
        // Fallback: send message to SW to trigger manual replay
        reg.active?.postMessage({ type: 'SYNC_MUTATIONS' })
      })
      .catch(() => {
        // Service worker not available — no-op
      })
  }, [])

  useEffect(() => {
    // Sync real online state after hydration
    setIsOnline(navigator.onLine)

    // Initial pending count
    refreshPendingCount()

    const handleOnline = () => {
      setIsOnline(true)
      triggerSync()
      // Refresh count after a short delay to allow SW to process
      setTimeout(refreshPendingCount, 2000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      refreshPendingCount()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Listen for sync completion messages from the SW
    const handleSwMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_COMPLETE') {
        refreshPendingCount()
      }
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSwMessage)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage)
      }
    }
  }, [refreshPendingCount, triggerSync])

  return { isOnline, pendingCount }
}
