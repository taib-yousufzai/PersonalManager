'use client'
import CurrencyDisplay from './CurrencyDisplay'

interface BudgetProgressBarProps {
  spent: number
  budgeted: number
  label?: string
}

export default function BudgetProgressBar({ spent, budgeted, label }: BudgetProgressBarProps) {
  const pct = budgeted > 0 ? (spent / budgeted) * 100 : 0
  const clamped = Math.min(pct, 100)

  const barColor =
    pct > 100
      ? 'var(--danger)'
      : pct >= 80
        ? 'var(--warning)'
        : 'var(--success)'

  const textColor =
    pct > 100
      ? 'var(--danger)'
      : pct >= 80
        ? 'var(--warning)'
        : 'var(--success)'

  return (
    <div className="w-full">
      {label && (
        <div className="mb-1 flex justify-between text-sm">
          <span style={{ color: 'var(--ivory)' }}>{label}</span>
          <span className="flex items-center gap-1" style={{ color: textColor }}>
            <CurrencyDisplay amount={spent} inline /> / <CurrencyDisplay amount={budgeted} inline />
          </span>
        </div>
      )}
      <div
        className="h-2 w-full overflow-hidden rounded-full"
        style={{ background: 'var(--obsidian-4)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${clamped}%`, background: barColor }}
        />
      </div>
    </div>
  )
}
