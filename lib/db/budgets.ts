import { FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore } from '../firebase/admin'
import type { Budget } from '../types'

function budgetsCol(uid: string) {
  return getAdminFirestore().collection(`users/${uid}/budgets`)
}

export async function getBudgetsForMonth(uid: string, monthYear: string): Promise<Budget[]> {
  const snap = await budgetsCol(uid).where('monthYear', '==', monthYear).get()
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Budget))
}

export async function getBudgetByCategoryAndMonth(
  uid: string,
  categoryId: string,
  monthYear: string
): Promise<Budget | null> {
  const snap = await budgetsCol(uid)
    .where('categoryId', '==', categoryId)
    .where('monthYear', '==', monthYear)
    .limit(1)
    .get()
  if (snap.empty) return null
  const doc = snap.docs[0]
  return { id: doc.id, ...doc.data() } as Budget
}

/**
 * Creates or updates the budget for a given category + month (upsert).
 * Enforces at most one budget per category per month.
 */
export async function upsertBudget(
  uid: string,
  data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Budget> {
  const existing = await getBudgetByCategoryAndMonth(uid, data.categoryId, data.monthYear)
  const now = FieldValue.serverTimestamp()

  if (existing) {
    await budgetsCol(uid).doc(existing.id).update({ limit: data.limit, updatedAt: now })
    return { ...existing, limit: data.limit }
  }

  const ref = budgetsCol(uid).doc()
  await ref.set({ ...data, createdAt: now, updatedAt: now })
  return { id: ref.id, ...data, createdAt: now as never, updatedAt: now as never }
}
