import { FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore } from '../firebase/admin'
import type { ScheduledPayment } from '../types'

function col(uid: string) {
  return getAdminFirestore().collection(`users/${uid}/scheduledPayments`)
}

export async function getScheduledPaymentsByMonth(
  uid: string,
  monthYear: string // YYYY-MM
): Promise<ScheduledPayment[]> {
  const [year, month] = monthYear.split('-').map(Number)
  const start = `${monthYear}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const end = `${monthYear}-${String(lastDay).padStart(2, '0')}`

  const snap = await col(uid)
    .where('date', '>=', start)
    .where('date', '<=', end)
    .get()

  return snap.docs
    .map((d) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { createdAt, updatedAt, ...rest } = d.data()
      return { id: d.id, ...rest } as ScheduledPayment
    })
    .sort((a, b) => a.date.localeCompare(b.date))
}

export async function getScheduledPaymentsForDate(
  uid: string,
  date: string // YYYY-MM-DD
): Promise<ScheduledPayment[]> {
  const snap = await col(uid).where('date', '==', date).get()
  return snap.docs.map((d) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { createdAt, updatedAt, ...rest } = d.data()
    return { id: d.id, ...rest } as ScheduledPayment
  })
}

export async function createScheduledPayment(
  uid: string,
  data: Omit<ScheduledPayment, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ScheduledPayment> {
  const now = FieldValue.serverTimestamp()
  const ref = col(uid).doc()
  await ref.set({ ...data, createdAt: now, updatedAt: now })
  return { id: ref.id, ...data, createdAt: now as never, updatedAt: now as never }
}

export async function updateScheduledPayment(
  uid: string,
  id: string,
  data: Partial<Omit<ScheduledPayment, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  await col(uid).doc(id).update({ ...data, updatedAt: FieldValue.serverTimestamp() })
}

export async function deleteScheduledPayment(uid: string, id: string): Promise<void> {
  await col(uid).doc(id).delete()
}
