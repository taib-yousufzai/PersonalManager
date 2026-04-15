import type { Income, Expense, Category, Budget, BudgetUtilization, MonthlyReport, SavingsGoal } from '../types'

export function computeTotalIncome(incomes: Income[]): number {
  return incomes.reduce((sum, e) => sum + e.amount, 0)
}

export function computeTotalExpenses(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0)
}

export function computeActualSavings(totalIncome: number, totalExpenses: number): number {
  return totalIncome - totalExpenses
}

export function computePotentialSavings(expenses: Expense[], categories: Category[]): number {
  const discretionaryIds = new Set(
    categories.filter((c) => c.type === 'discretionary').map((c) => c.id)
  )
  return expenses
    .filter((e) => discretionaryIds.has(e.categoryId))
    .reduce((sum, e) => sum + e.amount, 0)
}

export function computeTargetSavings(goal: SavingsGoal | null, totalIncome: number): number {
  if (goal === null) return 0
  if (goal.type === 'fixed') return goal.value
  return (goal.value / 100) * totalIncome
}

export function computeSavingsMargin(actualSavings: number, targetSavings: number): number {
  return actualSavings - targetSavings
}

export function computeSafeToSpend(
  totalIncome: number,
  totalExpenses: number,
  targetSavings: number
): number {
  return totalIncome - totalExpenses - targetSavings
}

export function computeCategoryTotals(expenses: Expense[]): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const e of expenses) {
    totals[e.categoryId] = (totals[e.categoryId] ?? 0) + e.amount
  }
  return totals
}

export function computeBudgetUtilization(
  categoryTotals: Record<string, number>,
  budgets: Budget[],
  categories: Category[]
): BudgetUtilization[] {
  const categoryMap = new Map(categories.map((c) => [c.id, c]))
  return budgets.map((budget) => {
    const spent = categoryTotals[budget.categoryId] ?? 0
    const utilizationPct = (spent / budget.limit) * 100
    const status: 'ok' | 'warning' | 'over' =
      utilizationPct > 100 ? 'over' : utilizationPct >= 80 ? 'warning' : 'ok'
    return {
      categoryId: budget.categoryId,
      categoryName: categoryMap.get(budget.categoryId)?.name ?? budget.categoryId,
      spent,
      limit: budget.limit,
      utilizationPct,
      status,
    }
  })
}

export function buildMonthlyReport(
  incomes: Income[],
  expenses: Expense[],
  categories: Category[],
  budgets: Budget[],
  savingsGoal: SavingsGoal | null,
  monthYear: string
): Omit<MonthlyReport, 'generatedAt'> {
  const totalIncome = computeTotalIncome(incomes)
  const totalExpenses = computeTotalExpenses(expenses)
  const actualSavings = computeActualSavings(totalIncome, totalExpenses)
  const targetSavings = computeTargetSavings(savingsGoal, totalIncome)
  const potentialSavings = computePotentialSavings(expenses, categories)
  const savingsMargin = computeSavingsMargin(actualSavings, targetSavings)
  const safeToSpend = computeSafeToSpend(totalIncome, totalExpenses, targetSavings)
  const categoryTotals = computeCategoryTotals(expenses)
  const budgetUtilization = computeBudgetUtilization(categoryTotals, budgets, categories)

  return {
    monthYear,
    totalIncome,
    totalExpenses,
    actualSavings,
    targetSavings,
    potentialSavings,
    savingsMargin,
    safeToSpend,
    categoryTotals,
    budgetUtilization,
  }
}
