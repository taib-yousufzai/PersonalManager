import { getAdminFirestore } from '../firebase/admin'
import type { SavingsTransaction } from '../types'
import { Timestamp } from 'firebase-admin/firestore'

function getSavingsCollection(uid: string) {
  return getAdminFirestore().collection(`users/${uid}/savingsTransactions`)
}

export async function getAllSavingsTransactions(uid: string): Promise<SavingsTransaction[]> {
  const snapshot = await getSavingsCollection(uid).orderBy('date', 'desc').get()
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavingsTransaction))
}

export async function addSavingsTransaction(
  uid: string,
  data: Omit<SavingsTransaction, 'id' | 'createdAt' | 'updatedAt'>
): Promise<SavingsTransaction> {
  const now = Timestamp.now()
  const docRef = await getSavingsCollection(uid).add({
    ...data,
    createdAt: now,
    updatedAt: now
  })

  return {
    id: docRef.id,
    ...data,
    createdAt: now,
    updatedAt: now
  }
}

export async function getSavingsBalance(uid: string): Promise<number> {
  const transactions = await getAllSavingsTransactions(uid)
  return transactions.reduce((acc, t) => acc + t.amount, 0)
}
