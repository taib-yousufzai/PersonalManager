import type { NextRequest } from 'next/server'
import { verifySession } from '@/lib/firebase/admin'
import { getRecentMonthlyReports } from '@/lib/db/monthlyReports'

export async function GET(_req: NextRequest) {
  let uid: string
  try {
    uid = await verifySession()
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const reports = await getRecentMonthlyReports(uid)
  return Response.json(reports)
}
