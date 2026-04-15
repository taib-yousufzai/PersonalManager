import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { verifySession } from '@/lib/firebase/admin'
import { getRecentMonthlyReports, getMonthlyReport } from '@/lib/db/monthlyReports'
import { getCategories } from '@/lib/db/categories'
import TrendChart from '@/components/charts/TrendChart'
import type { MonthlyReport, Category } from '@/lib/types'

function fmt(amount: number): string {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function statusColor(status: 'ok' | 'warning' | 'over'): string {
  if (status === 'over') return 'text-red-600'
  if (status === 'warning') return 'text-yellow-600'
  return 'text-green-600'
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
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm divide-y divide-gray-100">
      {/* Summary metrics */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-gray-500">Total Income</p>
          <p className="text-lg font-semibold text-green-600">{fmt(report.totalIncome)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Total Expenses</p>
          <p className="text-lg font-semibold text-red-600">{fmt(report.totalExpenses)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Actual Savings</p>
          <p className="text-lg font-semibold text-blue-600">{fmt(report.actualSavings)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Target Savings</p>
          <p className="text-base font-medium text-gray-700">{fmt(report.targetSavings)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Savings Margin</p>
          <p className="text-base font-medium text-gray-700">{fmt(report.savingsMargin)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Safe to Spend</p>
          <p className="text-base font-medium text-gray-700">{fmt(report.safeToSpend)}</p>
        </div>
      </div>

      {/* Per-category spending */}
      {Object.keys(report.categoryTotals).length > 0 && (
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Spending by Category</h3>
          <ul className="space-y-1">
            {Object.entries(report.categoryTotals)
              .sort(([, a], [, b]) => b - a)
              .map(([catId, total]) => (
                <li key={catId} className="flex justify-between text-sm">
                  <span className="text-gray-600">{categoryMap[catId] ?? catId}</span>
                  <span className="font-medium text-gray-900">{fmt(total)}</span>
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Budget utilization */}
      {report.budgetUtilization.length > 0 && (
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Budget Utilization</h3>
          <ul className="space-y-2">
            {report.budgetUtilization.map((u) => (
              <li key={u.categoryId}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{u.categoryName}</span>
                  <span className={`font-medium ${statusColor(u.status)}`}>
                    {fmt(u.spent)} / {fmt(u.limit)} ({u.utilizationPct.toFixed(0)}%)
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      u.status === 'over'
                        ? 'bg-red-500'
                        : u.status === 'warning'
                        ? 'bg-yellow-400'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(u.utilizationPct, 100)}%` }}
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
    getRecentMonthlyReports(uid),
    getCategories(uid),
  ])

  // Fetch selected report detail if needed
  let selectedReport: MonthlyReport | null = null
  if (selected) {
    // Check if it's already in the list to avoid an extra DB call
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
      <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>

      {/* Trend chart */}
      {reports.length > 0 ? (
        <section>
          <h2 className="text-base font-medium text-gray-700 mb-3">12-Month Trend</h2>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <Suspense fallback={<div className="h-64 flex items-center justify-center text-sm text-gray-400">Loading chart…</div>}>
              <TrendChart reports={trendData} />
            </Suspense>
          </div>
        </section>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
          <p className="text-gray-500 text-sm">No reports yet. Reports are generated automatically each month.</p>
        </div>
      )}

      {/* Monthly reports list */}
      {reports.length > 0 && (
        <section>
          <h2 className="text-base font-medium text-gray-700 mb-3">Monthly Breakdown</h2>
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Month</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Income</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Expenses</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Savings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reports.map((r) => {
                  const isSelected = r.monthYear === selected
                  return (
                    <tr
                      key={r.monthYear}
                      className={isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={isSelected ? '/reports' : `/reports?selected=${r.monthYear}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {r.monthYear}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right text-green-600">{fmt(r.totalIncome)}</td>
                      <td className="px-4 py-3 text-right text-red-600">{fmt(r.totalExpenses)}</td>
                      <td className="px-4 py-3 text-right text-blue-600">{fmt(r.actualSavings)}</td>
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
            <h2 className="text-base font-medium text-gray-700">Detail: {selected}</h2>
            <Link href="/reports" className="text-sm text-gray-500 hover:text-gray-700">
              ✕ Close
            </Link>
          </div>
          <ReportDetail report={selectedReport} categories={categories} />
        </section>
      )}

      {selected && !selectedReport && (
        <p className="text-sm text-gray-500">No report found for {selected}.</p>
      )}
    </div>
  )
}
