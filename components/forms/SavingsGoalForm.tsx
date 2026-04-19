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
      setFieldErrors({ ...(flat.fieldErrors as FieldErrors) })
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

  const activeTabStyle: React.CSSProperties = {
    background: 'var(--gold)',
    color: 'var(--obsidian)',
    fontWeight: 600,
  }
  const inactiveTabStyle: React.CSSProperties = {
    background: 'transparent',
    color: 'var(--muted-light)',
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {rootError && (
        <p role="alert" className="text-sm" style={{ color: 'var(--danger)' }}>
          {rootError}
        </p>
      )}

      {/* Goal type toggle */}
      <div>
        <span className="block mb-1" style={labelStyle}>Goal type</span>
        <div
          className="flex overflow-hidden w-fit rounded-lg"
          style={{ border: '1px solid var(--border-light)' }}
        >
          <button
            type="button"
            onClick={() => { setType('fixed'); setValue('') }}
            disabled={isPending}
            className="px-4 py-2 text-sm transition-colors disabled:opacity-50"
            style={type === 'fixed' ? activeTabStyle : inactiveTabStyle}
          >
            Fixed amount
          </button>
          <button
            type="button"
            onClick={() => { setType('percentage'); setValue('') }}
            disabled={isPending}
            className="px-4 py-2 text-sm transition-colors disabled:opacity-50"
            style={{
              ...(type === 'percentage' ? activeTabStyle : inactiveTabStyle),
              borderLeft: '1px solid var(--border-light)',
            }}
          >
            % of income
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="savings-value" className="block mb-1" style={labelStyle}>
          {type === 'fixed' ? 'Amount' : 'Percentage (1–100)'}
        </label>
        <div className="relative">
          {type === 'fixed' && (
            <span
              className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm"
              style={{ color: 'var(--muted-light)' }}
            >
              ₹
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
            className={`block w-full rounded-lg py-2.5 pr-3 text-sm transition-colors disabled:opacity-50 ${
              type === 'fixed' ? 'pl-7' : 'pl-3'
            }`}
            style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-light)')}
            aria-describedby={fieldErrors.value ? 'savings-value-error' : undefined}
          />
          {type === 'percentage' && (
            <span
              className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm"
              style={{ color: 'var(--muted-light)' }}
            >
              %
            </span>
          )}
        </div>
        {fieldErrors.value && (
          <p id="savings-value-error" role="alert" className="mt-1 text-xs" style={{ color: 'var(--danger)' }}>
            {fieldErrors.value[0]}
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
          {isPending ? 'Saving…' : existing ? 'Update Goal' : 'Set Goal'}
        </button>
      </div>
    </form>
  )
}
