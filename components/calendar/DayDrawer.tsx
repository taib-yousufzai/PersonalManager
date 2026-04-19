'use client'

import { useState } from 'react'
import type { Expense, ScheduledPayment, Category } from '@/lib/types'
import { formatINR } from '@/lib/currency'
import AddPaymentModal from './AddPaymentModal'

interface Props {
  date: string // YYYY-MM-DD
  expenses: Expense[]
  payments: ScheduledPayment[]
  categories: Category[]
  rate: number
  onClose: () => void
  onPaymentUpdate: (p: ScheduledPayment) => void
  onPaymentDelete: (id: string) => void
  onPaymentAdd: (p: ScheduledPayment) => void
}

function friendlyDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function DayDrawer({
  date,
  expenses,
  payments,
  categories,
  rate,
  onClose,
  onPaymentUpdate,
  onPaymentDelete,
  onPaymentAdd,
}: Props) {
  const [showModal, setShowModal] = useState(false)
  const [editPayment, setEditPayment] = useState<ScheduledPayment | null>(null)
  const [markingId, setMarkingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? 'Uncategorised'
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0)

  const togglePaid = async (p: ScheduledPayment) => {
    setMarkingId(p.id)
    try {
      const res = await fetch(`/api/scheduled-payments/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPaid: !p.isPaid }),
      })
      if (res.ok) onPaymentUpdate({ ...p, isPaid: !p.isPaid })
    } finally {
      setMarkingId(null)
    }
  }

  const deletePayment = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/scheduled-payments/${id}`, { method: 'DELETE' })
      if (res.ok) onPaymentDelete(id)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className="fixed right-0 top-0 bottom-0 z-50 flex flex-col overflow-y-auto"
        style={{
          width: 'min(380px, 100vw)',
          background: 'var(--obsidian-2)',
          borderLeft: '1px solid var(--border-light)',
        }}
        role="dialog"
        aria-label={`Details for ${date}`}
      >
        {/* Drawer header */}
        <div
          className="flex items-start justify-between p-5 sticky top-0"
          style={{ background: 'var(--obsidian-2)', borderBottom: '1px solid var(--border-light)' }}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
              {friendlyDate(date)}
            </p>
            {totalSpent > 0 && (
              <p className="text-sm mt-0.5 font-medium" style={{ color: 'var(--danger)' }}>
                Total spent: {formatINR(totalSpent)}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-lg leading-none"
            style={{ color: 'var(--muted)', background: 'var(--obsidian-3)' }}
            aria-label="Close panel"
          >
            ×
          </button>
        </div>

        <div className="flex-1 p-5 space-y-6">
          {/* Expenses section */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>
              Expenses ({expenses.length})
            </h2>
            {expenses.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                No expenses recorded.
              </p>
            ) : (
              <ul className="space-y-2">
                {expenses.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5"
                    style={{ background: 'var(--obsidian-3)' }}
                  >
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--ivory)' }}>
                        {catName(e.categoryId)}
                      </p>
                      {e.note && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--muted-light)' }}>
                          {e.note}
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-semibold" style={{ color: 'var(--danger)' }}>
                      {formatINR(e.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Scheduled payments section */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                Scheduled Payments ({payments.length})
              </h2>
              <button
                onClick={() => { setEditPayment(null); setShowModal(true) }}
                className="text-xs font-medium px-2.5 py-1 rounded-lg transition-colors"
                style={{ background: 'var(--gold-dim)', color: 'var(--gold-light)' }}
              >
                + Add
              </button>
            </div>

            {payments.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                No payments scheduled.
              </p>
            ) : (
              <ul className="space-y-2">
                {payments.map((p) => (
                  <li
                    key={p.id}
                    className="rounded-lg px-3 py-2.5"
                    style={{
                      background: 'var(--obsidian-3)',
                      border: p.isPaid ? '1px solid rgba(76,175,130,0.2)' : '1px solid rgba(201,168,76,0.15)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium"
                          style={{
                            color: p.isPaid ? 'var(--success)' : 'var(--ivory)',
                            textDecoration: p.isPaid ? 'line-through' : 'none',
                          }}
                        >
                          {p.title}
                        </p>
                        {p.note && (
                          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted-light)' }}>
                            {p.note}
                          </p>
                        )}
                        <p className="text-xs mt-1 font-semibold" style={{ color: p.isPaid ? 'var(--success)' : 'var(--gold)' }}>
                          {formatINR(p.amount)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => togglePaid(p)}
                          disabled={markingId === p.id}
                          className="text-[10px] font-medium px-2 py-1 rounded transition-colors"
                          style={{
                            background: p.isPaid ? 'rgba(76,175,130,0.15)' : 'rgba(76,175,130,0.1)',
                            color: 'var(--success)',
                          }}
                          aria-label={p.isPaid ? 'Mark unpaid' : 'Mark paid'}
                        >
                          {markingId === p.id ? '…' : p.isPaid ? 'Undo' : '✓ Paid'}
                        </button>
                        <button
                          onClick={() => { setEditPayment(p); setShowModal(true) }}
                          className="text-[10px] font-medium px-2 py-1 rounded transition-colors"
                          style={{ background: 'var(--obsidian-4)', color: 'var(--muted-light)' }}
                          aria-label="Edit payment"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deletePayment(p.id)}
                          disabled={deletingId === p.id}
                          className="text-[10px] font-medium px-2 py-1 rounded transition-colors"
                          style={{ background: 'rgba(224,82,82,0.1)', color: 'var(--danger)' }}
                          aria-label="Delete payment"
                        >
                          {deletingId === p.id ? '…' : '✕'}
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </aside>

      {/* Add / Edit modal */}
      {showModal && (
        <AddPaymentModal
          defaultDate={date}
          editPayment={editPayment}
          rate={rate}
          onClose={() => setShowModal(false)}
          onSave={(saved) => {
            if (editPayment) {
              onPaymentUpdate(saved)
            } else {
              onPaymentAdd(saved)
            }
            setShowModal(false)
          }}
        />
      )}
    </>
  )
}
