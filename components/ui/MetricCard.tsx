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
      <p
        className="mt-1 text-2xl font-semibold"
        style={{ color: 'var(--ivory)' }}
      >
        {value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
      </p>
    </div>
  )
}
