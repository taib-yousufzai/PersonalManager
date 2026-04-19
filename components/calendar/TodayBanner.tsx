'use client'

import type { ScheduledPayment } from '@/lib/types'
import { formatINR } from '@/lib/currency'

interface Props {
  payments: ScheduledPayment[]
}

export default function TodayBanner({ payments }: Props) {
  const unpaid = payments.filter((p) => !p.isPaid)
  if (unpaid.length === 0) return null

  const total = unpaid.reduce((s, p) => s + p.amount, 0)

  return (
    <div
      role="alert"
      className="rounded-xl p-4"
      style={{
        background: 'rgba(201,168,76,0.08)',
        border: '1px solid rgba(201,168,76,0.35)',
      }}
    >
      {/* Icon + heading row */}
      <div className="flex items-center gap-2.5 mb-2">
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0"
          style={{ background: 'rgba(201,168,76,0.2)', color: 'var(--gold)' }}
          aria-hidden="true"
        >
          🔔
        </span>
        <p className="text-sm font-semibold" style={{ color: 'var(--gold-light)' }}>
          {unpaid.length === 1
            ? 'You have 1 payment due today'
            : `You have ${unpaid.length} payments due today`}
          {' '}— {formatINR(total)}
        </p>
      </div>

      {/* Payment list */}
      <ul className="space-y-1 pl-9">
        {unpaid.map((p) => (
          <li key={p.id} className="text-sm flex items-center justify-between">
            <span style={{ color: 'var(--ivory)' }}>{p.title}</span>
            <span className="font-medium ml-4 shrink-0" style={{ color: 'var(--gold)' }}>
              {formatINR(p.amount)}
            </span>
          </li>
        ))}
      </ul>

      <p className="text-xs mt-3 pl-9" style={{ color: 'var(--muted-light)' }}>
        Go to{' '}
        <a href="/calendar" className="underline" style={{ color: 'var(--gold-light)' }}>
          Calendar
        </a>{' '}
        to mark them as paid.
      </p>
    </div>
  )
}
