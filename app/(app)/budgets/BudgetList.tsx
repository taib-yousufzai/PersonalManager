'use client'

import { useState } from 'react'
import BudgetProgressBar from '@/components/ui/BudgetProgressBar'
import { BudgetForm } from '@/components/forms/BudgetForm'
import type { Budget, BudgetUtilization, Category } from '@/lib/types'

interface BudgetListProps {
  budgets: Budget[]
  utilization: BudgetUtilization[]
  categories: Category[]
  monthYear: string
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export default function BudgetList({ budgets, utilization, categories, monthYear }: BudgetListProps) {
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null)

  // Build a map from categoryId → utilization for quick lookup
  const utilizationMap = new Map(utilization.map((u) => [u.categoryId, u]))
  const categoryMap = new Map(categories.map((c) => [c.id, c]))

  if (budgets.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
        <p className="text-sm text-gray-500">No budgets set for this month.</p>
        <p className="mt-1 text-xs text-gray-400">Use the form below to set your first budget.</p>
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
          <li key={budget.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            {isEditing ? (
              <>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Edit Budget — {categoryName}</h3>
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
                  <span className="text-sm font-medium text-gray-800">{categoryName}</span>
                  <button
                    onClick={() => setEditingBudgetId(budget.id)}
                    aria-label={`Edit budget for ${categoryName}`}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                </div>
                <BudgetProgressBar spent={spent} budgeted={budget.limit} />
                <p className={`mt-1.5 text-xs ${remaining < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                  {remaining < 0
                    ? `${formatCurrency(Math.abs(remaining))} over budget`
                    : `${formatCurrency(remaining)} remaining`}
                </p>
              </>
            )}
          </li>
        )
      })}
    </ul>
  )
}
