'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { verifySession } from '@/lib/firebase/admin'
import { SavingsGoalSchema } from '@/lib/validation/schemas'
import { upsertSavingsGoal as dbUpsertSavingsGoal, getSavingsGoalForMonth } from '@/lib/db/savingsGoals'
import { getIncomeForMonth } from '@/lib/db/income'
import { getAllExpensesForMonth } from '@/lib/db/expenses'
import { getCategories } from '@/lib/db/categories'
import { getBudgetsForMonth } from '@/lib/db/budgets'
import { saveMonthlyReport } from '@/lib/db/monthlyReports'
import { buildMonthlyReport } from '@/lib/domain/calculations'
import type { ActionResult } from '@/lib/types'

export async function upsertSavingsGoal(data: unknown): Promise<ActionResult> {
  const uid = await verifySession()

  const validatedFields = SavingsGoalSchema.safeParse(data)
  if (!validatedFields.success) {
    return { success: false, errors: validatedFields.error.flatten().fieldErrors }
  }

  const { type, value, monthYear } = validatedFields.data

  await dbUpsertSavingsGoal(uid, { type, value, monthYear })

  const [incomes, expenses, categories, budgets, savingsGoal] = await Promise.all([
    getIncomeForMonth(uid, monthYear),
    getAllExpensesForMonth(uid, monthYear),
    getCategories(uid),
    getBudgetsForMonth(uid, monthYear),
    getSavingsGoalForMonth(uid, monthYear),
  ])

  const report = buildMonthlyReport(incomes, expenses, categories, budgets, savingsGoal, monthYear)
  await saveMonthlyReport(uid, report)

  revalidateTag(`user-${uid}`, 'max')
  revalidatePath('/')
  revalidatePath('/budgets')
  revalidatePath('/reports')
  return { success: true }
}
