'use client'

import { useState, useTransition } from 'react'
import { z } from 'zod'
import { CategorySchema } from '@/lib/validation/schemas'
import { createCategory, renameCategory } from '@/app/actions/categories'
import type { Category } from '@/lib/types'

type CategoryFormData = z.infer<typeof CategorySchema>
type FieldErrors = Partial<Record<keyof CategoryFormData, string[]>>

interface CategoryFormProps {
  /** Provide to switch form into rename mode */
  existing?: Category
  onSuccess?: () => void
  onCancel?: () => void
}

export function CategoryForm({ existing, onSuccess, onCancel }: CategoryFormProps) {
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState(existing?.name ?? '')
  const [type, setType] = useState<'essential' | 'discretionary'>(existing?.type ?? 'essential')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [rootError, setRootError] = useState<string | null>(null)

  const isRename = !!existing

  function validate(): CategoryFormData | null {
    const result = CategorySchema.safeParse({ name, type })
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
      const result = isRename
        ? await renameCategory(existing.id, data.name)
        : await createCategory(data)

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
        <label htmlFor="category-name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          id="category-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isPending}
          maxLength={50}
          placeholder="e.g. Groceries"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          aria-describedby={fieldErrors.name ? 'category-name-error' : undefined}
        />
        {fieldErrors.name && (
          <p id="category-name-error" role="alert" className="mt-1 text-xs text-red-600">
            {fieldErrors.name[0]}
          </p>
        )}
      </div>

      {/* Type selector — hidden in rename mode since type can't change */}
      {!isRename && (
        <div>
          <span className="block text-sm font-medium text-gray-700 mb-1">Type</span>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="category-type"
                value="essential"
                checked={type === 'essential'}
                onChange={() => setType('essential')}
                disabled={isPending}
                className="accent-blue-600"
              />
              <span className="text-sm text-gray-700">Essential</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="category-type"
                value="discretionary"
                checked={type === 'discretionary'}
                onChange={() => setType('discretionary')}
                disabled={isPending}
                className="accent-blue-600"
              />
              <span className="text-sm text-gray-700">Discretionary</span>
            </label>
          </div>
          {fieldErrors.type && (
            <p role="alert" className="mt-1 text-xs text-red-600">
              {fieldErrors.type[0]}
            </p>
          )}
        </div>
      )}

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
          disabled={isPending}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? 'Saving…' : isRename ? 'Rename' : 'Create Category'}
        </button>
      </div>
    </form>
  )
}
