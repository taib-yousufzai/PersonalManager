interface CategoryBadgeProps {
  name: string
  type: 'essential' | 'discretionary'
}

export default function CategoryBadge({ name, type }: CategoryBadgeProps) {
  const badgeStyle =
    type === 'essential'
      ? 'bg-blue-100 text-blue-700'
      : 'bg-purple-100 text-purple-700'

  return (
    <div className="inline-flex items-center gap-2">
      <span className="text-sm font-medium text-gray-800">{name}</span>
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${badgeStyle}`}>
        {type}
      </span>
    </div>
  )
}
