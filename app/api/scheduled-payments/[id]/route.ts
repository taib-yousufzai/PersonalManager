import type { NextRequest } from 'next/server'
import { verifySession } from '@/lib/firebase/admin'
import {
  updateScheduledPayment,
  deleteScheduledPayment,
} from '@/lib/db/scheduledPayments'

interface Params {
  params: Promise<{ id: string }>
}

export async function PATCH(req: NextRequest, { params }: Params) {
  let uid: string
  try {
    uid = await verifySession()
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const updates: Record<string, unknown> = {}

  if (typeof body.isPaid === 'boolean') updates.isPaid = body.isPaid
  if (typeof body.title === 'string' && body.title.trim()) updates.title = body.title.trim()
  if (typeof body.amount === 'number' && body.amount > 0) updates.amount = body.amount
  if (typeof body.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.date)) updates.date = body.date
  if (typeof body.note === 'string') updates.note = body.note.trim() || undefined

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  await updateScheduledPayment(uid, id, updates)
  return Response.json({ success: true })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  let uid: string
  try {
    uid = await verifySession()
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  await deleteScheduledPayment(uid, id)
  return Response.json({ success: true })
}
