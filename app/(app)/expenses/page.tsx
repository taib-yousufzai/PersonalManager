import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/firebase/admin'
import { getCachedExpenses, getCachedCategories } from '@/lib/cache'
import { ExpenseForm } from '@/components/forms/ExpenseForm'
import ExpenseList from './ExpenseList'

function getCurrentMonth(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export default async function ExpensesPage({
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
  const page = typeof params.page === 'string' ? params.page : undefined

  const [{ expenses, nextPage }, categories] = await Promise.all([
    getCachedExpenses(uid, monthYear, page),
    getCachedCategories(uid),
  ])

  return (
    <div className="px-4 py-6 md:px-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--ivory)' }}>
          Expenses
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-light)' }}>
          {monthYear}
        </p>
      </div>

      {/* Add expense form */}
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

      {/* Expense list with edit/delete */}
      <ExpenseList
        expenses={expenses}
        categories={categories}
        monthYear={monthYear}
        nextPage={nextPage}
        currentCursor={page}
      />
    </div>
  )
}
