'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { z } from 'zod'
import { verifySession } from '@/lib/firebase/admin'
import {
  findCategoryByName,
  createCategory as dbCreateCategory,
  updateCategory,
  deleteCategory as dbDeleteCategory,
  seedDefaultCategories as dbSeedDefaultCategories,
} from '@/lib/db/categories'
import { getExpensesByCategory, reassignExpensesToCategory } from '@/lib/db/expenses'
import { CategorySchema } from '@/lib/validation/schemas'
import type { ActionResult } from '@/lib/types'

function bust(uid: string) {
  revalidateTag(`user-${uid}`)
  revalidatePath('/')
  revalidatePath('/expenses')
  revalidatePath('/budgets')
  revalidatePath('/settings')
}

export async function createCategory(data: unknown): Promise<ActionResult> {
  const uid = await verifySession()

  const parsed = CategorySchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const { name, type } = parsed.data

  const existing = await findCategoryByName(uid, name)
  if (existing) {
    return { success: false, errors: { name: ['A category with this name already exists'] } }
  }

  await dbCreateCategory(uid, { name, type, isDefault: false })
  bust(uid)
  return { success: true }
}

export async function renameCategory(id: string, name: string): Promise<ActionResult> {
  const uid = await verifySession()

  const parsed = z.string().min(1).max(50).safeParse(name)
  if (!parsed.success) {
    return { success: false, errors: { name: parsed.error.issues.map((e) => e.message) } }
  }

  const found = await findCategoryByName(uid, name)
  if (found && found.id !== id) {
    return { success: false, errors: { name: ['A category with this name already exists'] } }
  }

  await updateCategory(uid, id, { name })
  bust(uid)
  return { success: true }
}

export async function deleteCategory(id: string, reassignTo?: string): Promise<ActionResult> {
  const uid = await verifySession()

  const expenses = await getExpensesByCategory(uid, id)

  if (expenses.length > 0 && !reassignTo) {
    return {
      success: false,
      errors: {
        _root: [
          `Cannot delete: ${expenses.length} expense(s) are assigned to this category. Please reassign them first.`,
        ],
      },
    }
  }

  if (expenses.length > 0 && reassignTo) {
    await reassignExpensesToCategory(uid, id, reassignTo)
  }

  await dbDeleteCategory(uid, id)
  bust(uid)
  return { success: true }
}

export async function seedDefaultCategories(uid: string): Promise<void> {
  await dbSeedDefaultCategories(uid)
}
