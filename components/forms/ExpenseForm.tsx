'use client'

import { useState, useTransition, useEffect } from 'react'
import { z } from 'zod'
import { ExpenseSchema } from '@/lib/validation/schemas'
import { createExpense, updateExpense } from '@/app/actions/expenses'
import { useMonth } from '@/contexts/MonthContext'
import type { Category, Expense } from '@/lib/types'

type ExpenseFormData = z.infer<typeof ExpenseSchema>
type FieldErrors = Partial<Record<keyof ExpenseFormData, string[]>>

interface ExpenseFormProps {
  /** Pre-loaded categories; if omitted the form fetches them */
  categories?: Category[]
  /** Provide to switch form into edit mode */
  existing?: Expense
  onSuccess?: () => void
  onCancel?: () => void
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function ExpenseForm({ categories: propCategories, existing, onSuccess, onCancel }: ExpenseFormProps) {
  const { selectedMonth } = useMonth()
  const [isPending, startTransition] = useTransition()

  const [amount, setAmount] = useState(existing ? String(existing.amount) : '')
  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? '')
  const [date, setDate] = useState(existing?.date ?? today())
  const [note, setNote] = useState(existing?.note ?? '')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [rootError, setRootError] = useState<string | null>(null)

  const [categories, setCategories] = useState<Category[]>(propCategories ?? [])
  const [loadingCategories, setLoadingCategories] = useState(!propCategories)

  useEffect(() => {
    if (propCategories) return
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data: Category[]) => {
        setCategories(data)
        if (!categoryId && data.length > 0) setCategoryId(data[0].id)
      })
      .catch(() => {/* silently ignore */})
      .finally(() => setLoadingCategories(false))
  }, [propCategories, categoryId])

  function validate(): ExpenseFormData | null {
    const result = ExpenseSchema.safeParse({
      amount: parseFloat(amount),
      categoryId,
      date,
      note: note || undefined,
      monthYear: existing?.monthYear ?? selectedMonth,
    })
    if (!result.success) {
      setFieldErrors(result.error.flatten().fieldErrors as FieldErrors)
      return null
    }
    setFieldErrors({})
    return result.data
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data = validate()
    if (!data) return

    setRootError(null)

    startTransition(async () => {
      const result = existing
        ? await updateExpense(existing.id, data)
        : await createExpense(data)

      if (!result.success) {
        const { _root, ...rest } = result.errors as Record<string, string[]>
        setFieldErrors(rest as FieldErrors)
        if (_root) setRootError(_root[0])
        return
      }

      onSuccess?.()
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {rootError && (
        <p role="alert" className="text-sm text-red-600">{rootError}</p>
      )}

      <div>
        <label htmlFor="expense-amount" className="block text-sm font-medium text-gray-700">
          Amount
        </label>
        <input
          id="expense-amount"
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={isPending}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          aria-describedby={fieldErrors.amount ? 'expense-amount-error' : undefined}
        />
        {fieldErrors.amount && (
          <p id="expense-amount-error" role="alert" className="mt-1 text-xs text-red-600">
            {fieldErrors.amount[0]}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="expense-category" className="block text-sm font-medium text-gray-700">
          Category
        </label>
        {loadingCategories ? (
          <p className="mt-1 text-sm text-gray-500">Loading categories…</p>
        ) : (
          <select
            id="expense-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={isPending}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            aria-describedby={fieldErrors.categoryId ? 'expense-category-error' : undefined}
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({cat.type})
              </option>
            ))}
          </select>
        )}
        {fieldErrors.categoryId && (
          <p id="expense-category-error" role="alert" className="mt-1 text-xs text-red-600">
            {fieldErrors.categoryId[0]}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="expense-date" className="block text-sm font-medium text-gray-700">
          Date
        </label>
        <input
          id="expense-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          disabled={isPending}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          aria-describedby={fieldErrors.date ? 'expense-date-error' : undefined}
        />
        {fieldErrors.date && (
          <p id="expense-date-error" role="alert" className="mt-1 text-xs text-red-600">
            {fieldErrors.date[0]}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="expense-note" className="block text-sm font-medium text-gray-700">
          Note <span className="text-gray-400">(optional)</span>
        </label>
        <input
          id="expense-note"
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={isPending}
          maxLength={200}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          aria-describedby={fieldErrors.note ? 'expense-note-error' : undefined}
        />
        {fieldErrors.note && (
          <p id="expense-note-error" role="alert" className="mt-1 text-xs text-red-600">
            {fieldErrors.note[0]}
          </p>
        )}
      </div>

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isPending || loadingCategories}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? 'Saving…' : existing ? 'Update' : 'Add Expense'}
        </button>
      </div>
    </form>
  )
}
