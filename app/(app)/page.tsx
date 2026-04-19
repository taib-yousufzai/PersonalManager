import { verifySession } from '@/lib/firebase/admin'
import { getCachedMonthlyReport, getCachedCategories } from '@/lib/cache'
import { generateInsights } from '@/lib/domain/insights'
import { getUSDtoINRRate } from '@/lib/currency'
import MetricCard from '@/components/ui/MetricCard'
import BudgetProgressBar from '@/components/ui/BudgetProgressBar'
import InsightCard from '@/components/ui/InsightCard'
import { IncomeForm } from '@/components/forms/IncomeForm'
import { ExpenseForm } from '@/components/forms/ExpenseForm'
import TodayBanner from '@/components/calendar/TodayBanner'
import NotificationInit from '@/components/calendar/NotificationInit'
import { getScheduledPaymentsForDate, getScheduledPaymentsByMonth } from '@/lib/db/scheduledPayments'
import { getAllExpensesForMonth } from '@/lib/db/expenses'
import FinanceCalendar from '@/components/calendar/FinanceCalendar'
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
  const today = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })()

  const [report, categories, usdToINR, todayPayments, monthExpenses, monthPayments] = await Promise.all([
    getCachedMonthlyReport(uid, monthYear),
    getCachedCategories(uid),
    getUSDtoINRRate(),
    getScheduledPaymentsForDate(uid, today),
    getAllExpensesForMonth(uid, monthYear),
    getScheduledPaymentsByMonth(uid, monthYear),
  ])
  const insights = report ? generateInsights(report) : []

  const noIncome = !report || report.totalIncome === 0

  return (
    <div className="px-4 py-6 md:px-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--ivory)' }}>
          Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-light)' }}>
          {monthYear}
        </p>
      </div>

      {/* Due-today notification (browser) */}
      <NotificationInit payments={todayPayments} />

      {/* Due-today banner */}
      {todayPayments.some((p) => !p.isPaid) && (
        <TodayBanner payments={todayPayments} />
      )}

      {/* No-income prompt */}
      {noIncome && (
        <div
          className="rounded-lg p-4"
          style={{
            background: 'rgba(201,168,76,0.08)',
            border: '1px solid rgba(201,168,76,0.25)',
          }}
        >
          <p className="text-sm font-medium" style={{ color: 'var(--gold-light)' }}>
            No income recorded for this month yet.
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-light)' }}>
            Add your income below to start tracking your finances.
          </p>
        </div>
      )}

      {/* Metric cards */}
      <section>
        <h2
          className="text-xs font-semibold uppercase tracking-wide mb-3"
          style={{ color: 'var(--muted-light)' }}
        >
          Monthly Summary
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <MetricCard label="Total Income" value={report?.totalIncome ?? 0} rate={usdToINR} />
          <MetricCard label="Total Expenses" value={report?.totalExpenses ?? 0} rate={usdToINR} />
          <MetricCard label="Actual Savings" value={report?.actualSavings ?? 0} rate={usdToINR} />
          <MetricCard label="Target Savings" value={report?.targetSavings ?? 0} rate={usdToINR} />
          <MetricCard label="Safe to Spend" value={report?.safeToSpend ?? 0} rate={usdToINR} />
          <MetricCard label="Savings Margin" value={report?.savingsMargin ?? 0} rate={usdToINR} />
        </div>
      </section>

      {/* Embedded Calendar */}
      <section>
        <FinanceCalendar
          initialExpenses={monthExpenses}
          initialPayments={monthPayments}
          categories={categories}
          rate={usdToINR}
          initialMonthYear={monthYear}
        />
      </section>

      {/* Budget progress bars */}
      {report && report.budgetUtilization.length > 0 && (
        <section>
          <h2
            className="text-xs font-semibold uppercase tracking-wide mb-3"
            style={{ color: 'var(--muted-light)' }}
          >
            Budget Utilization
          </h2>
          <div
            className="space-y-4 rounded-lg p-4"
            style={{
              background: 'var(--obsidian-3)',
              border: '1px solid var(--border-light)',
            }}
          >
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
          <h2
            className="text-xs font-semibold uppercase tracking-wide mb-3"
            style={{ color: 'var(--muted-light)' }}
          >
            Insights
          </h2>
          <div className="space-y-3">
            {insights.map((insight, i) => (
              <InsightCard key={i} insight={insight} />
            ))}
          </div>
        </section>
      )}

      {/* Quick entry forms */}
      <section className="grid gap-6 md:grid-cols-2">
        <div
          className="rounded-lg p-4"
          style={{
            background: 'var(--obsidian-3)',
            border: '1px solid var(--border-light)',
          }}
        >
          <h2
            className="text-xs font-semibold uppercase tracking-wide mb-4"
            style={{ color: 'var(--muted-light)' }}
          >
            Add Income
          </h2>
          <IncomeForm />
        </div>
        <div
          className="rounded-lg p-4"
          style={{
            background: 'var(--obsidian-3)',
            border: '1px solid var(--border-light)',
          }}
        >
          <h2
            className="text-xs font-semibold uppercase tracking-wide mb-4"
            style={{ color: 'var(--muted-light)' }}
          >
            Add Expense
          </h2>
          <ExpenseForm categories={categories} />
        </div>
      </section>
    </div>
  )
}
