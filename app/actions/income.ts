'use server'

import { FieldValue } from 'firebase-admin/firestore'
import { revalidatePath } from 'next/cache'
import { getAdminFirestore, verifySession } from '@/lib/firebase/admin'
import { IncomeSchema } from '@/lib/validation/schemas'
import { getIncomeForMonth } from '@/lib/db/income'
import { getAllExpensesForMonth } from '@/lib/db/expenses'
import { getCategories } from '@/lib/db/categories'
import { getBudgetsForMonth } from '@/lib/db/budgets'
import { getSavingsGoalForMonth } from '@/lib/db/savingsGoals'
import { buildMonthlyReport } from '@/lib/domain/calculations'
import type { ActionResult } from '@/lib/types'

export async function createIncome(data: unknown): Promise<ActionResult> {
  const uid = await verifySession()

  const validatedFields = IncomeSchema.safeParse(data)
  if (!validatedFields.success) {
    return { success: false, errors: validatedFields.error.flatten().fieldErrors }
  }

  const { monthYear } = validatedFields.data
  const db = getAdminFirestore()

  // Write the new income doc
  const incomeRef = db.collection(`users/${uid}/income`).doc()
  const newId = incomeRef.id

  const [allIncome, expenses, categories, budgets, savingsGoal] = await Promise.all([
    getIncomeForMonth(uid, monthYear),
    getAllExpensesForMonth(uid, monthYear),
    getCategories(uid),
    getBudgetsForMonth(uid, monthYear),
    getSavingsGoalForMonth(uid, monthYear),
  ])

  // Include the new entry in the report calculation
  const incomeWithNew = [...allIncome, { id: newId, ...validatedFields.data, createdAt: null as never, updatedAt: null as never }]
  const report = buildMonthlyReport(incomeWithNew, expenses, categories, budgets, savingsGoal, monthYear)

  const batch = db.batch()
  batch.set(incomeRef, { ...validatedFields.data, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() })
  batch.set(db.doc(`users/${uid}/monthlyReports/${monthYear}`), { ...report, generatedAt: FieldValue.serverTimestamp() })
  await batch.commit()

  revalidatePath('/')
  revalidatePath('/expenses')
  revalidatePath('/reports')
  return { success: true }
}

export async function updateIncome(id: string, data: unknown): Promise<ActionResult> {
  const uid = await verifySession()

  const validatedFields = IncomeSchema.safeParse(data)
  if (!validatedFields.success) {
    return { success: false, errors: validatedFields.error.flatten().fieldErrors }
  }

  const { monthYear } = validatedFields.data
  const db = getAdminFirestore()

  // Read current data before updating so report calculation is accurate
  const [allIncome, expenses, categories, budgets, savingsGoal] = await Promise.all([
    getIncomeForMonth(uid, monthYear),
    getAllExpensesForMonth(uid, monthYear),
    getCategories(uid),
    getBudgetsForMonth(uid, monthYear),
    getSavingsGoalForMonth(uid, monthYear),
  ])

  // Replace the entry being updated with the new values for accurate report
  const incomeList = allIncome.map((i) =>
    i.id === id ? { ...i, ...validatedFields.data } : i
  )
  const report = buildMonthlyReport(incomeList, expenses, categories, budgets, savingsGoal, monthYear)

  const batch = db.batch()
  batch.set(db.doc(`users/${uid}/income/${id}`), { ...validatedFields.data, updatedAt: FieldValue.serverTimestamp() }, { merge: true })
  batch.set(db.doc(`users/${uid}/monthlyReports/${monthYear}`), { ...report, generatedAt: FieldValue.serverTimestamp() })
  await batch.commit()

  revalidatePath('/')
  revalidatePath('/expenses')
  revalidatePath('/reports')
  return { success: true }
}

export async function deleteIncome(id: string, monthYear: string): Promise<ActionResult> {
  const uid = await verifySession()

  const [allIncome, expenses, categories, budgets, savingsGoal] = await Promise.all([
    getIncomeForMonth(uid, monthYear),
    getAllExpensesForMonth(uid, monthYear),
    getCategories(uid),
    getBudgetsForMonth(uid, monthYear),
    getSavingsGoalForMonth(uid, monthYear),
  ])

  const incomeList = allIncome.filter((i) => i.id !== id)
  const report = buildMonthlyReport(incomeList, expenses, categories, budgets, savingsGoal, monthYear)

  const db = getAdminFirestore()
  const batch = db.batch()
  batch.delete(db.doc(`users/${uid}/income/${id}`))
  batch.set(db.doc(`users/${uid}/monthlyReports/${monthYear}`), { ...report, generatedAt: FieldValue.serverTimestamp() })
  await batch.commit()

  revalidatePath('/')
  revalidatePath('/expenses')
  revalidatePath('/reports')
  return { success: true }
}
