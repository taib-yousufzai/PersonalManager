'use client'

import { useState, useTransition } from 'react'
import { deleteCategory } from '@/app/actions/categories'
import { CategoryForm } from '@/components/forms/CategoryForm'
import CategoryBadge from '@/components/ui/CategoryBadge'
import type { Category } from '@/lib/types'

interface CategoryManagerProps {
  categories: Category[]
}

export function CategoryManager({ categories }: CategoryManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [reassignTo, setReassignTo] = useState<string>('')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function startDelete(id: string) {
    setDeletingId(id)
    setReassignTo('')
    setDeleteError(null)
  }

  function cancelDelete() {
    setDeletingId(null)
    setReassignTo('')
    setDeleteError(null)
  }

  function confirmDelete(id: string, withReassign?: string) {
    startTransition(async () => {
      const result = await deleteCategory(id, withReassign)
      if (result.success) {
        setDeletingId(null)
        setReassignTo('')
        setDeleteError(null)
      } else {
        const rootMsg = (result.errors as Record<string, string[]>)._root?.[0]
        if (rootMsg) {
          // Has associated expenses — show reassignment prompt
          setDeleteError(rootMsg)
        } else {
          setDeleteError('Failed to delete category.')
        }
      }
    })
  }

  const otherCategories = categories.filter((c) => c.id !== deletingId)

  return (
    <div className="space-y-6">
      {/* Category list */}
      <section>
        <h2 className="text-base font-medium text-gray-700 mb-3">Your Categories</h2>
        {categories.length === 0 ? (
          <p className="text-sm text-gray-500">No categories yet. Create one below.</p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white shadow-sm">
            {categories.map((cat) => (
              <li key={cat.id} className="px-4 py-3">
                {editingId === cat.id ? (
                  <CategoryForm
                    existing={cat}
                    onSuccess={() => setEditingId(null)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : deletingId === cat.id ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CategoryBadge name={cat.name} type={cat.type} />
                    </div>
                    {deleteError ? (
                      <div className="space-y-3">
                        <p className="text-sm text-red-600">{deleteError}</p>
                        <div>
                          <label
                            htmlFor={`reassign-${cat.id}`}
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Reassign expenses to:
                          </label>
                          <select
                            id={`reassign-${cat.id}`}
                            value={reassignTo}
                            onChange={(e) => setReassignTo(e.target.value)}
                            disabled={isPending}
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                          >
                            <option value="">— select a category —</option>
                            {otherCategories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={cancelDelete}
                            disabled={isPending}
                            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmDelete(cat.id, reassignTo)}
                            disabled={isPending || !reassignTo}
                            className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            {isPending ? 'Deleting…' : 'Reassign & Delete'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={cancelDelete}
                          disabled={isPending}
                          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => confirmDelete(cat.id)}
                          disabled={isPending}
                          className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {isPending ? 'Deleting…' : 'Confirm Delete'}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <CategoryBadge name={cat.name} type={cat.type} />
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(cat.id)
                          setDeletingId(null)
                        }}
                        className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null)
                          startDelete(cat.id)
                        }}
                        className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Create new category */}
      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-medium text-gray-700 mb-4">Add Category</h2>
        <CategoryForm />
      </section>
    </div>
  )
}
