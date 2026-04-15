interface CategoryBadgeProps {
  name: string
  type: 'essential' | 'discretionary'
}

export default function CategoryBadge({ name, type }: CategoryBadgeProps) {
  const pillStyle =
    type === 'essential'
      ? { background: 'rgba(76,175,130,0.15)', color: 'var(--success)' }
      : { background: 'rgba(201,168,76,0.15)', color: 'var(--gold-light)' }

  return (
    <div className="inline-flex items-center gap-2">
      <span className="text-sm font-medium" style={{ color: 'var(--ivory)' }}>
        {name}
      </span>
      <span
        className="rounded-full px-2 py-0.5 text-xs font-medium capitalize"
        style={pillStyle}
      >
        {type}
      </span>
    </div>
  )
}
