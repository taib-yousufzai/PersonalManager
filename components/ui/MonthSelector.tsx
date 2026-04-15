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

  const btnStyle: React.CSSProperties = {
    color: 'var(--muted-light)',
    background: 'transparent',
    border: '1px solid var(--border-light)',
    borderRadius: '0.375rem',
    padding: '0.25rem 0.5rem',
    cursor: 'pointer',
    transition: 'color 0.15s',
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => setSelectedMonth(addMonths(selectedMonth, -1))}
        style={btnStyle}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted-light)')}
        aria-label="Previous month"
      >
        ‹
      </button>
      <span
        className="min-w-[140px] text-center text-sm font-medium"
        style={{ color: 'var(--ivory)' }}
      >
        {formatDisplay(selectedMonth)}
      </span>
      <button
        type="button"
        onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
        style={btnStyle}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted-light)')}
        aria-label="Next month"
      >
        ›
      </button>
    </div>
  )
}
