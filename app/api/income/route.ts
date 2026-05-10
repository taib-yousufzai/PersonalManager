import type { NextRequest } from 'next/server'
import { verifySession } from '@/lib/firebase/admin'
import { getIncomeForMonth } from '@/lib/db/income'

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

  if (!/^\d{4}-\d{2}$/.test(monthYear)) {
    return Response.json({ error: 'monthYear must be YYYY-MM' }, { status: 400 })
  }

  try {
    const incomes = await getIncomeForMonth(uid, monthYear)
    return Response.json({ incomes })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
