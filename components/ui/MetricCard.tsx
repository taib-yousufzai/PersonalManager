import CurrencyDisplay from './CurrencyDisplay'
import Link from 'next/link'

interface MetricCardProps {
  label: string
  value: number
  rate?: number
  variant?: 'default' | 'gold' | 'success' | 'danger'
  href?: string
}

export default function MetricCard({ label, value, rate, variant = 'default', href }: MetricCardProps) {
  const getStyles = () => {
    switch (variant) {
      case 'gold':
        return { 
          bg: 'rgba(201,168,76,0.1)', 
          border: 'rgba(201,168,76,0.3)', 
          text: 'var(--gold-light)' 
        }
      case 'success':
        return { 
          bg: 'rgba(76,175,130,0.1)', 
          border: 'rgba(76,175,130,0.3)', 
          text: 'var(--success)' 
        }
      case 'danger':
        return { 
          bg: 'rgba(224,82,82,0.1)', 
          border: 'rgba(224,82,82,0.3)', 
          text: 'var(--danger)' 
        }
      default:
        return { 
          bg: 'var(--obsidian-3)', 
          border: 'var(--border-light)', 
          text: 'var(--ivory)' 
        }
    }
  }

  const { bg, border, text } = getStyles()

  const CardContent = (
    <div
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: '0.5rem',
        padding: '1rem',
        cursor: href ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
      }}
      className={href ? 'hover:brightness-125 hover:-translate-y-0.5 active:scale-95' : ''}
    >
      <div className="flex justify-between items-start">
        <p
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: 'var(--muted-light)' }}
        >
          {label}
        </p>
        {href && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--muted)' }}>
            <path d="M7 17l10-10M7 7h10v10"/>
          </svg>
        )}
      </div>
      <div
        className="mt-1 text-2xl font-semibold"
        style={{ color: text }}
      >
        <CurrencyDisplay amount={value} rate={rate} />
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: 'none' }}>
        {CardContent}
      </Link>
    )
  }

  return CardContent
}
