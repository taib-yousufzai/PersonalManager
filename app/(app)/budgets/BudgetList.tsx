'use client'

import { useState } from 'react'
import BudgetProgressBar from '@/components/ui/BudgetProgressBar'
import { BudgetForm } from '@/components/forms/BudgetForm'
import CurrencyDisplay from '@/components/ui/CurrencyDisplay'
import { formatCurrencyInline } from '@/lib/currency'
import type { Budget, BudgetUtilization, Category } from '@/lib/types'

interface BudgetListProps {
  budgets: Budget[]
  utilization: BudgetUtilization[]
  categories: Category[]
  monthYear: string
}


export default function BudgetList({ budgets, utilization, categories, monthYear }: BudgetListProps) {
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null)

  const utilizationMap = new Map(utilization.map((u) => [u.categoryId, u]))
  const categoryMap = new Map(categories.map((c) => [c.id, c]))

  if (budgets.length === 0) {
    return (
      <div
        className="rounded-lg p-8 text-center"
        style={{
          background: 'var(--obsidian-3)',
          border: '1px dashed var(--border-light)',
        }}
      >
        <p className="text-sm" style={{ color: 'var(--muted-light)' }}>
          No budgets set for this month.
        </p>
        <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
          Use the form below to set your first budget.
        </p>
      </div>
    )
  }

  return (
    <ul className="space-y-4">
      {budgets.map((budget) => {
        const util = utilizationMap.get(budget.categoryId)
        const category = categoryMap.get(budget.categoryId)
        const categoryName = util?.categoryName ?? category?.name ?? budget.categoryId
        const spent = util?.spent ?? 0
        const remaining = budget.limit - spent
        const isEditing = editingBudgetId === budget.id

        return (
          <li
            key={budget.id}
            className="rounded-lg p-4"
            style={{
              background: 'var(--obsidian-3)',
              border: '1px solid var(--border-light)',
            }}
          >
            {isEditing ? (
              <>
                <h3
                  className="text-xs font-semibold uppercase tracking-wide mb-3"
                  style={{ color: 'var(--muted-light)' }}
                >
                  Edit Budget — {categoryName}
                </h3>
                <BudgetForm
                  categories={categories}
                  existing={budget}
                  onSuccess={() => setEditingBudgetId(null)}
                  onCancel={() => setEditingBudgetId(null)}
                />
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--ivory)' }}>
                    {categoryName}
                  </span>
                  <button
                    onClick={() => setEditingBudgetId(budget.id)}
                    aria-label={`Edit budget for ${categoryName}`}
                    className="text-xs transition-colors"
                    style={{ color: 'var(--gold)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold-light)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--gold)')}
                  >
                    Edit
                  </button>
                </div>
                <BudgetProgressBar spent={spent} budgeted={budget.limit} />
                <p
                  className="mt-1.5 text-xs"
                  style={{ color: remaining < 0 ? 'var(--danger)' : 'var(--muted-light)' }}
                >
                  {remaining < 0
                    ? `${formatCurrencyInline(Math.abs(remaining))} over budget`
                    : `${formatCurrencyInline(remaining)} remaining`}
                </p>
              </>
            )}
          </li>
        )
      })}
    </ul>
  )
}
