import CurrencyDisplay from './CurrencyDisplay'

interface MetricCardProps {
  label: string
  value: number
}

export default function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div
      style={{
        background: 'var(--obsidian-3)',
        border: '1px solid var(--border-light)',
        borderRadius: '0.5rem',
        padding: '1rem',
      }}
    >
      <p
        className="text-xs font-semibold uppercase tracking-wide"
        style={{ color: 'var(--muted-light)' }}
      >
        {label}
      </p>
      <div
        className="mt-1 text-2xl font-semibold"
        style={{ color: 'var(--ivory)' }}
      >
        <CurrencyDisplay amount={value} />
      </div>
    </div>
  )
}
