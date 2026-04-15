'use client'

import { useMonth } from '@/contexts/MonthContext'

function addMonths(monthYear: string, delta: number): string {
  const [year, month] = monthYear.split('-').map(Number)
  const date = new Date(year, month - 1 + delta, 1)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

function formatDisplay(monthYear: string): string {
  const [year, month] = monthYear.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

export default function MonthSelector() {
  const { selectedMonth, setSelectedMonth } = useMonth()

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => setSelectedMonth(addMonths(selectedMonth, -1))}
        className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100"
        aria-label="Previous month"
      >
        ‹
      </button>
      <span className="min-w-[140px] text-center text-sm font-medium text-gray-800">
        {formatDisplay(selectedMonth)}
      </span>
      <button
        type="button"
        onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
        className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100"
        aria-label="Next month"
      >
        ›
      </button>
    </div>
  )
}
