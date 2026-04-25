'use server'

import { FieldValue } from 'firebase-admin/firestore'
import { revalidatePath, revalidateTag } from 'next/cache'
import { getAdminFirestore, verifySession } from '@/lib/firebase/admin'
import { SavingsTransactionSchema } from '@/lib/validation/schemas'
import type { ActionResult } from '@/lib/types'

function revalidateAll(uid: string) {
  revalidateTag(`user-${uid}`, 'max')
  revalidatePath('/')
  revalidatePath('/reports')
  revalidatePath('/savings')
}

export async function createSavingsTransaction(data: unknown): Promise<ActionResult> {
  const uid = await verifySession()

  const validatedFields = SavingsTransactionSchema.safeParse(data)
  if (!validatedFields.success) {
    return { success: false, errors: validatedFields.error.flatten().fieldErrors }
  }

  const { amount, type, date, note } = validatedFields.data
  const actualAmount = type === 'deposit' ? amount : -amount

  const db = getAdminFirestore()
  const docRef = db.collection(`users/${uid}/savingsTransactions`).doc()
  
  await docRef.set({
    amount: actualAmount,
    date,
    note,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  })

  revalidateAll(uid)
  return { success: true }
}
