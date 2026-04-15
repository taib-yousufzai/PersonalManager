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
  /** The cursor used to reach this page; null/undefined means we're on page 1 */
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
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-medium text-gray-700 mb-4">Edit Expense</h2>
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <h3 id="confirm-delete-title" className="text-base font-semibold text-gray-900">
              Delete expense?
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              This action cannot be undone. The expense will be permanently removed.
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={handleDeleteCancel}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isPending}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {expenses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">No expenses recorded for this month.</p>
          <p className="mt-1 text-xs text-gray-400">Use the form above to add your first expense.</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white shadow-sm">
          {expenses.map((expense) => {
            const category = categoryMap.get(expense.categoryId)
            const isDeleting = deletingId === expense.id
            return (
              <li
                key={expense.id}
                className={`flex items-start justify-between gap-4 px-4 py-3 transition-opacity ${
                  isDeleting ? 'opacity-40' : ''
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {category ? (
                      <CategoryBadge name={category.name} type={category.type} />
                    ) : (
                      <span className="text-sm text-gray-400">Unknown category</span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{formatDate(expense.date)}</p>
                  {expense.note && (
                    <p className="mt-0.5 text-xs text-gray-400 truncate">{expense.note}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(expense.amount)}
                  </span>
                  <button
                    onClick={() => setEditingExpense(expense)}
                    disabled={isDeleting || isPending}
                    aria-label="Edit expense"
                    className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-40"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(expense.id)}
                    disabled={isDeleting || isPending}
                    aria-label="Delete expense"
                    className="text-xs text-red-600 hover:text-red-800 disabled:opacity-40"
                  >
                    Delete
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {/* Pagination — cursor-based: nextPage is the last doc ID cursor */}
      <div className="flex justify-end gap-2">
        {currentCursor && (
          <a
            href={`?monthYear=${monthYear}`}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            ← First page
          </a>
        )}
        {nextPage && (
          <a
            href={`?monthYear=${monthYear}&page=${nextPage}`}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            Next →
          </a>
        )}
      </div>
    </div>
  )
}
