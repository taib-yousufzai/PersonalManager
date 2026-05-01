import { FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore } from '../firebase/admin'
import type { Income } from '../types'

function incomeCol(uid: string) {
  return getAdminFirestore().collection(`users/${uid}/income`)
}

export async function getIncomeForMonth(uid: string, monthYear: string): Promise<Income[]> {
  const snap = await incomeCol(uid)
    .where('monthYear', '==', monthYear)
    .get()
  const docs = snap.docs.map((d) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { createdAt, updatedAt, ...rest } = d.data()
    return { id: d.id, ...rest } as Income
  })
  return docs.sort((a, b) => (a.date < b.date ? 1 : -1))
}

export async function createIncome(
  uid: string,
  data: Omit<Income, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Income> {
  const now = FieldValue.serverTimestamp()
  const ref = incomeCol(uid).doc()
  await ref.set({ ...data, createdAt: now, updatedAt: now })
  const fakeTimestamp = new Date().toISOString() as never
  return { id: ref.id, ...data, createdAt: fakeTimestamp, updatedAt: fakeTimestamp }
}

export async function updateIncome(
  uid: string,
  id: string,
  data: Partial<Omit<Income, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  await incomeCol(uid).doc(id).update({ ...data, updatedAt: FieldValue.serverTimestamp() })
}

export async function deleteIncome(uid: string, id: string): Promise<void> {
  await incomeCol(uid).doc(id).delete()
}
