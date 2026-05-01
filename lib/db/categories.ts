import { FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore } from '../firebase/admin'
import type { Category } from '../types'

const DEFAULT_CATEGORIES: Array<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>> = [
  { name: 'Housing', type: 'essential', isDefault: true },
  { name: 'Food', type: 'essential', isDefault: true },
  { name: 'Transport', type: 'essential', isDefault: true },
  { name: 'Entertainment', type: 'discretionary', isDefault: true },
]

function categoriesCol(uid: string) {
  return getAdminFirestore().collection(`users/${uid}/categories`)
}

export async function getCategories(uid: string): Promise<Category[]> {
  const snap = await categoriesCol(uid).get()

  // Auto-seed defaults on first use if collection is empty
  if (snap.empty) {
    try {
      await seedDefaultCategories(uid)
      const seeded = await categoriesCol(uid).get()
      return seeded.docs
        .map((d) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { createdAt, updatedAt, ...rest } = d.data()
          return { id: d.id, ...rest } as Category
        })
        .sort((a, b) => a.name.localeCompare(b.name))
    } catch {
      return []
    }
  }

  const docs = snap.docs.map((d) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { createdAt, updatedAt, ...rest } = d.data()
    return { id: d.id, ...rest } as Category
  })
  return docs.sort((a, b) => a.name.localeCompare(b.name))
}

export async function getCategoryById(uid: string, id: string): Promise<Category | null> {
  const doc = await categoriesCol(uid).doc(id).get()
  if (!doc.exists) return null
  return { id: doc.id, ...doc.data() } as Category
}

export async function findCategoryByName(uid: string, name: string): Promise<Category | null> {
  const snap = await categoriesCol(uid).where('name', '==', name).limit(1).get()
  if (snap.empty) return null
  const doc = snap.docs[0]
  return { id: doc.id, ...doc.data() } as Category
}

export async function createCategory(
  uid: string,
  data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Category> {
  const now = FieldValue.serverTimestamp()
  const ref = categoriesCol(uid).doc()
  await ref.set({ ...data, createdAt: now, updatedAt: now })
  const fakeTimestamp = new Date().toISOString() as never
  return { id: ref.id, ...data, createdAt: fakeTimestamp, updatedAt: fakeTimestamp }
}

export async function updateCategory(
  uid: string,
  id: string,
  data: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  await categoriesCol(uid).doc(id).update({ ...data, updatedAt: FieldValue.serverTimestamp() })
}

export async function deleteCategory(uid: string, id: string): Promise<void> {
  await categoriesCol(uid).doc(id).delete()
}

/**
 * Seeds default categories for a new user if none exist yet.
 */
export async function seedDefaultCategories(uid: string): Promise<void> {
  const existing = await categoriesCol(uid).limit(1).get()
  if (!existing.empty) return

  const db = getAdminFirestore()
  const batch = db.batch()
  const now = FieldValue.serverTimestamp()

  for (const cat of DEFAULT_CATEGORIES) {
    const ref = categoriesCol(uid).doc()
    batch.set(ref, { ...cat, createdAt: now, updatedAt: now })
  }

  await batch.commit()
}

/**
 * Removes duplicate categories (same name), keeping the first created.
 * Safe to call multiple times.
 */
export async function deduplicateCategories(uid: string): Promise<void> {
  const snap = await categoriesCol(uid).get()
  const seen = new Map<string, string>() // name → first doc id
  const db = getAdminFirestore()
  const batch = db.batch()
  let hasDupes = false

  for (const doc of snap.docs) {
    const name = (doc.data().name as string)?.toLowerCase()
    if (!name) continue
    if (seen.has(name)) {
      batch.delete(doc.ref)
      hasDupes = true
    } else {
      seen.set(name, doc.id)
    }
  }

  if (hasDupes) await batch.commit()
}
