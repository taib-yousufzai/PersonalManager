import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/firebase/admin'
import { getCachedCategories } from '@/lib/cache'
import { getAllExpensesForMonth } from '@/lib/db/expenses'
import { getScheduledPaymentsByMonth } from '@/lib/db/scheduledPayments'
import { getUSDtoINRRate } from '@/lib/currency'
import FinanceCalendar from '@/components/calendar/FinanceCalendar'

function getCurrentMonthYear() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export const metadata = {
  title: 'Calendar — Personal Finance Manager',
  description: 'View spending by day and schedule future payments in a calendar view.',
}

export default async function CalendarPage() {
  let uid: string
  try {
    uid = await verifySession()
  } catch {
    redirect('/sign-in')
  }

  const monthYear = getCurrentMonthYear()

  const [expenses, payments, categories, rate] = await Promise.all([
    getAllExpensesForMonth(uid, monthYear),
    getScheduledPaymentsByMonth(uid, monthYear),
    getCachedCategories(uid),
    getUSDtoINRRate(),
  ])

  return (
    <FinanceCalendar
      initialExpenses={expenses}
      initialPayments={payments}
      categories={categories}
      rate={rate}
      initialMonthYear={monthYear}
    />
  )
}
