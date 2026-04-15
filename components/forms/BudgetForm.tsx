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
  /** Provide to pre-fill an existing budget */
  existing?: Budget
  onSuccess?: () => void
  onCancel?: () => void
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
        <p role="alert" className="text-sm text-red-600">{rootError}</p>
      )}

      <div>
        <label htmlFor="budget-category" className="block text-sm font-medium text-gray-700">
          Category
        </label>
        {loadingCategories ? (
          <p className="mt-1 text-sm text-gray-500">Loading categories…</p>
        ) : (
          <select
            id="budget-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={isPending || !!existing}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
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
          <p id="budget-category-error" role="alert" className="mt-1 text-xs text-red-600">
            {fieldErrors.categoryId[0]}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="budget-limit" className="block text-sm font-medium text-gray-700">
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
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          aria-describedby={fieldErrors.limit ? 'budget-limit-error' : undefined}
        />
        {fieldErrors.limit && (
          <p id="budget-limit-error" role="alert" className="mt-1 text-xs text-red-600">
            {fieldErrors.limit[0]}
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
          {isPending ? 'Saving…' : existing ? 'Update Budget' : 'Set Budget'}
        </button>
      </div>
    </form>
  )
}
