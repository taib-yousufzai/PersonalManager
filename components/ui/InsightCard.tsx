import type { Insight } from '@/lib/types'

interface InsightCardProps {
  insight: Insight
}

const severityStyles: Record<
  Insight['severity'],
  { cardBg: string; cardBorder: string; badgeBg: string; badgeColor: string }
> = {
  info: {
    cardBg: 'rgba(201,168,76,0.08)',
    cardBorder: 'rgba(201,168,76,0.25)',
    badgeBg: 'rgba(201,168,76,0.18)',
    badgeColor: 'var(--gold-light)',
  },
  warning: {
    cardBg: 'rgba(224,160,48,0.08)',
    cardBorder: 'rgba(224,160,48,0.30)',
    badgeBg: 'rgba(224,160,48,0.18)',
    badgeColor: 'var(--warning)',
  },
  critical: {
    cardBg: 'rgba(224,82,82,0.08)',
    cardBorder: 'rgba(224,82,82,0.30)',
    badgeBg: 'rgba(224,82,82,0.18)',
    badgeColor: 'var(--danger)',
  },
}

export default function InsightCard({ insight }: InsightCardProps) {
  const s = severityStyles[insight.severity]

  return (
    <div
      className="rounded-lg p-4"
      style={{ background: s.cardBg, border: `1px solid ${s.cardBorder}` }}
    >
      <div className="flex items-start gap-3">
        <span
          className="rounded-full px-2 py-0.5 text-xs font-semibold capitalize shrink-0"
          style={{ background: s.badgeBg, color: s.badgeColor }}
        >
          {insight.severity}
        </span>
        <p className="text-sm" style={{ color: 'var(--ivory)' }}>
          {insight.message}
        </p>
      </div>
    </div>
  )
}
