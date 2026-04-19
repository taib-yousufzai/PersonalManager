import type { MonthlyReport, Insight } from '../types'
import { formatCurrencyInline } from '@/lib/currency'

export function generateInsights(report: MonthlyReport): Insight[] {
  const insights: Insight[] = []

  // Rule 1: Overspending
  for (const utilization of report.budgetUtilization) {
    if (utilization.status === 'over') {
      const overage = utilization.spent - utilization.limit
      insights.push({
        type: 'overspending',
        severity: 'critical',
        message: `You overspent on ${utilization.categoryName} by ${formatCurrencyInline(overage)}.`,
        categoryId: utilization.categoryId,
      })
    }
  }

  // Rule 2: Savings shortfall
  if (report.savingsMargin < 0) {
    const shortfall = Math.abs(report.savingsMargin)
    insights.push({
      type: 'savings_shortfall',
      severity: 'warning',
      message: `You are ${formatCurrencyInline(shortfall)} short of your savings target.`,
    })
  }

  // Rule 3: Discretionary opportunity
  if (report.totalIncome > 0 && report.potentialSavings > 0.30 * report.totalIncome) {
    insights.push({
      type: 'discretionary_opportunity',
      severity: 'info',
      message: `You could save up to ${formatCurrencyInline(report.potentialSavings)} by reducing discretionary spending.`,
    })
  }

  return insights
}
