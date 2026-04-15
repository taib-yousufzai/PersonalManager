import { verifySession } from '@/lib/firebase/admin'
import { getMonthlyReport } from '@/lib/db/monthlyReports'
import { getCategories } from '@/lib/db/categories'
import { generateInsights } from '@/lib/domain/insights'
import MetricCard from '@/components/ui/MetricCard'
import BudgetProgressBar from '@/components/ui/BudgetProgressBar'
import InsightCard from '@/components/ui/InsightCard'
import { IncomeForm } from '@/components/forms/IncomeForm'
import { ExpenseForm } from '@/components/forms/ExpenseForm'
import { redirect } from 'next/navigation'

function getCurrentMonth(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export default async function DashboardPage() {
  let uid: string
  try {
    uid = await verifySession()
  } catch {
    redirect('/sign-in')
  }

  const monthYear = getCurrentMonth()
  const [report, categories] = await Promise.all([
    getMonthlyReport(uid, monthYear),
    getCategories(uid),
  ])
  const insights = report ? generateInsights(report) : []

  const noIncome = !report || report.totalIncome === 0

  return (
    <div className="px-4 py-6 md:px-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">{monthYear}</p>
      </div>

      {/* No-income prompt */}
      {noIncome && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-800">
            No income recorded for this month yet.
          </p>
          <p className="text-sm text-blue-700 mt-1">
            Add your income below to start tracking your finances.
          </p>
        </div>
      )}

      {/* Metric cards */}
      <section>
        <h2 className="text-base font-medium text-gray-700 mb-3">Monthly Summary</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <MetricCard label="Total Income" value={report?.totalIncome ?? 0} />
          <MetricCard label="Total Expenses" value={report?.totalExpenses ?? 0} />
          <MetricCard label="Actual Savings" value={report?.actualSavings ?? 0} />
          <MetricCard label="Target Savings" value={report?.targetSavings ?? 0} />
          <MetricCard label="Safe to Spend" value={report?.safeToSpend ?? 0} />
          <MetricCard label="Savings Margin" value={report?.savingsMargin ?? 0} />
        </div>
      </section>

      {/* Budget progress bars */}
      {report && report.budgetUtilization.length > 0 && (
        <section>
          <h2 className="text-base font-medium text-gray-700 mb-3">Budget Utilization</h2>
          <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            {report.budgetUtilization.map((b) => (
              <BudgetProgressBar
                key={b.categoryId}
                label={b.categoryName}
                spent={b.spent}
                budgeted={b.limit}
              />
            ))}
          </div>
        </section>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <section>
          <h2 className="text-base font-medium text-gray-700 mb-3">Insights</h2>
          <div className="space-y-3">
            {insights.map((insight, i) => (
              <InsightCard key={i} insight={insight} />
            ))}
          </div>
        </section>
      )}

      {/* Quick entry forms */}
      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-medium text-gray-700 mb-4">Add Income</h2>
          <IncomeForm />
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-medium text-gray-700 mb-4">Add Expense</h2>
          <ExpenseForm categories={categories} />
        </div>
      </section>
    </div>
  )
}
