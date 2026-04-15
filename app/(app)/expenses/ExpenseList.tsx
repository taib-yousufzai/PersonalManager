'use client'

import { useState, useTransition } from 'react'
import { deleteExpense } from '@/app/actions/expenses'
import { ExpenseForm } from '@/components/forms/ExpenseForm'
import CategoryBadge from '@/components/ui/CategoryBadge'
import type { Expense, Category } from '@/lib/types'

interface ExpenseListProps {
  expenses: Expense[]
  categories: Category[]
  monthYear: string
  nextPage: string | null
  currentCursor: string | undefined
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function ExpenseList({
  expenses,
  categories,
  monthYear,
  nextPage,
  currentCursor,
}: ExpenseListProps) {
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const categoryMap = new Map(categories.map((c) => [c.id, c]))

  function handleDeleteClick(id: string) {
    setConfirmDeleteId(id)
  }

  function handleDeleteConfirm() {
    if (!confirmDeleteId) return
    setDeletingId(confirmDeleteId)
    setConfirmDeleteId(null)
    startTransition(async () => {
      await deleteExpense(confirmDeleteId, monthYear)
      setDeletingId(null)
    })
  }

  function handleDeleteCancel() {
    setConfirmDeleteId(null)
  }

  if (editingExpense) {
    return (
      <div
        className="rounded-lg p-4"
        style={{
          background: 'var(--obsidian-3)',
          border: '1px solid var(--border-light)',
        }}
      >
        <h2
          className="text-xs font-semibold uppercase tracking-wide mb-4"
          style={{ color: 'var(--muted-light)' }}
        >
          Edit Expense
        </h2>
        <ExpenseForm
          categories={categories}
          existing={editingExpense}
          onSuccess={() => setEditingExpense(null)}
          onCancel={() => setEditingExpense(null)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Confirmation dialog */}
      {confirmDeleteId && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-delete-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}
        >
          <div
            className="w-full max-w-sm rounded-lg p-6"
            style={{
              background: 'var(--obsidian-3)',
              border: '1px solid var(--border-light)',
            }}
          >
            <h3
              id="confirm-delete-title"
              className="text-base font-semibold"
              style={{ color: 'var(--ivory)' }}
            >
              Delete expense?
            </h3>
            <p className="mt-2 text-sm" style={{ color: 'var(--muted-light)' }}>
              This action cannot be undone. The expense will be permanently removed.
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={handleDeleteCancel}
                className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  background: 'transparent',
                  color: 'var(--muted-light)',
                  border: '1px solid var(--border-light)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isPending}
                className="rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
                style={{ background: 'var(--danger)', color: 'var(--ivory)' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {expenses.length === 0 ? (
        <div
          className="rounded-lg p-8 text-center"
          style={{
            background: 'var(--obsidian-3)',
            border: '1px dashed var(--border-light)',
          }}
        >
          <p className="text-sm" style={{ color: 'var(--muted-light)' }}>
            No expenses recorded for this month.
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
            Use the form above to add your first expense.
          </p>
        </div>
      ) : (
        <ul
          className="rounded-lg overflow-hidden"
          style={{
            background: 'var(--obsidian-3)',
            border: '1px solid var(--border-light)',
          }}
        >
          {expenses.map((expense, idx) => {
            const category = categoryMap.get(expense.categoryId)
            const isDeleting = deletingId === expense.id
            return (
              <li
                key={expense.id}
                className={`flex items-start justify-between gap-4 px-4 py-3 transition-opacity ${
                  isDeleting ? 'opacity-40' : ''
                }`}
                style={
                  idx < expenses.length - 1
                    ? { borderBottom: '1px solid var(--border)' }
                    : undefined
                }
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {category ? (
                      <CategoryBadge name={category.name} type={category.type} />
                    ) : (
                      <span className="text-sm" style={{ color: 'var(--muted)' }}>
                        Unknown category
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs" style={{ color: 'var(--muted-light)' }}>
                    {formatDate(expense.date)}
                  </p>
                  {expense.note && (
                    <p className="mt-0.5 text-xs truncate" style={{ color: 'var(--muted)' }}>
                      {expense.note}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-semibold" style={{ color: 'var(--ivory)' }}>
                    {formatCurrency(expense.amount)}
                  </span>
                  <button
                    onClick={() => setEditingExpense(expense)}
                    disabled={isDeleting || isPending}
                    aria-label="Edit expense"
                    className="text-xs transition-colors disabled:opacity-40"
                    style={{ color: 'var(--gold)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold-light)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--gold)')}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(expense.id)}
                    disabled={isDeleting || isPending}
                    aria-label="Delete expense"
                    className="text-xs transition-colors disabled:opacity-40"
                    style={{ color: 'var(--danger)' }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {/* Pagination */}
      <div className="flex justify-end gap-2">
        {currentCursor && (
          <a
            href={`?monthYear=${monthYear}`}
            className="rounded-lg px-3 py-1.5 text-sm transition-colors"
            style={{
              color: 'var(--muted-light)',
              border: '1px solid var(--border-light)',
            }}
          >
            ← First page
          </a>
        )}
        {nextPage && (
          <a
            href={`?monthYear=${monthYear}&page=${nextPage}`}
            className="rounded-lg px-3 py-1.5 text-sm transition-colors"
            style={{
              color: 'var(--muted-light)',
              border: '1px solid var(--border-light)',
            }}
          >
            Next →
          </a>
        )}
      </div>
    </div>
  )
}
