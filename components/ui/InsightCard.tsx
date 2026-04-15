import type { Insight } from '@/lib/types'

interface InsightCardProps {
  insight: Insight
}

const severityStyles: Record<Insight['severity'], { card: string; badge: string }> = {
  info: {
    card: 'border-blue-200 bg-blue-50',
    badge: 'bg-blue-100 text-blue-700',
  },
  warning: {
    card: 'border-amber-200 bg-amber-50',
    badge: 'bg-amber-100 text-amber-700',
  },
  critical: {
    card: 'border-red-200 bg-red-50',
    badge: 'bg-red-100 text-red-700',
  },
}

export default function InsightCard({ insight }: InsightCardProps) {
  const styles = severityStyles[insight.severity]

  return (
    <div className={`rounded-lg border p-4 ${styles.card}`}>
      <div className="flex items-start gap-3">
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${styles.badge}`}>
          {insight.severity}
        </span>
        <p className="text-sm text-gray-800">{insight.message}</p>
      </div>
    </div>
  )
}
