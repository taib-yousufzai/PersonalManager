import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/firebase/admin'
import { getCachedBudgets, getCachedMonthlyReport, getCachedCategories } from '@/lib/cache'
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
    getCachedBudgets(uid, monthYear),
    getCachedMonthlyReport(uid, monthYear),
    getCachedCategories(uid),
  ])

  const utilization = report?.budgetUtilization ?? []

  return (
    <div className="px-4 py-6 md:px-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--ivory)' }}>
          Budgets
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-light)' }}>
          {monthYear}
        </p>
      </div>

      {/* Budget progress list */}
      <section>
        <h2
          className="text-xs font-semibold uppercase tracking-wide mb-3"
          style={{ color: 'var(--muted-light)' }}
        >
          Budget Utilization
        </h2>
        <BudgetList
          budgets={budgets}
          utilization={utilization}
          categories={categories}
          monthYear={monthYear}
        />
      </section>

      {/* Add / set new budget */}
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
          Set Budget
        </h2>
        <BudgetForm categories={categories} />
      </div>
    </div>
  )
}
