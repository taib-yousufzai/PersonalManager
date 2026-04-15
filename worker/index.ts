/// <reference lib="webworker" />
// Custom Service Worker entry for @ducanh2912/next-pwa
// Handles background sync of offline mutations queued in IndexedDB

declare const self: ServiceWorkerGlobalScope

const DB_NAME = 'offline-queue'
const STORE_NAME = 'mutations'
const SYNC_TAG = 'offline-mutations'
const MAX_RETRIES = 3

interface OfflineMutation {
  id: string
  action: string
  payload: unknown
  timestamp: number
  retryCount: number
}

// --- Raw IndexedDB helpers (no ES module imports allowed in SW) ---

function openQueue(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function getAllMutations(db: IDBDatabase): Promise<OfflineMutation[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).getAll()
    req.onsuccess = () => {
      const all = (req.result as OfflineMutation[]).sort(
        (a, b) => a.timestamp - b.timestamp
      )
      resolve(all)
    }
    req.onerror = () => reject(req.error)
  })
}

function deleteMutation(db: IDBDatabase, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const req = tx.objectStore(STORE_NAME).delete(id)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

function putMutation(db: IDBDatabase, mutation: OfflineMutation): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const req = tx.objectStore(STORE_NAME).put(mutation)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

// Map action names to their Next.js API/action endpoints
function actionToEndpoint(action: string): string {
  const map: Record<string, string> = {
    createExpense: '/api/expenses',
    updateExpense: '/api/expenses',
    deleteExpense: '/api/expenses',
    createIncome: '/api/income',
    updateIncome: '/api/income',
    deleteIncome: '/api/income',
    upsertBudget: '/api/budgets',
    upsertSavingsGoal: '/api/savings-goals',
    createCategory: '/api/categories',
    renameCategory: '/api/categories',
    deleteCategory: '/api/categories',
  }
  return map[action] ?? '/api/sync'
}

async function replayMutations(): Promise<void> {
  const db = await openQueue()
  const mutations = await getAllMutations(db)

  if (mutations.length === 0) return

  let successCount = 0
  let failCount = 0

  for (const mutation of mutations) {
    try {
      const endpoint = actionToEndpoint(mutation.action)
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: mutation.action, payload: mutation.payload }),
      })

      if (res.ok) {
        await deleteMutation(db, mutation.id)
        successCount++
      } else {
        throw new Error(`HTTP ${res.status}`)
      }
    } catch {
      const newRetryCount = mutation.retryCount + 1
      if (newRetryCount >= MAX_RETRIES) {
        // Max retries reached — remove from queue and notify user
        await deleteMutation(db, mutation.id)
        await self.registration.showNotification('Sync failed', {
          body: `Could not sync "${mutation.action}" after ${MAX_RETRIES} attempts. The entry has been discarded.`,
          icon: '/icons/icon-192x192.svg',
          tag: `sync-failed-${mutation.id}`,
        })
        failCount++
      } else {
        // Retain in queue with incremented retry count
        await putMutation(db, { ...mutation, retryCount: newRetryCount })
        failCount++
      }
    }
  }

  // Notify clients to refresh their pending count
  const clients = await self.clients.matchAll({ type: 'window' })
  for (const client of clients) {
    client.postMessage({ type: 'SYNC_COMPLETE', successCount, failCount })
  }

  if (successCount > 0 && failCount === 0) {
    await self.registration.showNotification('Sync complete', {
      body: `${successCount} pending ${successCount === 1 ? 'entry' : 'entries'} synced successfully.`,
      icon: '/icons/icon-192x192.svg',
      tag: 'sync-complete',
    })
  }
}

// --- Event listeners ---

// Background Sync API
self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(replayMutations())
  }
})

// Fallback: online event when Background Sync API is unavailable
self.addEventListener('online', () => {
  self.registration.sync?.register(SYNC_TAG).catch(() => {
    // Background Sync not supported — replay directly
    replayMutations()
  })
})

// Message from client: manual sync trigger or pending count request
self.addEventListener('message', (event) => {
  if (!event.data) return

  if (event.data.type === 'SYNC_MUTATIONS') {
    event.waitUntil(replayMutations())
  }
})
