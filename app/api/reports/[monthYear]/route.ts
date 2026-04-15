import type { NextRequest } from 'next/server'
import { verifySession } from '@/lib/firebase/admin'
import { getMonthlyReport } from '@/lib/db/monthlyReports'
import { generateInsights } from '@/lib/domain/insights'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ monthYear: string }> }
) {
  let uid: string
  try {
    uid = await verifySession()
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { monthYear } = await params
  const report = await getMonthlyReport(uid, monthYear)

  if (!report) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  const insights = generateInsights(report)

  return Response.json({ report, insights })
}
