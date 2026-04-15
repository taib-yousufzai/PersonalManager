import type { NextRequest } from 'next/server'
import { verifySession } from '@/lib/firebase/admin'
import { getExpensesForMonth } from '@/lib/db/expenses'

export async function GET(req: NextRequest) {
  let uid: string
  try {
    uid = await verifySession()
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const monthYear = searchParams.get('monthYear')
  const page = searchParams.get('page') ?? undefined

  if (!monthYear) {
    return Response.json({ error: 'monthYear query parameter is required' }, { status: 400 })
  }

  const result = await getExpensesForMonth(uid, monthYear, page ?? undefined)
  return Response.json(result)
}
