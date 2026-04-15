'use client'

import { useState, useTransition } from 'react'
import { z } from 'zod'
import { SavingsGoalSchema } from '@/lib/validation/schemas'
import { upsertSavingsGoal } from '@/app/actions/savingsGoals'
import { useMonth } from '@/contexts/MonthContext'
import type { SavingsGoal } from '@/lib/types'

type SavingsGoalFormData = z.infer<typeof SavingsGoalSchema>
type FieldErrors = Partial<Record<keyof SavingsGoalFormData | '_root', string[]>>

interface SavingsGoalFormProps {
  existing?: SavingsGoal
  onSuccess?: () => void
  onCancel?: () => void
}

export function SavingsGoalForm({ existing, onSuccess, onCancel }: SavingsGoalFormProps) {
  const { selectedMonth } = useMonth()
  const [isPending, startTransition] = useTransition()

  const [type, setType] = useState<'fixed' | 'percentage'>(existing?.type ?? 'fixed')
  const [value, setValue] = useState(existing ? String(existing.value) : '')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [rootError, setRootError] = useState<string | null>(null)

  function validate(): SavingsGoalFormData | null {
    const result = SavingsGoalSchema.safeParse({
      type,
      value: parseFloat(value),
      monthYear: existing?.monthYear ?? selectedMonth,
    })
    if (!result.success) {
      const flat = result.error.flatten()
      setFieldErrors({
        ...(flat.fieldErrors as FieldErrors),
        // surface refine errors (attached to 'value' path by schema)
      })
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
      const result = await upsertSavingsGoal(data)

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

      {/* Goal type toggle */}
      <div>
        <span className="block text-sm font-medium text-gray-700 mb-1">Goal type</span>
        <div className="flex rounded-md border border-gray-300 overflow-hidden w-fit">
          <button
            type="button"
            onClick={() => { setType('fixed'); setValue('') }}
            disabled={isPending}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              type === 'fixed'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } disabled:opacity-50`}
          >
            Fixed amount
          </button>
          <button
            type="button"
            onClick={() => { setType('percentage'); setValue('') }}
            disabled={isPending}
            className={`px-4 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${
              type === 'percentage'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } disabled:opacity-50`}
          >
            % of income
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="savings-value" className="block text-sm font-medium text-gray-700">
          {type === 'fixed' ? 'Amount' : 'Percentage (1–100)'}
        </label>
        <div className="relative mt-1">
          {type === 'fixed' && (
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-500 text-sm">
              $
            </span>
          )}
          <input
            id="savings-value"
            type="number"
            min={type === 'fixed' ? '0.01' : '1'}
            max={type === 'percentage' ? '100' : undefined}
            step={type === 'fixed' ? '0.01' : '1'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={isPending}
            className={`block w-full rounded-md border border-gray-300 py-2 pr-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 ${
              type === 'fixed' ? 'pl-7' : 'pl-3'
            }`}
            aria-describedby={fieldErrors.value ? 'savings-value-error' : undefined}
          />
          {type === 'percentage' && (
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500 text-sm">
              %
            </span>
          )}
        </div>
        {fieldErrors.value && (
          <p id="savings-value-error" role="alert" className="mt-1 text-xs text-red-600">
            {fieldErrors.value[0]}
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
          disabled={isPending}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? 'Saving…' : existing ? 'Update Goal' : 'Set Goal'}
        </button>
      </div>
    </form>
  )
}
