import { z } from 'zod'

export const IncomeSchema = z.object({
  amount: z.number().positive(),
  source: z.string().min(1).max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  monthYear: z.string().regex(/^\d{4}-\d{2}$/)
})

export const ExpenseSchema = z.object({
  amount: z.number().positive(),
  categoryId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().max(200).optional(),
  monthYear: z.string().regex(/^\d{4}-\d{2}$/)
})

export const CategorySchema = z.object({
  name: z.string().min(1).max(50),
  type: z.enum(['essential', 'discretionary'])
})

export const BudgetSchema = z.object({
  categoryId: z.string().min(1),
  monthYear: z.string().regex(/^\d{4}-\d{2}$/),
  limit: z.number().positive()
})

export const SavingsGoalSchema = z.object({
  type: z.enum(['fixed', 'percentage']),
  value: z.number().positive(),
  monthYear: z.string().regex(/^\d{4}-\d{2}$/)
}).refine(
  (data) => data.type !== 'percentage' || (data.value >= 1 && data.value <= 100),
  { message: 'Percentage must be between 1 and 100', path: ['value'] }
)
