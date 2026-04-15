'use client'

import { useState, useTransition } from 'react'
import { z } from 'zod'
import { IncomeSchema } from '@/lib/validation/schemas'
import { createIncome, updateIncome } from '@/app/actions/income'
import { useMonth } from '@/contexts/MonthContext'
import type { Income } from '@/lib/types'

type IncomeFormData = z.infer<typeof IncomeSchema>
type FieldErrors = Partial<Record<keyof IncomeFormData, string[]>>

interface IncomeFormProps {
  /** Provide to switch form into edit mode */
  existing?: Income
  onSuccess?: () => void
  onCancel?: () => void
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function IncomeForm({ existing, onSuccess, onCancel }: IncomeFormProps) {
  const { selectedMonth } = useMonth()
  const [isPending, startTransition] = useTransition()

  const [amount, setAmount] = useState(existing ? String(existing.amount) : '')
  const [source, setSource] = useState(existing?.source ?? '')
  const [date, setDate] = useState(existing?.date ?? today())
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [rootError, setRootError] = useState<string | null>(null)

  function validate(): IncomeFormData | null {
    const result = IncomeSchema.safeParse({
      amount: parseFloat(amount),
      source,
      date,
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
        ? await updateIncome(existing.id, data)
        : await createIncome(data)

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
        <label htmlFor="income-amount" className="block text-sm font-medium text-gray-700">
          Amount
        </label>
        <input
          id="income-amount"
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={isPending}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          aria-describedby={fieldErrors.amount ? 'income-amount-error' : undefined}
        />
        {fieldErrors.amount && (
          <p id="income-amount-error" role="alert" className="mt-1 text-xs text-red-600">
            {fieldErrors.amount[0]}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="income-source" className="block text-sm font-medium text-gray-700">
          Source
        </label>
        <input
          id="income-source"
          type="text"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          disabled={isPending}
          placeholder="e.g. Salary, Freelance"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          aria-describedby={fieldErrors.source ? 'income-source-error' : undefined}
        />
        {fieldErrors.source && (
          <p id="income-source-error" role="alert" className="mt-1 text-xs text-red-600">
            {fieldErrors.source[0]}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="income-date" className="block text-sm font-medium text-gray-700">
          Date
        </label>
        <input
          id="income-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          disabled={isPending}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          aria-describedby={fieldErrors.date ? 'income-date-error' : undefined}
        />
        {fieldErrors.date && (
          <p id="income-date-error" role="alert" className="mt-1 text-xs text-red-600">
            {fieldErrors.date[0]}
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
          {isPending ? 'Saving…' : existing ? 'Update' : 'Add Income'}
        </button>
      </div>
    </form>
  )
}
