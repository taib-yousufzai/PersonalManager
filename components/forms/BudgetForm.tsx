'use client'

import { useState, useTransition, useEffect } from 'react'
import { z } from 'zod'
import { BudgetSchema } from '@/lib/validation/schemas'
import { upsertBudget } from '@/app/actions/budgets'
import { useMonth } from '@/contexts/MonthContext'
import type { Budget, Category } from '@/lib/types'

type BudgetFormData = z.infer<typeof BudgetSchema>
type FieldErrors = Partial<Record<keyof BudgetFormData, string[]>>

interface BudgetFormProps {
  categories?: Category[]
  existing?: Budget
  onSuccess?: () => void
  onCancel?: () => void
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

export function BudgetForm({ categories: propCategories, existing, onSuccess, onCancel }: BudgetFormProps) {
  const { selectedMonth } = useMonth()
  const [isPending, startTransition] = useTransition()

  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? '')
  const [limit, setLimit] = useState(existing ? String(existing.limit) : '')
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

  function validate(): BudgetFormData | null {
    const result = BudgetSchema.safeParse({
      categoryId,
      monthYear: existing?.monthYear ?? selectedMonth,
      limit: parseFloat(limit),
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
      const result = await upsertBudget(data)

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
        <label htmlFor="budget-category" className="block mb-1" style={labelStyle}>
          Category
        </label>
        {loadingCategories ? (
          <p className="mt-1 text-sm" style={{ color: 'var(--muted-light)' }}>Loading categories…</p>
        ) : (
          <select
            id="budget-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={isPending || !!existing}
            className="block w-full rounded-lg px-3 py-2.5 text-sm transition-colors disabled:opacity-50"
            style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-light)')}
            aria-describedby={fieldErrors.categoryId ? 'budget-category-error' : undefined}
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        )}
        {fieldErrors.categoryId && (
          <p id="budget-category-error" role="alert" className="mt-1 text-xs" style={{ color: 'var(--danger)' }}>
            {fieldErrors.categoryId[0]}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="budget-limit" className="block mb-1" style={labelStyle}>
          Monthly limit
        </label>
        <input
          id="budget-limit"
          type="number"
          min="0.01"
          step="0.01"
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
          disabled={isPending}
          className="block w-full rounded-lg px-3 py-2.5 text-sm transition-colors disabled:opacity-50"
          style={inputStyle}
          onFocus={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-light)')}
          aria-describedby={fieldErrors.limit ? 'budget-limit-error' : undefined}
        />
        {fieldErrors.limit && (
          <p id="budget-limit-error" role="alert" className="mt-1 text-xs" style={{ color: 'var(--danger)' }}>
            {fieldErrors.limit[0]}
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
          {isPending ? 'Saving…' : existing ? 'Update Budget' : 'Set Budget'}
        </button>
      </div>
    </form>
  )
}
