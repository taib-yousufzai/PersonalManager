'use client'

import { useState, useTransition } from 'react'
import { z } from 'zod'
import { SavingsTransactionSchema } from '@/lib/validation/schemas'
import { createSavingsTransaction } from '@/app/actions/savings'

type SavingsFormData = z.infer<typeof SavingsTransactionSchema>
type FieldErrors = Partial<Record<keyof SavingsFormData, string[]>>

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

export function SavingsTransactionForm({ onSuccess }: { onSuccess?: () => void }) {
  const [isPending, startTransition] = useTransition()
  
  const [type, setType] = useState<'deposit' | 'withdrawal'>('deposit')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(today())
  const [note, setNote] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [rootError, setRootError] = useState<string | null>(null)

  function validate(): SavingsFormData | null {
    const result = SavingsTransactionSchema.safeParse({
      amount: parseFloat(amount),
      type,
      date,
      note: note || undefined
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
      const result = await createSavingsTransaction(data)
      if (!result.success) {
        const { _root, ...rest } = result.errors as Record<string, string[]>
        setFieldErrors(rest as FieldErrors)
        if (_root) setRootError(_root[0])
        return
      }
      
      setAmount('')
      setNote('')
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

      {/* Mode Switch */}
      <div className="flex p-1 rounded-lg bg-[var(--obsidian-4)] border border-[var(--border-light)]">
        <button
          type="button"
          onClick={() => setType('deposit')}
          className="flex-1 py-1.5 text-xs font-bold uppercase rounded-md transition-all"
          style={{ 
            background: type === 'deposit' ? 'var(--success)' : 'transparent',
            color: type === 'deposit' ? 'var(--obsidian)' : 'var(--muted-light)'
          }}
        >
          Deposit
        </button>
        <button
          type="button"
          onClick={() => setType('withdrawal')}
          className="flex-1 py-1.5 text-xs font-bold uppercase rounded-md transition-all"
          style={{ 
            background: type === 'withdrawal' ? 'var(--warning)' : 'transparent',
            color: type === 'withdrawal' ? 'var(--obsidian)' : 'var(--muted-light)'
          }}
        >
          Withdraw
        </button>
      </div>

      <div>
        <label htmlFor="savings-amount" className="block mb-1" style={labelStyle}>
          Amount
        </label>
        <input
          id="savings-amount"
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
        />
        {fieldErrors.amount && (
          <p className="mt-1 text-xs" style={{ color: 'var(--danger)' }}>{fieldErrors.amount[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="savings-note" className="block mb-1" style={labelStyle}>
          Note (Optional)
        </label>
        <input
          id="savings-note"
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={isPending}
          placeholder="e.g. For house downpayment"
          className="block w-full rounded-lg px-3 py-2.5 text-sm transition-colors disabled:opacity-50"
          style={inputStyle}
          onFocus={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-light)')}
        />
      </div>

      <div>
        <label htmlFor="savings-date" className="block mb-1" style={labelStyle}>
          Date
        </label>
        <input
          id="savings-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          disabled={isPending}
          className="block w-full rounded-lg px-3 py-2.5 text-sm transition-colors disabled:opacity-50"
          style={inputStyle}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg py-2.5 text-sm font-bold transition-all active:scale-[0.98]"
        style={{ 
          background: type === 'deposit' ? 'var(--gold)' : 'var(--warning)', 
          color: 'var(--obsidian)' 
        }}
      >
        {isPending ? 'Processing…' : type === 'deposit' ? 'Add to Savings' : 'Withdraw from Savings'}
      </button>
    </form>
  )
}
