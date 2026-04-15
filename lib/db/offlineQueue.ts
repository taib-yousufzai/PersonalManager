import { openDB as idbOpenDB, type IDBPDatabase } from 'idb'

export interface OfflineMutation {
  id: string
  action: string
  payload: unknown
  timestamp: number
  retryCount: number
}

const DB_NAME = 'offline-queue'
const STORE_NAME = 'mutations'

function getDB(): Promise<IDBPDatabase> {
  if (typeof window === 'undefined') {
    throw new Error('offlineQueue is only available in browser environments')
  }
  return idbOpenDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    },
  })
}

export async function enqueueOfflineMutation(
  action: string,
  payload: unknown
): Promise<string> {
  const id = crypto.randomUUID()
  const mutation: OfflineMutation = {
    id,
    action,
    payload,
    timestamp: Date.now(),
    retryCount: 0,
  }
  const db = await getDB()
  await db.put(STORE_NAME, mutation)
  return id
}

export async function dequeueAllMutations(): Promise<OfflineMutation[]> {
  const db = await getDB()
  const all = await db.getAll(STORE_NAME)
  return (all as OfflineMutation[]).sort((a, b) => a.timestamp - b.timestamp)
}

export async function clearMutation(id: string): Promise<void> {
  const db = await getDB()
  await db.delete(STORE_NAME, id)
}

export async function incrementRetryCount(id: string): Promise<void> {
  const db = await getDB()
  const mutation = await db.get(STORE_NAME, id) as OfflineMutation | undefined
  if (!mutation) return
  await db.put(STORE_NAME, { ...mutation, retryCount: mutation.retryCount + 1 })
}
