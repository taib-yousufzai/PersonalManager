'use client'

import { useState, useCallback } from 'react'
import type { Expense, ScheduledPayment, Category } from '@/lib/types'
import DayDrawer from './DayDrawer'

interface Props {
  initialExpenses: Expense[]
  initialPayments: ScheduledPayment[]
  categories: Category[]
  rate: number
  initialMonthYear: string // YYYY-MM
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function isoToday() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function monthLabel(monthYear: string) {
  const [y, m] = monthYear.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })
}

function daysInMonth(monthYear: string) {
  const [y, m] = monthYear.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

/** Monday-based weekday index 0–6 for a given ISO date */
function weekdayOf(isoDate: string) {
  const d = new Date(isoDate + 'T00:00:00')
  return (d.getDay() + 6) % 7 // Mon=0 … Sun=6
}

function padDate(monthYear: string, day: number) {
  return `${monthYear}-${String(day).padStart(2, '0')}`
}

function formatINR(n: number) {
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

/** Navigate one month forward/back */
function shiftMonth(monthYear: string, delta: 1 | -1) {
  const [y, m] = monthYear.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function FinanceCalendar({
  initialExpenses,
  initialPayments,
  categories,
  rate,
  initialMonthYear,
}: Props) {
  const [monthYear, setMonthYear] = useState(initialMonthYear)
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses)
  const [payments, setPayments] = useState<ScheduledPayment[]>(initialPayments)
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const today = isoToday()

  // Fetch data when month changes
  const loadMonth = useCallback(async (my: string) => {
    setLoading(true)
    try {
      const [expRes, payRes] = await Promise.all([
        fetch(`/api/expenses?monthYear=${my}&page=all`),
        fetch(`/api/scheduled-payments?monthYear=${my}`),
      ])
      const expData = await expRes.json()
      const payData = await payRes.json()
      setExpenses(expData.expenses ?? [])
      setPayments(payData.payments ?? [])
    } catch {
      // silent — stale data retained
    } finally {
      setLoading(false)
    }
  }, [])

  const goMonth = (delta: 1 | -1) => {
    const next = shiftMonth(monthYear, delta)
    setMonthYear(next)
    loadMonth(next)
  }

  // Build day-indexed lookup maps
  const expenseByDay = expenses.reduce<Record<string, Expense[]>>((acc, e) => {
    if (!acc[e.date]) acc[e.date] = []
    acc[e.date].push(e)
    return acc
  }, {})

  const paymentByDay = payments.reduce<Record<string, ScheduledPayment[]>>((acc, p) => {
    if (!acc[p.date]) acc[p.date] = []
    acc[p.date].push(p)
    return acc
  }, {})

  // Build calendar grid
  const numDays = daysInMonth(monthYear)
  const firstDate = padDate(monthYear, 1)
  const startOffset = weekdayOf(firstDate) // 0=Mon blanks before day 1

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: numDays }, (_, i) => i + 1),
  ]
  // Pad to complete final row
  while (cells.length % 7 !== 0) cells.push(null)

  const handleDayClick = (day: number) => {
    setSelectedDate(padDate(monthYear, day))
  }

  const handlePaymentUpdate = (updated: ScheduledPayment) => {
    setPayments((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
  }

  const handlePaymentDelete = (id: string) => {
    setPayments((prev) => prev.filter((p) => p.id !== id))
    setSelectedDate(null)
  }

  const handlePaymentAdd = (added: ScheduledPayment) => {
    setPayments((prev) => [...prev, added])
  }

  const handleExpenseAdd = () => {
    loadMonth(monthYear)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--ivory)' }}>
            Calendar
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-light)' }}>
            Financial overview for {monthLabel(monthYear)}
          </p>
        </div>

        {/* Month nav */}
        <div className="flex items-center gap-2 bg-[var(--obsidian-2)] p-1 rounded-xl border border-[var(--border-light)]">
          <button
            onClick={() => goMonth(-1)}
            disabled={loading}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-[var(--obsidian-4)] disabled:opacity-50"
            style={{ color: 'var(--muted-light)' }}
            aria-label="Previous month"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <span className="text-sm font-bold min-w-[140px] text-center" style={{ color: 'var(--ivory)' }}>
            {monthLabel(monthYear)}
          </span>
          <button
            onClick={() => goMonth(1)}
            disabled={loading}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-[var(--obsidian-4)] disabled:opacity-50"
            style={{ color: 'var(--muted-light)' }}
            aria-label="Next month"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs font-medium" style={{ color: 'var(--muted-light)' }}>
        <span className="flex items-center gap-2 bg-[var(--obsidian-3)] px-3 py-1.5 rounded-full border border-[var(--border-light)]">
          <span className="w-2 h-2 rounded-full" style={{ background: 'var(--danger)' }} />
          Expenses
        </span>
        <span className="flex items-center gap-2 bg-[var(--obsidian-3)] px-3 py-1.5 rounded-full border border-[var(--border-light)]">
          <span className="w-2 h-2 rounded-full" style={{ background: 'var(--gold)' }} />
          Scheduled
        </span>
        <span className="flex items-center gap-2 bg-[var(--obsidian-3)] px-3 py-1.5 rounded-full border border-[var(--border-light)]">
          <span className="w-2 h-2 rounded-full" style={{ background: 'var(--success)' }} />
          Paid
        </span>
      </div>

      {/* Calendar grid */}
      <div
        className="rounded-2xl overflow-hidden shadow-xl"
        style={{ border: '1px solid var(--border-light)', background: 'var(--obsidian-2)' }}
      >
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-[var(--border-light)] bg-[var(--obsidian-3)]">
          {WEEKDAYS.map((w) => (
            <div
              key={w}
              className="py-3 text-center text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em]"
              style={{ color: 'var(--muted)' }}
            >
              {w}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (day === null) {
              return (
                <div
                  key={`blank-${idx}`}
                  className="min-h-[80px] sm:min-h-[100px] border-r border-b border-[var(--border-light)] bg-[rgba(255,255,255,0.01)]"
                />
              )
            }

            const isoDate = padDate(monthYear, day)
            const isToday = isoDate === today
            const dayExpenses = expenseByDay[isoDate] ?? []
            const dayPayments = paymentByDay[isoDate] ?? []
            const totalSpent = dayExpenses.reduce((s, e) => s + e.amount, 0)
            const unpaidPayments = dayPayments.filter((p) => !p.isPaid)
            const paidPayments = dayPayments.filter((p) => p.isPaid)
            const isSelected = selectedDate === isoDate

            return (
              <button
                key={isoDate}
                onClick={() => handleDayClick(day)}
                className="min-h-[80px] sm:min-h-[100px] p-2 text-left transition-all relative flex flex-col group
                           border-r border-b border-[var(--border-light)] hover:bg-[var(--obsidian-3)]"
                style={{
                  background: isSelected
                    ? 'var(--obsidian-4)'
                    : isToday
                    ? 'rgba(201,168,76,0.08)'
                    : 'transparent',
                }}
              >
                {/* Day number */}
                <span
                  className="text-xs font-bold w-6 h-6 flex items-center justify-center rounded-lg mb-2 transition-colors"
                  style={
                    isToday
                      ? {
                          background: 'var(--gold)',
                          color: 'var(--obsidian)',
                        }
                      : { color: isSelected ? 'var(--gold)' : 'var(--muted-light)' }
                  }
                >
                  {day}
                </span>

                {/* Indicators container */}
                <div className="space-y-1 overflow-hidden flex-1">
                  {/* Expense total chip */}
                  {totalSpent > 0 && (
                    <div
                      className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md truncate w-full flex items-center gap-1"
                      style={{ background: 'rgba(224,82,82,0.15)', color: 'var(--danger)' }}
                    >
                      <span className="w-1 h-1 rounded-full bg-current shrink-0" />
                      {formatINR(totalSpent)}
                    </div>
                  )}

                  {/* Scheduled payments */}
                  {unpaidPayments.slice(0, 2).map((p) => (
                    <div
                      key={p.id}
                      className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md truncate w-full flex items-center gap-1"
                      style={{ background: 'rgba(201,168,76,0.15)', color: 'var(--gold-light)' }}
                    >
                      <span className="w-1 h-1 rounded-full bg-current shrink-0" />
                      {p.title}
                    </div>
                  ))}

                  {/* Paid payments */}
                  {paidPayments.slice(0, 1).map((p) => (
                    <div
                      key={p.id}
                      className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md truncate w-full flex items-center gap-1 opacity-60"
                      style={{ background: 'rgba(76,175,130,0.12)', color: 'var(--success)' }}
                    >
                      <span className="w-1 h-1 rounded-full bg-current shrink-0" />
                      {p.title}
                    </div>
                  ))}

                  {/* Overflow indicator */}
                  {unpaidPayments.length + paidPayments.length + (totalSpent > 0 ? 1 : 0) > 4 && (
                    <span className="text-[8px] font-bold pl-1.5" style={{ color: 'var(--muted)' }}>
                      +{unpaidPayments.length + paidPayments.length + (totalSpent > 0 ? 1 : 0) - 4} more
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Day Drawer */}
      {selectedDate && (
        <DayDrawer
          key={selectedDate}
          date={selectedDate}
          expenses={expenseByDay[selectedDate] ?? []}
          payments={paymentByDay[selectedDate] ?? []}
          categories={categories}
          rate={rate}
          onClose={() => setSelectedDate(null)}
          onPaymentUpdate={handlePaymentUpdate}
          onPaymentDelete={handlePaymentDelete}
          onPaymentAdd={handlePaymentAdd}
          onExpenseAdd={handleExpenseAdd}
        />
      )}
    </div>
  )
}
