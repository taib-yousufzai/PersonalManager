'use client'

import { useState } from 'react'
import type { ScheduledPayment } from '@/lib/types'

interface Props {
  defaultDate: string
  editPayment: ScheduledPayment | null
  rate: number
  onClose: () => void
  onSave: (payment: ScheduledPayment) => void
}

export default function AddPaymentModal({ defaultDate, editPayment, onClose, onSave }: Props) {
  const [title, setTitle] = useState(editPayment?.title ?? '')
  const [amount, setAmount] = useState(editPayment?.amount?.toString() ?? '')
  const [date, setDate] = useState(editPayment?.date ?? defaultDate)
  const [note, setNote] = useState(editPayment?.note ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isEdit = editPayment !== null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const amt = parseFloat(amount)
    if (!title.trim()) { setError('Title is required.'); return }
    if (isNaN(amt) || amt <= 0) { setError('Amount must be a positive number.'); return }
    if (!date) { setError('Date is required.'); return }

    setSaving(true)
    try {
      if (isEdit) {
        // Update existing
        const res = await fetch(`/api/scheduled-payments/${editPayment.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: title.trim(), amount: amt, date, note: note.trim() }),
        })
        if (!res.ok) {
          const d = await res.json()
          throw new Error(d.error ?? 'Failed to update')
        }
        onSave({ ...editPayment, title: title.trim(), amount: amt, date, note: note.trim() || undefined })
      } else {
        // Create new
        const res = await fetch('/api/scheduled-payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: title.trim(), amount: amt, date, note: note.trim() }),
        })
        if (!res.ok) {
          const d = await res.json()
          throw new Error(d.error ?? 'Failed to create')
        }
        const { payment } = await res.json()
        onSave(payment)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Modal backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.6)' }}
        onClick={onClose}
      >
        {/* Modal panel */}
        <div
          className="w-full max-w-sm rounded-xl p-6 space-y-5 animate-in zoom-in-95 duration-200"
          style={{ background: 'var(--obsidian-2)', border: '1px solid var(--border-light)' }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={isEdit ? 'Edit payment' : 'Add scheduled payment'}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold" style={{ color: 'var(--ivory)' }}>
              {isEdit ? 'Edit Payment' : 'Schedule a Payment'}
            </h2>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-lg leading-none"
              style={{ color: 'var(--muted)', background: 'var(--obsidian-3)' }}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" id="add-payment-form">
            {/* Title */}
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--muted-light)' }}>
                What to pay *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Electricity bill"
                maxLength={80}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
                style={{
                  background: 'var(--obsidian-3)',
                  border: '1px solid var(--border-light)',
                  color: 'var(--ivory)',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--gold)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-light)')}
                required
                id="payment-title"
              />
            </div>

            {/* Amount */}
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--muted-light)' }}>
                Amount (₹) *
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="10000"
                min="1"
                step="any"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
                style={{
                  background: 'var(--obsidian-3)',
                  border: '1px solid var(--border-light)',
                  color: 'var(--ivory)',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--gold)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-light)')}
                required
                id="payment-amount"
              />
            </div>

            {/* Date */}
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--muted-light)' }}>
                Due Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
                style={{
                  background: 'var(--obsidian-3)',
                  border: '1px solid var(--border-light)',
                  color: 'var(--ivory)',
                  colorScheme: 'dark',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--gold)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-light)')}
                required
                id="payment-date"
              />
            </div>

            {/* Note */}
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--muted-light)' }}>
                Note (optional)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Pay to Vijay, a/c 1234…"
                maxLength={160}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
                style={{
                  background: 'var(--obsidian-3)',
                  border: '1px solid var(--border-light)',
                  color: 'var(--ivory)',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--gold)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-light)')}
                id="payment-note"
              />
            </div>

            {error && (
              <p className="text-xs" style={{ color: 'var(--danger)' }}>
                {error}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors"
                style={{ background: 'var(--obsidian-3)', color: 'var(--muted-light)' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors"
                style={{
                  background: saving ? 'var(--gold-dim)' : 'var(--gold)',
                  color: saving ? 'var(--gold-light)' : 'var(--obsidian)',
                }}
                form="add-payment-form"
              >
                {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Schedule'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
