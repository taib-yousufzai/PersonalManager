'use client'

import { useState, useTransition } from 'react'
import { deleteCategory } from '@/app/actions/categories'
import { CategoryForm } from '@/components/forms/CategoryForm'
import CategoryBadge from '@/components/ui/CategoryBadge'
import type { Category } from '@/lib/types'

interface CategoryManagerProps {
  categories: Category[]
}

const inputStyle: React.CSSProperties = {
  background: 'var(--obsidian-4)',
  color: 'var(--ivory)',
  border: '1px solid var(--border-light)',
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  color: 'var(--muted-light)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  fontSize: '0.75rem',
  fontWeight: 600,
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
        <h2
          className="text-xs font-semibold uppercase tracking-wide mb-3"
          style={{ color: 'var(--muted-light)' }}
        >
          Your Categories
        </h2>
        {categories.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--muted-light)' }}>
            No categories yet. Create one below.
          </p>
        ) : (
          <ul
            className="rounded-lg overflow-hidden"
            style={{
              background: 'var(--obsidian-3)',
              border: '1px solid var(--border-light)',
            }}
          >
            {categories.map((cat, idx) => (
              <li
                key={cat.id}
                className="px-4 py-3"
                style={
                  idx < categories.length - 1
                    ? { borderBottom: '1px solid var(--border)' }
                    : undefined
                }
              >
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
                        <p className="text-sm" style={{ color: 'var(--danger)' }}>
                          {deleteError}
                        </p>
                        <div>
                          <label
                            htmlFor={`reassign-${cat.id}`}
                            className="block mb-1"
                            style={labelStyle}
                          >
                            Reassign expenses to:
                          </label>
                          <select
                            id={`reassign-${cat.id}`}
                            value={reassignTo}
                            onChange={(e) => setReassignTo(e.target.value)}
                            disabled={isPending}
                            className="block w-full rounded-lg px-3 py-2.5 text-sm transition-colors disabled:opacity-50"
                            style={inputStyle}
                            onFocus={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
                            onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-light)')}
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
                            className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50"
                            style={{
                              background: 'transparent',
                              color: 'var(--muted-light)',
                              border: '1px solid var(--border-light)',
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmDelete(cat.id, reassignTo)}
                            disabled={isPending || !reassignTo}
                            className="rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors disabled:opacity-50"
                            style={{ background: 'var(--danger)', color: 'var(--ivory)' }}
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
                          className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50"
                          style={{
                            background: 'transparent',
                            color: 'var(--muted-light)',
                            border: '1px solid var(--border-light)',
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => confirmDelete(cat.id)}
                          disabled={isPending}
                          className="rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors disabled:opacity-50"
                          style={{ background: 'var(--danger)', color: 'var(--ivory)' }}
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
                        className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                        style={{
                          background: 'transparent',
                          color: 'var(--gold)',
                          border: '1px solid var(--border-light)',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold-light)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--gold)')}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null)
                          startDelete(cat.id)
                        }}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                        style={{
                          background: 'transparent',
                          color: 'var(--danger)',
                          border: '1px solid rgba(224,82,82,0.35)',
                        }}
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
      <section
        className="rounded-lg p-4"
        style={{
          background: 'var(--obsidian-3)',
          border: '1px solid var(--border-light)',
        }}
      >
        <h2
          className="text-xs font-semibold uppercase tracking-wide mb-4"
          style={{ color: 'var(--muted-light)' }}
        >
          Add Category
        </h2>
        <CategoryForm />
      </section>
    </div>
  )
}
