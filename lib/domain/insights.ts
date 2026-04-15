import type { MonthlyReport, Insight } from '../types'

export function generateInsights(report: MonthlyReport): Insight[] {
  const insights: Insight[] = []

  // Rule 1: Overspending
  for (const utilization of report.budgetUtilization) {
    if (utilization.status === 'over') {
      const overage = utilization.spent - utilization.limit
      insights.push({
        type: 'overspending',
        severity: 'critical',
        message: `You overspent on ${utilization.categoryName} by $${overage.toFixed(2)}.`,
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
      message: `You are $${shortfall.toFixed(2)} short of your savings target.`,
    })
  }

  // Rule 3: Discretionary opportunity
  if (report.totalIncome > 0 && report.potentialSavings > 0.30 * report.totalIncome) {
    insights.push({
      type: 'discretionary_opportunity',
      severity: 'info',
      message: `You could save up to $${report.potentialSavings.toFixed(2)} by reducing discretionary spending.`,
    })
  }

  return insights
}
