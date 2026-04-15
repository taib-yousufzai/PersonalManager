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
  existing?: Income
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
        <p role="alert" className="text-sm" style={{ color: 'var(--danger)' }}>
          {rootError}
        </p>
      )}

      <div>
        <label htmlFor="income-amount" className="block mb-1" style={labelStyle}>
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
          className="block w-full rounded-lg px-3 py-2.5 text-sm transition-colors disabled:opacity-50"
          style={inputStyle}
          onFocus={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-light)')}
          aria-describedby={fieldErrors.amount ? 'income-amount-error' : undefined}
        />
        {fieldErrors.amount && (
          <p id="income-amount-error" role="alert" className="mt-1 text-xs" style={{ color: 'var(--danger)' }}>
            {fieldErrors.amount[0]}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="income-source" className="block mb-1" style={labelStyle}>
          Source
        </label>
        <input
          id="income-source"
          type="text"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          disabled={isPending}
          placeholder="e.g. Salary, Freelance"
          className="block w-full rounded-lg px-3 py-2.5 text-sm transition-colors disabled:opacity-50"
          style={{ ...inputStyle, color: source ? 'var(--ivory)' : undefined }}
          onFocus={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-light)')}
          aria-describedby={fieldErrors.source ? 'income-source-error' : undefined}
        />
        {fieldErrors.source && (
          <p id="income-source-error" role="alert" className="mt-1 text-xs" style={{ color: 'var(--danger)' }}>
            {fieldErrors.source[0]}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="income-date" className="block mb-1" style={labelStyle}>
          Date
        </label>
        <input
          id="income-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          disabled={isPending}
          className="block w-full rounded-lg px-3 py-2.5 text-sm transition-colors disabled:opacity-50"
          style={inputStyle}
          onFocus={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-light)')}
          aria-describedby={fieldErrors.date ? 'income-date-error' : undefined}
        />
        {fieldErrors.date && (
          <p id="income-date-error" role="alert" className="mt-1 text-xs" style={{ color: 'var(--danger)' }}>
            {fieldErrors.date[0]}
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
          disabled={isPending}
          className="rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
          style={{ background: 'var(--gold)', color: 'var(--obsidian)' }}
        >
          {isPending ? 'Saving…' : existing ? 'Update' : 'Add Income'}
        </button>
      </div>
    </form>
  )
}
