/**
 * Thin wrappers around Next.js unstable_cache for Firestore reads.
 * Each cached function is keyed by uid + any query params.
 * TTL: 30 seconds — short enough to feel fresh, long enough to make
 * navigation between pages instant on repeat visits.
 *
 * Cache is invalidated by revalidatePath/revalidateTag calls in Server Actions.
 */
import { unstable_cache } from 'next/cache'
import { getMonthlyReport as _getMonthlyReport, getRecentMonthlyReports as _getRecentMonthlyReports } from './db/monthlyReports'
import { getCategories as _getCategories } from './db/categories'
import { getBudgetsForMonth as _getBudgetsForMonth } from './db/budgets'
import { getExpensesForMonth as _getExpensesForMonth } from './db/expenses'

const TTL = 30 // seconds

export function getCachedMonthlyReport(uid: string, monthYear: string) {
  return unstable_cache(
    () => _getMonthlyReport(uid, monthYear),
    [`report-${uid}-${monthYear}`],
    { revalidate: TTL, tags: [`user-${uid}`, `report-${uid}-${monthYear}`] }
  )()
}

export function getCachedRecentReports(uid: string) {
  return unstable_cache(
    () => _getRecentMonthlyReports(uid),
    [`reports-${uid}`],
    { revalidate: TTL, tags: [`user-${uid}`, `reports-${uid}`] }
  )()
}

export function getCachedCategories(uid: string) {
  return unstable_cache(
    () => _getCategories(uid),
    [`categories-${uid}`],
    { revalidate: TTL, tags: [`user-${uid}`, `categories-${uid}`] }
  )()
}

export function getCachedBudgets(uid: string, monthYear: string) {
  return unstable_cache(
    () => _getBudgetsForMonth(uid, monthYear),
    [`budgets-${uid}-${monthYear}`],
    { revalidate: TTL, tags: [`user-${uid}`, `budgets-${uid}-${monthYear}`] }
  )()
}

export function getCachedExpenses(uid: string, monthYear: string, cursor?: string) {
  return unstable_cache(
    () => _getExpensesForMonth(uid, monthYear, cursor),
    [`expenses-${uid}-${monthYear}-${cursor ?? 'p1'}`],
    { revalidate: TTL, tags: [`user-${uid}`, `expenses-${uid}-${monthYear}`] }
  )()
}
