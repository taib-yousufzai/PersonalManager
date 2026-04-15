import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { verifySession } from '@/lib/firebase/admin'
import { getCachedRecentReports } from '@/lib/cache'
import { getMonthlyReport } from '@/lib/db/monthlyReports'
import { getCachedCategories } from '@/lib/cache'
import TrendChart from '@/components/charts/TrendChart'
import type { MonthlyReport, Category } from '@/lib/types'

function fmt(amount: number): string {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function statusColor(status: 'ok' | 'warning' | 'over'): string {
  if (status === 'over') return 'var(--danger)'
  if (status === 'warning') return 'var(--warning)'
  return 'var(--success)'
}

function ReportDetail({
  report,
  categories,
}: {
  report: MonthlyReport
  categories: Category[]
}) {
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]))

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: 'var(--obsidian-3)',
        border: '1px solid var(--border-light)',
      }}
    >
      {/* Summary metrics */}
      <div
        className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-4"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-light)' }}>
            Total Income
          </p>
          <p className="text-lg font-semibold" style={{ color: 'var(--success)' }}>
            {fmt(report.totalIncome)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-light)' }}>
            Total Expenses
          </p>
          <p className="text-lg font-semibold" style={{ color: 'var(--danger)' }}>
            {fmt(report.totalExpenses)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-light)' }}>
            Actual Savings
          </p>
          <p className="text-lg font-semibold" style={{ color: 'var(--gold)' }}>
            {fmt(report.actualSavings)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-light)' }}>
            Target Savings
          </p>
          <p className="text-base font-medium" style={{ color: 'var(--ivory)' }}>
            {fmt(report.targetSavings)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-light)' }}>
            Savings Margin
          </p>
          <p className="text-base font-medium" style={{ color: 'var(--ivory)' }}>
            {fmt(report.savingsMargin)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-light)' }}>
            Safe to Spend
          </p>
          <p className="text-base font-medium" style={{ color: 'var(--ivory)' }}>
            {fmt(report.safeToSpend)}
          </p>
        </div>
      </div>

      {/* Per-category spending */}
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
                    {fmt(total)}
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
                  <span className="font-medium" style={{ color: statusColor(u.status) }}>
                    {fmt(u.spent)} / {fmt(u.limit)} ({u.utilizationPct.toFixed(0)}%)
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
    </div>
  )
}

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
  if (selected) {
    selectedReport = reports.find((r) => r.monthYear === selected) ?? null
    if (!selectedReport) {
      selectedReport = await getMonthlyReport(uid, selected)
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
                        {fmt(r.totalIncome)}
                      </td>
                      <td className="px-4 py-3 text-right" style={{ color: 'var(--danger)' }}>
                        {fmt(r.totalExpenses)}
                      </td>
                      <td className="px-4 py-3 text-right" style={{ color: 'var(--gold)' }}>
                        {fmt(r.actualSavings)}
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
          <ReportDetail report={selectedReport} categories={categories} />
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
