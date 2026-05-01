'use client'

import { createPortal } from 'react-dom'
import { ExpenseForm } from '@/components/forms/ExpenseForm'
import type { Category, Expense } from '@/lib/types'

interface Props {
  date: string
  categories: Category[]
  editExpense?: Expense | null
  onClose: () => void
  onSuccess: () => void
}

export default function AddExpenseModal({ date, categories, editExpense, onClose, onSuccess }: Props) {
  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl p-6 space-y-5 animate-in zoom-in-95 duration-200"
        style={{ background: 'var(--obsidian-2)', border: '1px solid var(--border-light)' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-semibold" style={{ color: 'var(--ivory)' }}>
            {editExpense ? 'Edit Expense' : `Add Expense for ${date}`}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-lg leading-none transition-colors hover:bg-[var(--obsidian-3)]"
            style={{ color: 'var(--muted)', background: 'var(--obsidian-3)' }}
          >
            ×
          </button>
        </div>

        <ExpenseForm
          categories={categories}
          existing={editExpense ?? undefined}
          initialDate={editExpense?.date || date}
          onSuccess={() => {
            onSuccess()
            onClose()
          }}
          onCancel={onClose}
        />
      </div>
    </div>,
    document.body
  )
}
