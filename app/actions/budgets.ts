'use server'

import { revalidatePath } from 'next/cache'
import { verifySession } from '@/lib/firebase/admin'
import { BudgetSchema } from '@/lib/validation/schemas'
import { upsertBudget as dbUpsertBudget, getBudgetsForMonth } from '@/lib/db/budgets'
import { getIncomeForMonth } from '@/lib/db/income'
import { getAllExpensesForMonth } from '@/lib/db/expenses'
import { getCategories } from '@/lib/db/categories'
import { getSavingsGoalForMonth } from '@/lib/db/savingsGoals'
import { saveMonthlyReport } from '@/lib/db/monthlyReports'
import { buildMonthlyReport } from '@/lib/domain/calculations'
import type { ActionResult } from '@/lib/types'

export async function upsertBudget(data: unknown): Promise<ActionResult> {
  const uid = await verifySession()

  const validatedFields = BudgetSchema.safeParse(data)
  if (!validatedFields.success) {
    return { success: false, errors: validatedFields.error.flatten().fieldErrors }
  }

  const { categoryId, monthYear, limit } = validatedFields.data

  await dbUpsertBudget(uid, { categoryId, monthYear, limit })

  const [incomes, expenses, categories, budgets, savingsGoal] = await Promise.all([
    getIncomeForMonth(uid, monthYear),
    getAllExpensesForMonth(uid, monthYear),
    getCategories(uid),
    getBudgetsForMonth(uid, monthYear),
    getSavingsGoalForMonth(uid, monthYear),
  ])

  const report = buildMonthlyReport(incomes, expenses, categories, budgets, savingsGoal, monthYear)
  await saveMonthlyReport(uid, report)

  revalidatePath('/')
  revalidatePath('/budgets')
  revalidatePath('/reports')
  return { success: true }
}
