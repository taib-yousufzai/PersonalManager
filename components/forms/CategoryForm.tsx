'use client'

import { useState, useTransition } from 'react'
import { z } from 'zod'
import { CategorySchema } from '@/lib/validation/schemas'
import { createCategory, renameCategory } from '@/app/actions/categories'
import type { Category } from '@/lib/types'

type CategoryFormData = z.infer<typeof CategorySchema>
type FieldErrors = Partial<Record<keyof CategoryFormData, string[]>>

interface CategoryFormProps {
  existing?: Category
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
        <p role="alert" className="text-sm" style={{ color: 'var(--danger)' }}>
          {rootError}
        </p>
      )}

      <div>
        <label htmlFor="category-name" className="block mb-1" style={labelStyle}>
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
          className="block w-full rounded-lg px-3 py-2.5 text-sm transition-colors disabled:opacity-50"
          style={inputStyle}
          onFocus={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-light)')}
          aria-describedby={fieldErrors.name ? 'category-name-error' : undefined}
        />
        {fieldErrors.name && (
          <p id="category-name-error" role="alert" className="mt-1 text-xs" style={{ color: 'var(--danger)' }}>
            {fieldErrors.name[0]}
          </p>
        )}
      </div>

      {/* Type selector — hidden in rename mode */}
      {!isRename && (
        <div>
          <span className="block mb-2" style={labelStyle}>Type</span>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="category-type"
                value="essential"
                checked={type === 'essential'}
                onChange={() => setType('essential')}
                disabled={isPending}
                style={{ accentColor: 'var(--gold)' }}
              />
              <span className="text-sm" style={{ color: 'var(--ivory)' }}>Essential</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="category-type"
                value="discretionary"
                checked={type === 'discretionary'}
                onChange={() => setType('discretionary')}
                disabled={isPending}
                style={{ accentColor: 'var(--gold)' }}
              />
              <span className="text-sm" style={{ color: 'var(--ivory)' }}>Discretionary</span>
            </label>
          </div>
          {fieldErrors.type && (
            <p role="alert" className="mt-1 text-xs" style={{ color: 'var(--danger)' }}>
              {fieldErrors.type[0]}
            </p>
          )}
        </div>
      )}

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
          disabled={isPending}
          className="rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
          style={{ background: 'var(--gold)', color: 'var(--obsidian)' }}
        >
          {isPending ? 'Saving…' : isRename ? 'Rename' : 'Create Category'}
        </button>
      </div>
    </form>
  )
}
