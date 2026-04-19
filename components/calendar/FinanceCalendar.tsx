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

  return (
    <div className="px-4 py-6 md:px-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--ivory)' }}>
            Calendar
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted-light)' }}>
            Track expenses &amp; scheduled payments
          </p>
        </div>

        {/* Month nav */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => goMonth(-1)}
            disabled={loading}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'var(--obsidian-3)', color: 'var(--muted-light)' }}
            aria-label="Previous month"
          >
            ‹
          </button>
          <span className="text-sm font-medium min-w-[130px] text-center" style={{ color: 'var(--ivory)' }}>
            {monthLabel(monthYear)}
          </span>
          <button
            onClick={() => goMonth(1)}
            disabled={loading}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'var(--obsidian-3)', color: 'var(--muted-light)' }}
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs" style={{ color: 'var(--muted-light)' }}>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'var(--danger)' }} />
          Expenses
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'var(--gold)' }} />
          Scheduled
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'var(--success)' }} />
          Paid
        </span>
      </div>

      {/* Calendar grid */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid var(--border-light)', background: 'var(--obsidian-2)' }}
      >
        {/* Weekday headers */}
        <div className="grid grid-cols-7">
          {WEEKDAYS.map((w) => (
            <div
              key={w}
              className="py-2 text-center text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border-light)' }}
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
                  className="min-h-[72px]"
                  style={{ borderRight: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)' }}
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
            const hasContent = dayExpenses.length > 0 || dayPayments.length > 0
            const isSelected = selectedDate === isoDate

            return (
              <button
                key={isoDate}
                onClick={() => handleDayClick(day)}
                className="min-h-[72px] p-1.5 text-left transition-colors relative flex flex-col"
                style={{
                  borderRight: '1px solid var(--border-light)',
                  borderBottom: '1px solid var(--border-light)',
                  background: isSelected
                    ? 'var(--obsidian-4)'
                    : isToday
                    ? 'rgba(201,168,76,0.06)'
                    : 'transparent',
                  cursor: 'pointer',
                }}
                aria-label={`${isoDate}${hasContent ? ' — has entries' : ''}`}
              >
                {/* Day number */}
                <span
                  className="text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full mb-1"
                  style={
                    isToday
                      ? {
                          background: 'var(--gold)',
                          color: 'var(--obsidian)',
                        }
                      : { color: 'var(--muted-light)' }
                  }
                >
                  {day}
                </span>

                {/* Expense total chip */}
                {totalSpent > 0 && (
                  <span
                    className="text-[10px] font-medium px-1 py-0.5 rounded mb-0.5 truncate w-full"
                    style={{ background: 'rgba(224,82,82,0.15)', color: 'var(--danger)' }}
                  >
                    −{formatINR(totalSpent)}
                  </span>
                )}

                {/* Unpaid payment dots */}
                {unpaidPayments.slice(0, 2).map((p) => (
                  <span
                    key={p.id}
                    className="text-[10px] font-medium px-1 py-0.5 rounded mb-0.5 truncate w-full"
                    style={{ background: 'rgba(201,168,76,0.15)', color: 'var(--gold-light)' }}
                  >
                    {p.title}
                  </span>
                ))}

                {/* Paid payment dots */}
                {paidPayments.slice(0, 1).map((p) => (
                  <span
                    key={p.id}
                    className="text-[10px] font-medium px-1 py-0.5 rounded truncate w-full line-through"
                    style={{ background: 'rgba(76,175,130,0.12)', color: 'var(--success)' }}
                  >
                    {p.title}
                  </span>
                ))}

                {/* Overflow indicator */}
                {unpaidPayments.length + paidPayments.length > 3 && (
                  <span className="text-[9px] mt-0.5" style={{ color: 'var(--muted)' }}>
                    +{unpaidPayments.length + paidPayments.length - 3} more
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Day Drawer */}
      {selectedDate && (
        <DayDrawer
          date={selectedDate}
          expenses={expenseByDay[selectedDate] ?? []}
          payments={paymentByDay[selectedDate] ?? []}
          categories={categories}
          rate={rate}
          onClose={() => setSelectedDate(null)}
          onPaymentUpdate={handlePaymentUpdate}
          onPaymentDelete={handlePaymentDelete}
          onPaymentAdd={handlePaymentAdd}
        />
      )}
    </div>
  )
}
