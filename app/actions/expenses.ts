'use server'

import { FieldValue } from 'firebase-admin/firestore'
import { revalidatePath, revalidateTag } from 'next/cache'
import { getAdminFirestore, verifySession } from '@/lib/firebase/admin'
import { ExpenseSchema } from '@/lib/validation/schemas'
import { getAllExpensesForMonth } from '@/lib/db/expenses'
import { getIncomeForMonth } from '@/lib/db/income'
import { getCategories } from '@/lib/db/categories'
import { getBudgetsForMonth } from '@/lib/db/budgets'
import { getSavingsGoalForMonth } from '@/lib/db/savingsGoals'
import { buildMonthlyReport } from '@/lib/domain/calculations'
import type { ActionResult } from '@/lib/types'

function revalidateAll(uid: string) {
  revalidateTag(`user-${uid}`, 'max')
  revalidatePath('/')
  revalidatePath('/expenses')
  revalidatePath('/budgets')
  revalidatePath('/reports')
}

export async function createExpense(data: unknown): Promise<ActionResult> {
  const uid = await verifySession()

  const validatedFields = ExpenseSchema.safeParse(data)
  if (!validatedFields.success) {
    return { success: false, errors: validatedFields.error.flatten().fieldErrors }
  }

  const { monthYear } = validatedFields.data
  const db = getAdminFirestore()
  const expenseRef = db.collection(`users/${uid}/expenses`).doc()
  const newId = expenseRef.id

  const [income, allExpenses, categories, budgets, savingsGoal] = await Promise.all([
    getIncomeForMonth(uid, monthYear),
    getAllExpensesForMonth(uid, monthYear),
    getCategories(uid),
    getBudgetsForMonth(uid, monthYear),
    getSavingsGoalForMonth(uid, monthYear),
  ])

  const expenseWithNew = [...allExpenses, { id: newId, ...validatedFields.data, createdAt: null as never, updatedAt: null as never }]
  const report = buildMonthlyReport(income, expenseWithNew, categories, budgets, savingsGoal, monthYear)

  const batch = db.batch()
  batch.set(expenseRef, { ...validatedFields.data, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() })
  batch.set(db.doc(`users/${uid}/monthlyReports/${monthYear}`), { ...report, generatedAt: FieldValue.serverTimestamp() })
  await batch.commit()

  revalidateAll(uid)
  return { success: true }
}

export async function updateExpense(id: string, data: unknown): Promise<ActionResult> {
  const uid = await verifySession()

  const validatedFields = ExpenseSchema.safeParse(data)
  if (!validatedFields.success) {
    return { success: false, errors: validatedFields.error.flatten().fieldErrors }
  }

  const { monthYear } = validatedFields.data
  const db = getAdminFirestore()

  const [income, allExpenses, categories, budgets, savingsGoal] = await Promise.all([
    getIncomeForMonth(uid, monthYear),
    getAllExpensesForMonth(uid, monthYear),
    getCategories(uid),
    getBudgetsForMonth(uid, monthYear),
    getSavingsGoalForMonth(uid, monthYear),
  ])

  // Replace the entry being updated with new values for accurate report
  const expenseList = allExpenses.map((e) =>
    e.id === id ? { ...e, ...validatedFields.data } : e
  )
  const report = buildMonthlyReport(income, expenseList, categories, budgets, savingsGoal, monthYear)

  const batch = db.batch()
  batch.set(db.doc(`users/${uid}/expenses/${id}`), { ...validatedFields.data, updatedAt: FieldValue.serverTimestamp() }, { merge: true })
  batch.set(db.doc(`users/${uid}/monthlyReports/${monthYear}`), { ...report, generatedAt: FieldValue.serverTimestamp() })
  await batch.commit()

  revalidateAll(uid)
  return { success: true }
}

export async function deleteExpense(id: string, monthYear: string): Promise<ActionResult> {
  const uid = await verifySession()

  const [income, allExpenses, categories, budgets, savingsGoal] = await Promise.all([
    getIncomeForMonth(uid, monthYear),
    getAllExpensesForMonth(uid, monthYear),
    getCategories(uid),
    getBudgetsForMonth(uid, monthYear),
    getSavingsGoalForMonth(uid, monthYear),
  ])

  const expenseList = allExpenses.filter((e) => e.id !== id)
  const report = buildMonthlyReport(income, expenseList, categories, budgets, savingsGoal, monthYear)

  const db = getAdminFirestore()
  const batch = db.batch()
  batch.delete(db.doc(`users/${uid}/expenses/${id}`))
  batch.set(db.doc(`users/${uid}/monthlyReports/${monthYear}`), { ...report, generatedAt: FieldValue.serverTimestamp() })
  await batch.commit()

  revalidateAll(uid)
  return { success: true }
}
