import { FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore } from '../firebase/admin'
import type { SavingsGoal } from '../types'

function goalsCol(uid: string) {
  return getAdminFirestore().collection(`users/${uid}/savingsGoals`)
}

export async function getSavingsGoalForMonth(
  uid: string,
  monthYear: string
): Promise<SavingsGoal | null> {
  const snap = await goalsCol(uid).where('monthYear', '==', monthYear).limit(1).get()
  if (snap.empty) return null
  const doc = snap.docs[0]
  return { id: doc.id, ...doc.data() } as SavingsGoal
}

/**
 * Creates or updates the savings goal for a given month (upsert).
 * Enforces at most one goal per month per user.
 */
export async function upsertSavingsGoal(
  uid: string,
  data: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>
): Promise<SavingsGoal> {
  const existing = await getSavingsGoalForMonth(uid, data.monthYear)
  const now = FieldValue.serverTimestamp()

  if (existing) {
    await goalsCol(uid)
      .doc(existing.id)
      .update({ type: data.type, value: data.value, updatedAt: now })
    return { ...existing, type: data.type, value: data.value }
  }

  const ref = goalsCol(uid).doc()
  await ref.set({ ...data, createdAt: now, updatedAt: now })
  const fakeTimestamp = new Date().toISOString() as never
  return { id: ref.id, ...data, createdAt: fakeTimestamp, updatedAt: fakeTimestamp }
}
