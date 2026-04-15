'use client'

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
      ? 'bg-red-500'
      : pct >= 80
        ? 'bg-amber-400'
        : 'bg-green-500'

  const textColor =
    pct > 100
      ? 'text-red-600'
      : pct >= 80
        ? 'text-amber-600'
        : 'text-green-600'

  return (
    <div className="w-full">
      {label && (
        <div className="mb-1 flex justify-between text-sm">
          <span className="text-gray-700">{label}</span>
          <span className={textColor}>
            {spent.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} /{' '}
            {budgeted.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
