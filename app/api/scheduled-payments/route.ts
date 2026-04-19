import type { NextRequest } from 'next/server'
import { verifySession } from '@/lib/firebase/admin'
import {
  getScheduledPaymentsByMonth,
  createScheduledPayment,
} from '@/lib/db/scheduledPayments'

export async function GET(req: NextRequest) {
  let uid: string
  try {
    uid = await verifySession()
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const monthYear = searchParams.get('monthYear')
  if (!monthYear) {
    return Response.json({ error: 'monthYear query parameter is required' }, { status: 400 })
  }

  const payments = await getScheduledPaymentsByMonth(uid, monthYear)
  return Response.json({ payments })
}

export async function POST(req: NextRequest) {
  let uid: string
  try {
    uid = await verifySession()
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { title, amount, date, note } = body

  if (!title || typeof title !== 'string' || !title.trim()) {
    return Response.json({ error: 'title is required' }, { status: 400 })
  }
  if (typeof amount !== 'number' || amount <= 0) {
    return Response.json({ error: 'amount must be a positive number' }, { status: 400 })
  }
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json({ error: 'date must be YYYY-MM-DD' }, { status: 400 })
  }

  const payment = await createScheduledPayment(uid, {
    title: title.trim(),
    amount,
    date,
    note: note?.trim() || undefined,
    isPaid: false,
  })

  return Response.json({ payment }, { status: 201 })
}
