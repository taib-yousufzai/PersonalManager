import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/firebase/admin'
import { getExpensesForMonth } from '@/lib/db/expenses'
import { getCategories } from '@/lib/db/categories'
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
    getExpensesForMonth(uid, monthYear, page),
    getCategories(uid),
  ])

  return (
    <div className="px-4 py-6 md:px-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Expenses</h1>
        <p className="text-sm text-gray-500 mt-1">{monthYear}</p>
      </div>

      {/* Add expense form */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-medium text-gray-700 mb-4">Add Expense</h2>
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
