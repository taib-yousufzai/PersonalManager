import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/firebase/admin'
import { getBudgetsForMonth } from '@/lib/db/budgets'
import { getMonthlyReport } from '@/lib/db/monthlyReports'
import { getCategories } from '@/lib/db/categories'
import { BudgetForm } from '@/components/forms/BudgetForm'
import BudgetList from './BudgetList'

function getCurrentMonth(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export default async function BudgetsPage({
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
  const monthYear =
    typeof params.monthYear === 'string' ? params.monthYear : getCurrentMonth()

  const [budgets, report, categories] = await Promise.all([
    getBudgetsForMonth(uid, monthYear),
    getMonthlyReport(uid, monthYear),
    getCategories(uid),
  ])

  const utilization = report?.budgetUtilization ?? []

  return (
    <div className="px-4 py-6 md:px-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Budgets</h1>
        <p className="text-sm text-gray-500 mt-1">{monthYear}</p>
      </div>

      {/* Budget progress list */}
      <section>
        <h2 className="text-base font-medium text-gray-700 mb-3">Budget Utilization</h2>
        <BudgetList
          budgets={budgets}
          utilization={utilization}
          categories={categories}
          monthYear={monthYear}
        />
      </section>

      {/* Add / set new budget */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-medium text-gray-700 mb-4">Set Budget</h2>
        <BudgetForm categories={categories} />
      </div>
    </div>
  )
}
