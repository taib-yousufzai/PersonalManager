import type { NextRequest } from 'next/server'
import { verifySession } from '@/lib/firebase/admin'
import { getBudgetsForMonth } from '@/lib/db/budgets'

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

  const budgets = await getBudgetsForMonth(uid, monthYear)
  return Response.json(budgets)
}
