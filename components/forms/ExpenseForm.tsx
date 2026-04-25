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
  categories?: Category[]
  existing?: Expense
  initialDate?: string
  onSuccess?: () => void
  onCancel?: () => void
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

const inputStyle: React.CSSProperties = {
  background: 'var(--obsidian-4)',
  color: 'var(--ivory)',
  border: '1px solid var(--border-light)',
  outline: 'none',
  colorScheme: 'dark',
}

const labelStyle: React.CSSProperties = {
  color: 'var(--muted-light)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  fontSize: '0.75rem',
  fontWeight: 600,
}

export function ExpenseForm({ categories: propCategories, existing, initialDate, onSuccess, onCancel }: ExpenseFormProps) {
  const { selectedMonth } = useMonth()
  const [isPending, startTransition] = useTransition()

  const [amount, setAmount] = useState(existing ? String(existing.amount) : '')
  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? '')
  const [date, setDate] = useState(existing?.date ?? initialDate ?? today())
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
    // Derive monthYear from date: YYYY-MM-DD -> YYYY-MM
    const derivedMonthYear = date.slice(0, 7)

    const result = ExpenseSchema.safeParse({
      amount: parseFloat(amount),
      categoryId,
      date,
      note: note || undefined,
      monthYear: derivedMonthYear,
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
        <p role="alert" className="text-sm" style={{ color: 'var(--danger)' }}>
          {rootError}
        </p>
      )}

      <div>
        <label htmlFor="expense-amount" className="block mb-1" style={labelStyle}>
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
          className="block w-full rounded-lg px-3 py-2.5 text-sm transition-colors disabled:opacity-50"
          style={inputStyle}
          onFocus={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-light)')}
          aria-describedby={fieldErrors.amount ? 'expense-amount-error' : undefined}
        />
        {fieldErrors.amount && (
          <p id="expense-amount-error" role="alert" className="mt-1 text-xs" style={{ color: 'var(--danger)' }}>
            {fieldErrors.amount[0]}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="expense-category" className="block mb-1" style={labelStyle}>
          Category
        </label>
        {loadingCategories ? (
          <p className="mt-1 text-sm" style={{ color: 'var(--muted-light)' }}>Loading categories…</p>
        ) : (
          <select
            id="expense-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={isPending}
            className="block w-full rounded-lg px-3 py-2.5 text-sm transition-colors disabled:opacity-50"
            style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-light)')}
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
          <p id="expense-category-error" role="alert" className="mt-1 text-xs" style={{ color: 'var(--danger)' }}>
            {fieldErrors.categoryId[0]}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="expense-date" className="block mb-1" style={labelStyle}>
          Date
        </label>
        <input
          id="expense-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          disabled={isPending}
          className="block w-full rounded-lg px-3 py-2.5 text-sm transition-colors disabled:opacity-50"
          style={inputStyle}
          onFocus={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-light)')}
          aria-describedby={fieldErrors.date ? 'expense-date-error' : undefined}
        />
        {fieldErrors.date && (
          <p id="expense-date-error" role="alert" className="mt-1 text-xs" style={{ color: 'var(--danger)' }}>
            {fieldErrors.date[0]}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="expense-note" className="block mb-1" style={labelStyle}>
          Note{' '}
          <span style={{ color: 'var(--muted)', textTransform: 'none', letterSpacing: 'normal' }}>
            (optional)
          </span>
        </label>
        <input
          id="expense-note"
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={isPending}
          maxLength={200}
          className="block w-full rounded-lg px-3 py-2.5 text-sm transition-colors disabled:opacity-50"
          style={inputStyle}
          onFocus={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-light)')}
          aria-describedby={fieldErrors.note ? 'expense-note-error' : undefined}
        />
        {fieldErrors.note && (
          <p id="expense-note-error" role="alert" className="mt-1 text-xs" style={{ color: 'var(--danger)' }}>
            {fieldErrors.note[0]}
          </p>
        )}
      </div>

      <div className="flex gap-2 justify-end pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
            style={{
              background: 'transparent',
              color: 'var(--muted-light)',
              border: '1px solid var(--border-light)',
            }}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isPending || loadingCategories}
          className="rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
          style={{ background: 'var(--gold)', color: 'var(--obsidian)' }}
        >
          {isPending ? 'Saving…' : existing ? 'Update' : 'Add Expense'}
        </button>
      </div>
    </form>
  )
}
