import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { verifySession } from '@/lib/firebase/admin'
import { getCachedRecentReports, getCachedCategories } from '@/lib/cache'
import { getMonthlyReport } from '@/lib/db/monthlyReports'
import { getAllExpensesForMonth } from '@/lib/db/expenses'
import TrendChart from '@/components/charts/TrendChart'
import CurrencyDisplay from '@/components/ui/CurrencyDisplay'
import type { MonthlyReport, Category, Expense } from '@/lib/types'

function statusColor(status: 'ok' | 'warning' | 'over'): string {
  if (status === 'over') return 'var(--danger)'
  if (status === 'warning') return 'var(--warning)'
  return 'var(--success)'
}

function ReportDetail({
  report,
  categories,
  previousReport,
  expenses,
}: {
  report: MonthlyReport
  categories: Category[]
  previousReport: MonthlyReport | null
  expenses: Expense[]
}) {
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]))
  const categoryTypes = Object.fromEntries(categories.map((c) => [c.id, c.type]))

  // 1. Calculate MoM changes
  const getChange = (current: number, previous: number | undefined) => {
    if (previous === undefined || previous === 0) return null
    const diff = current - previous
    const pct = (diff / previous) * 100
    return { diff, pct }
  }

  const incomeChange = getChange(report.totalIncome, previousReport?.totalIncome)
  const expenseChange = getChange(report.totalExpenses, previousReport?.totalExpenses)
  const savingsChange = getChange(report.actualSavings, previousReport?.actualSavings)

  // 2. Classify spending
  const classification = Object.entries(report.categoryTotals).reduce(
    (acc, [catId, total]) => {
      const type = categoryTypes[catId] ?? 'essential'
      acc[type] += total
      return acc
    },
    { essential: 0, discretionary: 0 }
  )

  const essentialPct =
    report.totalExpenses > 0 ? (classification.essential / report.totalExpenses) * 100 : 0
  const discretionaryPct =
    report.totalExpenses > 0 ? (classification.discretionary / report.totalExpenses) * 100 : 0

  function Delta({ change, inverse = false }: { change: { diff: number; pct: number } | null; inverse?: boolean }) {
    if (!change) return null
    const isIncrease = change.diff > 0
    // For expenses, increase is bad (red), decrease is good (green)
    // For income/savings, increase is good (green), decrease is bad (red)
    const isGood = inverse ? !isIncrease : isIncrease
    const color = isGood ? 'var(--success)' : 'var(--danger)'

    return (
      <span className="text-[10px] font-bold ml-1.5 flex items-center" style={{ color }}>
        {isIncrease ? '↑' : '↓'}
        {Math.abs(change.pct).toFixed(0)}%
      </span>
    )
  }

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: 'var(--obsidian-3)',
        border: '1px solid var(--border-light)',
      }}
    >
      {/* Narrative Summary */}
      <div className="p-4 bg-gold/5" style={{ borderBottom: '1px solid var(--border)' }}>
        <h3 className="text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-2" style={{ color: 'var(--gold)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
          Monthly Insight
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--ivory)' }}>
          {savingsChange && savingsChange.diff > 0 
            ? `Excellent! You saved ${formatCurrencyInline(savingsChange.diff)} more than last month.` 
            : expenseChange && expenseChange.diff > 0 
            ? `Your spending increased by ${Math.abs(expenseChange.pct).toFixed(0)}% this month. Let's look at why.` 
            : "Your financial health is stable. Review the breakdown below for specific details."
          }
           {" "}
          {discretionaryPct > 35 
            ? "Your lifestyle spending is a bit high this month. Reducing small non-essential purchases could boost your savings." 
            : "You're doing a great job keeping non-essential spending under control."
          }
        </p>
      </div>

      {/* Summary metrics */}
      <div
        className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-4"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide flex items-center" style={{ color: 'var(--muted-light)' }}>
            Income
            <Delta change={incomeChange} />
          </p>
          <p className="text-lg font-semibold" style={{ color: 'var(--success)' }}>
            <CurrencyDisplay amount={report.totalIncome} />
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide flex items-center" style={{ color: 'var(--muted-light)' }}>
            Expenses
            <Delta change={expenseChange} inverse />
          </p>
          <p className="text-lg font-semibold" style={{ color: 'var(--danger)' }}>
            <CurrencyDisplay amount={report.totalExpenses} />
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide flex items-center" style={{ color: 'var(--muted-light)' }}>
            Savings
            <Delta change={savingsChange} />
          </p>
          <p className="text-lg font-semibold" style={{ color: 'var(--gold)' }}>
            <CurrencyDisplay amount={report.actualSavings} />
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-light)' }}>
            Target Savings
          </p>
          <p className="text-base font-medium" style={{ color: 'var(--ivory)' }}>
            <CurrencyDisplay amount={report.targetSavings} />
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-light)' }}>
            Savings Margin
          </p>
          <p className="text-base font-medium" style={{ color: 'var(--ivory)' }}>
            <CurrencyDisplay amount={report.savingsMargin} />
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-light)' }}>
            Safe to Spend
          </p>
          <p className="text-base font-medium" style={{ color: 'var(--ivory)' }}>
            <CurrencyDisplay amount={report.safeToSpend} />
          </p>
        </div>
      </div>

      {/* Classification Breakdown */}
      <div className="p-4 bg-black/10 flex items-center gap-6" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex-1">
          <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--muted-light)' }}>
            Needs vs. Wants
          </h3>
          <div className="h-2 w-full rounded-full overflow-hidden flex bg-white/5">
            <div className="h-full bg-blue-500/50" style={{ width: `${essentialPct}%` }} title="Essential" />
            <div className="h-full bg-purple-500/50" style={{ width: `${discretionaryPct}%` }} title="Discretionary" />
          </div>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500/50" />
              <span className="text-[10px] uppercase font-bold text-blue-300/70">Essential: {essentialPct.toFixed(0)}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-purple-500/50" />
              <span className="text-[10px] uppercase font-bold text-purple-300/70">Discretionary: {discretionaryPct.toFixed(0)}%</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase font-bold text-muted-light mb-1">Impact</p>
          <p className="text-sm font-medium" style={{ color: discretionaryPct > 30 ? 'var(--warning)' : 'var(--success)' }}>
            {discretionaryPct > 30 ? 'High Discretionary' : 'Healthy Split'}
          </p>
        </div>
      </div>
      {Object.keys(report.categoryTotals).length > 0 && (
        <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h3
            className="text-xs font-semibold uppercase tracking-wide mb-3"
            style={{ color: 'var(--muted-light)' }}
          >
            Spending by Category
          </h3>
          <ul className="space-y-1">
            {Object.entries(report.categoryTotals)
              .sort(([, a], [, b]) => b - a)
              .map(([catId, total]) => (
                <li key={catId} className="flex justify-between text-sm">
                  <span style={{ color: 'var(--muted-light)' }}>
                    {categoryMap[catId] ?? catId}
                  </span>
                  <span className="font-medium" style={{ color: 'var(--ivory)' }}>
                    <CurrencyDisplay amount={total} inline />
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Budget utilization */}
      {report.budgetUtilization.length > 0 && (
        <div className="p-4">
          <h3
            className="text-xs font-semibold uppercase tracking-wide mb-3"
            style={{ color: 'var(--muted-light)' }}
          >
            Budget Utilization
          </h3>
          <ul className="space-y-3">
            {report.budgetUtilization.map((u) => (
              <li key={u.categoryId}>
                <div className="flex justify-between text-sm mb-1">
                  <span style={{ color: 'var(--muted-light)' }}>{u.categoryName}</span>
                  <span className="font-medium flex gap-1 items-center" style={{ color: statusColor(u.status) }}>
                    <CurrencyDisplay amount={u.spent} inline /> / <CurrencyDisplay amount={u.limit} inline /> ({u.utilizationPct.toFixed(0)}%)
                  </span>
                </div>
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ background: 'var(--obsidian-4)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(u.utilizationPct, 100)}%`,
                      background: statusColor(u.status),
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Detailed Expenses (Top Items) */}
      {expenses.length > 0 && (
        <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
          <h3
            className="text-xs font-semibold uppercase tracking-wide mb-3"
            style={{ color: 'var(--muted-light)' }}
          >
            Top 10 Expenses
          </h3>
          <ul className="divide-y divide-white/5">
            {[...expenses]
              .sort((a, b) => b.amount - a.amount)
              .slice(0, 10)
              .map((e) => (
                <li key={e.id} className="py-2 flex justify-between items-center group">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium" style={{ color: 'var(--ivory)' }}>
                      {e.note || "Unlabeled Expense"}
                    </span>
                    <span className="text-[10px]" style={{ color: 'var(--muted)' }}>
                      {categoryMap[e.categoryId] || 'Unknown'} • {new Date(e.date).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: 'var(--danger)' }}>
                    -<CurrencyDisplay amount={e.amount} inline />
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  )
}

import { formatCurrencyInline } from '@/lib/currency'

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  let uid: string
  try {
    uid = await verifySession()
  } catch {
    redirect('/sign-in')
  }

  const params = await searchParams
  const selected = typeof params.selected === 'string' ? params.selected : null

  const [reports, categories] = await Promise.all([
    getCachedRecentReports(uid),
    getCachedCategories(uid),
  ])

  let selectedReport: MonthlyReport | null = null
  let previousReport: MonthlyReport | null = null
  let selectedExpenses: Expense[] = []

  if (selected) {
    const selectedIdx = reports.findIndex((r) => r.monthYear === selected)
    if (selectedIdx !== -1) {
      selectedReport = reports[selectedIdx]
      previousReport = reports[selectedIdx + 1] ?? null
    } else {
      selectedReport = await getMonthlyReport(uid, selected)
      // If not in cache, we'd need to fetch previous too, but cachedRecentReports should cover most cases
    }

    if (selectedReport) {
      selectedExpenses = await getAllExpensesForMonth(uid, selected)
    }
  }

  const trendData = [...reports].reverse().map(({ monthYear, totalIncome, totalExpenses, actualSavings }) => ({
    monthYear,
    totalIncome,
    totalExpenses,
    actualSavings,
  }))

  return (
    <div className="px-4 py-6 md:px-8 max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-semibold" style={{ color: 'var(--ivory)' }}>
        Reports
      </h1>

      {/* Trend chart */}
      {reports.length > 0 ? (
        <section>
          <h2
            className="text-xs font-semibold uppercase tracking-wide mb-3"
            style={{ color: 'var(--muted-light)' }}
          >
            12-Month Trend
          </h2>
          <div
            className="rounded-lg p-4"
            style={{
              background: 'var(--obsidian-3)',
              border: '1px solid var(--border-light)',
            }}
          >
            <Suspense
              fallback={
                <div
                  className="h-64 flex items-center justify-center text-sm"
                  style={{ color: 'var(--muted)' }}
                >
                  Loading chart…
                </div>
              }
            >
              <TrendChart reports={trendData} />
            </Suspense>
          </div>
        </section>
      ) : (
        <div
          className="rounded-lg p-10 text-center"
          style={{
            background: 'var(--obsidian-3)',
            border: '1px dashed var(--border-light)',
          }}
        >
          <p className="text-sm" style={{ color: 'var(--muted-light)' }}>
            No reports yet. Reports are generated automatically each month.
          </p>
        </div>
      )}

      {/* Monthly reports table */}
      {reports.length > 0 && (
        <section>
          <h2
            className="text-xs font-semibold uppercase tracking-wide mb-3"
            style={{ color: 'var(--muted-light)' }}
          >
            Monthly Breakdown
          </h2>
          <div
            className="rounded-lg overflow-hidden"
            style={{
              background: 'var(--obsidian-3)',
              border: '1px solid var(--border-light)',
            }}
          >
            <table className="w-full text-sm">
              <thead style={{ background: 'var(--obsidian-4)', borderBottom: '1px solid var(--border-light)' }}>
                <tr>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--muted-light)' }}
                  >
                    Month
                  </th>
                  <th
                    className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--muted-light)' }}
                  >
                    Income
                  </th>
                  <th
                    className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--muted-light)' }}
                  >
                    Expenses
                  </th>
                  <th
                    className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--muted-light)' }}
                  >
                    Savings
                  </th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r, idx) => {
                  const isSelected = r.monthYear === selected
                  return (
                    <tr
                      key={r.monthYear}
                      style={{
                        background: isSelected ? 'rgba(201,168,76,0.08)' : undefined,
                        borderTop: idx > 0 ? '1px solid var(--border)' : undefined,
                      }}
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={isSelected ? '/reports' : `/reports?selected=${r.monthYear}`}
                          className="font-medium transition-colors"
                          style={{ color: 'var(--gold)' }}
                        >
                          {r.monthYear}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right" style={{ color: 'var(--success)' }}>
                        <CurrencyDisplay amount={r.totalIncome} inline />
                      </td>
                      <td className="px-4 py-3 text-right" style={{ color: 'var(--danger)' }}>
                        <CurrencyDisplay amount={r.totalExpenses} inline />
                      </td>
                      <td className="px-4 py-3 text-right" style={{ color: 'var(--gold)' }}>
                        <CurrencyDisplay amount={r.actualSavings} inline />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Selected month detail */}
      {selected && selectedReport && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--muted-light)' }}
            >
              Detail: {selected}
            </h2>
            <Link
              href="/reports"
              className="text-sm transition-colors"
              style={{ color: 'var(--muted-light)' }}
            >
              ✕ Close
            </Link>
          </div>
          <ReportDetail
            report={selectedReport}
            categories={categories}
            previousReport={previousReport}
            expenses={selectedExpenses}
          />
        </section>
      )}

      {selected && !selectedReport && (
        <p className="text-sm" style={{ color: 'var(--muted-light)' }}>
          No report found for {selected}.
        </p>
      )}
    </div>
  )
}
