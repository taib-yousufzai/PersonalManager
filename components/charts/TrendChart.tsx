'use client'

import dynamic from 'next/dynamic'
import type { MonthlyReport } from '@/lib/types'

interface TrendChartProps {
  reports: Pick<MonthlyReport, 'monthYear' | 'totalIncome' | 'totalExpenses' | 'actualSavings'>[]
}

// Lazy-load the Recharts bundle on the client only
const RechartsChart = dynamic(
  () => import('./RechartsChart'),
  { ssr: false, loading: () => <div className="flex h-64 items-center justify-center text-sm text-gray-400">Loading chart…</div> }
)

export default function TrendChart({ reports }: TrendChartProps) {
  return <RechartsChart reports={reports} />
}
