'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { Expense, ScheduledPayment, Category } from '@/lib/types'
import { formatINR } from '@/lib/currency'
import AddPaymentModal from './AddPaymentModal'
import AddExpenseModal from './AddExpenseModal'

interface Props {
  date: string
  expenses: Expense[]
  payments: ScheduledPayment[]
  categories: Category[]
  rate: number
  onClose: () => void
  onPaymentUpdate: (p: ScheduledPayment) => void
  onPaymentDelete: (id: string) => void
  onPaymentAdd: (p: ScheduledPayment) => void
  onExpenseAdd: () => void
}

function friendlyDate(iso: string) {
  try {
    const [y, m, d] = iso.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

export default function DayDrawer({
  date,
  expenses = [],
  payments = [],
  categories = [],
  rate,
  onClose,
  onPaymentUpdate,
  onPaymentDelete,
  onPaymentAdd,
  onExpenseAdd,
}: Props) {
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [editPayment, setEditPayment] = useState<ScheduledPayment | null>(null)
  const [editExpense, setEditExpense] = useState<Expense | null>(null)
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null)
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = 'auto' }
  }, [])

  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? 'Uncategorised'
  const totalSpent = expenses.reduce((s, e) => s + (e?.amount || 0), 0)

  const handleDeleteExpense = async (id: string) => {
    if (deletingExpenseId) return
    setDeletingExpenseId(id)
    try {
      await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
      onExpenseAdd() // triggers a reload
    } catch {
      // silent — UI stays consistent on reload
    } finally {
      setDeletingExpenseId(null)
    }
  }

  const handleDeletePayment = async (id: string) => {
    if (deletingPaymentId) return
    setDeletingPaymentId(id)
    try {
      const res = await fetch(`/api/scheduled-payments/${id}`, { method: 'DELETE' })
      if (res.ok) onPaymentDelete(id)
    } catch {
      // silent
    } finally {
      setDeletingPaymentId(null)
    }
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[40] bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <aside
        className="fixed top-0 bottom-0 right-0 z-[50] flex flex-col w-full sm:w-[400px] shadow-2xl transition-transform"
        style={{ background: 'var(--obsidian-2)', borderLeft: '1px solid var(--border-light)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-light)]">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gold)] mb-1">
              {friendlyDate(date)}
            </p>
            <h2 className="text-sm font-semibold text-[var(--ivory)]">Daily Overview</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--obsidian-3)] text-[var(--muted-light)] hover:bg-[var(--obsidian-4)]"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-10">
          {/* Expenses */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Expenses</h3>
              <button
                onClick={() => { setEditExpense(null); setShowExpenseModal(true) }}
                className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-[var(--obsidian-4)] text-[var(--ivory)] border border-[var(--border-light)]"
              >
                + Add Expense
              </button>
            </div>

            {totalSpent > 0 && (
              <div className="mb-4 p-4 rounded-xl bg-danger/5 border border-danger/10">
                <p className="text-[10px] text-[var(--muted-light)] uppercase font-bold">Total Spent</p>
                <p className="text-xl font-bold text-[var(--danger)]">{formatINR(totalSpent)}</p>
              </div>
            )}

            {expenses.length === 0 ? (
              <div className="py-10 text-center border-2 border-dashed border-[var(--border-light)] rounded-2xl">
                <p className="text-xs text-[var(--muted)]">No expenses recorded</p>
              </div>
            ) : (
              <div className="space-y-3">
                {expenses.map((e) => (
                  <div key={e.id} className="flex items-center justify-between p-4 rounded-xl bg-[var(--obsidian-3)] border border-white/5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[var(--ivory)] truncate">{catName(e.categoryId)}</p>
                      {e.note && <p className="text-xs text-[var(--muted)] mt-0.5 truncate">{e.note}</p>}
                    </div>
                    <div className="flex items-center gap-2 ml-2 shrink-0">
                      <p className="text-sm font-bold text-[var(--danger)]">{formatINR(e.amount)}</p>
                      <button
                        onClick={() => { setEditExpense(e); setShowExpenseModal(true) }}
                        className="text-[var(--muted-light)] hover:text-[var(--ivory)] transition-colors"
                        aria-label="Edit expense"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button
                        onClick={() => handleDeleteExpense(e.id)}
                        disabled={deletingExpenseId === e.id}
                        className="text-[var(--muted-light)] hover:text-[var(--danger)] transition-colors disabled:opacity-40"
                        aria-label="Delete expense"
                      >
                        {deletingExpenseId === e.id
                          ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                          : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        }
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Payments */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Scheduled</h3>
              <button
                onClick={() => { setEditPayment(null); setShowPaymentModal(true) }}
                className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-[var(--gold-dim)] text-[var(--gold-light)] border border-gold/10"
              >
                + Add Payment
              </button>
            </div>

            {payments.length === 0 ? (
              <div className="py-10 text-center border-2 border-dashed border-[var(--border-light)] rounded-2xl">
                <p className="text-xs text-[var(--muted)]">No payments scheduled</p>
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map((p) => (
                  <div key={p.id} className="p-4 rounded-xl bg-[var(--obsidian-3)] border border-gold/5 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${p.isPaid ? 'text-[var(--success)] line-through' : 'text-[var(--ivory)]'}`}>
                        {p.title}
                      </p>
                      <p className={`text-xs font-bold mt-1 ${p.isPaid ? 'text-[var(--success)]' : 'text-[var(--gold)]'}`}>
                        {formatINR(p.amount)}
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={() => { setEditPayment(p); setShowPaymentModal(true) }}
                        className="text-[var(--muted-light)] hover:text-[var(--ivory)] transition-colors"
                        aria-label="Edit payment"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button
                        onClick={() => handleDeletePayment(p.id)}
                        disabled={deletingPaymentId === p.id}
                        className="text-[var(--muted-light)] hover:text-[var(--danger)] transition-colors disabled:opacity-40"
                        aria-label="Delete payment"
                      >
                        {deletingPaymentId === p.id
                          ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                          : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        }
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </aside>

      {showPaymentModal && (
        <AddPaymentModal
          defaultDate={date}
          editPayment={editPayment}
          rate={rate}
          onClose={() => setShowPaymentModal(false)}
          onSave={(saved) => {
            if (editPayment) onPaymentUpdate(saved)
            else onPaymentAdd(saved)
            setShowPaymentModal(false)
          }}
        />
      )}

      {showExpenseModal && (
        <AddExpenseModal
          date={date}
          categories={categories}
          editExpense={editExpense}
          onClose={() => { setShowExpenseModal(false); setEditExpense(null) }}
          onSuccess={() => {
            onExpenseAdd()
            setShowExpenseModal(false)
            setEditExpense(null)
          }}
        />
      )}
    </>,
    document.body
  )
}
