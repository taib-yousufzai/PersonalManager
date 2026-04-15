import type { Timestamp } from 'firebase-admin/firestore'

export type { Timestamp }

export interface Income {
  id: string
  amount: number // positive
  source: string
  date: string // ISO date YYYY-MM-DD
  monthYear: string // YYYY-MM
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Expense {
  id: string
  amount: number // positive
  categoryId: string
  date: string // ISO date YYYY-MM-DD
  monthYear: string // YYYY-MM
  note?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Category {
  id: string
  name: string // unique per user
  type: 'essential' | 'discretionary'
  isDefault: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Budget {
  id: string
  categoryId: string
  monthYear: string // YYYY-MM
  limit: number // positive
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface SavingsGoal {
  id: string
  type: 'fixed' | 'percentage'
  value: number // positive; if percentage: 1–100
  monthYear: string // YYYY-MM
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface BudgetUtilization {
  categoryId: string
  categoryName: string
  spent: number
  limit: number
  utilizationPct: number // spent / limit * 100
  status: 'ok' | 'warning' | 'over' // warning >= 80%, over > 100%
}

export interface MonthlyReport {
  monthYear: string // YYYY-MM (document ID)
  totalIncome: number
  totalExpenses: number
  actualSavings: number
  targetSavings: number
  potentialSavings: number
  savingsMargin: number
  safeToSpend: number
  categoryTotals: Record<string, number> // categoryId → total spent
  budgetUtilization: BudgetUtilization[]
  generatedAt: Timestamp
}

export interface Insight {
  type: 'overspending' | 'savings_shortfall' | 'discretionary_opportunity'
  message: string
  severity: 'info' | 'warning' | 'critical'
  categoryId?: string // for overspending insights
}

export type ActionResult =
  | { success: true }
  | { success: false; errors: Record<string, string[]> }
