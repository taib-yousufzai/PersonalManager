import type { NextRequest } from 'next/server'
import { verifySession } from '@/lib/firebase/admin'
import { deleteExpense } from '@/lib/db/expenses'

interface Params {
  params: Promise<{ id: string }>
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  let uid: string
  try {
    uid = await verifySession()
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  await deleteExpense(uid, id)
  return Response.json({ success: true })
}
