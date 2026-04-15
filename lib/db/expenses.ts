import { FieldValue, type DocumentSnapshot } from 'firebase-admin/firestore'
import { getAdminFirestore } from '../firebase/admin'
import type { Expense } from '../types'

const PAGE_SIZE = 20

function expensesCol(uid: string) {
  return getAdminFirestore().collection(`users/${uid}/expenses`)
}

export interface PaginatedExpenses {
  expenses: Expense[]
  /** Encoded cursor for the next page, or null if no more pages. */
  nextPage: string | null
}

export async function getExpensesForMonth(
  uid: string,
  monthYear: string,
  startAfterCursor?: string
): Promise<PaginatedExpenses> {
  // Use simple where query (no orderBy) to avoid requiring composite index before it's deployed
  let query = expensesCol(uid)
    .where('monthYear', '==', monthYear)
    .limit(PAGE_SIZE)

  if (startAfterCursor) {
    const cursorSnap = await expensesCol(uid).doc(startAfterCursor).get()
    if (cursorSnap.exists) {
      query = query.startAfter(cursorSnap as DocumentSnapshot)
    }
  }

  const snap = await query.get()
  // Sort in-memory by date desc until composite index is deployed
  const expenses = snap.docs
    .map((d) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { createdAt, updatedAt, ...rest } = d.data()
      return { id: d.id, ...rest } as Expense
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1))
  const lastDoc = snap.docs[snap.docs.length - 1]
  const nextPage = snap.docs.length === PAGE_SIZE && lastDoc ? lastDoc.id : null

  return { expenses, nextPage }
}

export async function getAllExpensesForMonth(uid: string, monthYear: string): Promise<Expense[]> {
  const snap = await expensesCol(uid)
    .where('monthYear', '==', monthYear)
    .get()
  const docs = snap.docs.map((d) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { createdAt, updatedAt, ...rest } = d.data()
    return { id: d.id, ...rest } as Expense
  })
  return docs.sort((a, b) => (a.date < b.date ? 1 : -1))
}

export async function createExpense(
  uid: string,
  data: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Expense> {
  const now = FieldValue.serverTimestamp()
  const ref = expensesCol(uid).doc()
  await ref.set({ ...data, createdAt: now, updatedAt: now })
  return { id: ref.id, ...data, createdAt: now as never, updatedAt: now as never }
}

export async function updateExpense(
  uid: string,
  id: string,
  data: Partial<Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  await expensesCol(uid).doc(id).update({ ...data, updatedAt: FieldValue.serverTimestamp() })
}

export async function deleteExpense(uid: string, id: string): Promise<void> {
  await expensesCol(uid).doc(id).delete()
}

export async function getExpensesByCategory(uid: string, categoryId: string): Promise<Expense[]> {
  const snap = await expensesCol(uid).where('categoryId', '==', categoryId).get()
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Expense))
}

export async function reassignExpensesToCategory(
  uid: string,
  fromCategoryId: string,
  toCategoryId: string
): Promise<void> {
  const db = getAdminFirestore()
  const snap = await expensesCol(uid).where('categoryId', '==', fromCategoryId).get()
  if (snap.empty) return

  const batch = db.batch()
  const now = FieldValue.serverTimestamp()
  for (const doc of snap.docs) {
    batch.update(doc.ref, { categoryId: toCategoryId, updatedAt: now })
  }
  await batch.commit()
}
