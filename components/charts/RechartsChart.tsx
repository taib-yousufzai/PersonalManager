'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { MonthlyReport } from '@/lib/types'

interface RechartsChartProps {
  reports: Pick<MonthlyReport, 'monthYear' | 'totalIncome' | 'totalExpenses' | 'actualSavings'>[]
}

export default function RechartsChart({ reports }: RechartsChartProps) {
  const data = reports.map((r) => ({
    monthYear: r.monthYear,
    Total_Income: r.totalIncome,
    Total_Expenses: r.totalExpenses,
    Actual_Savings: r.actualSavings,
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="monthYear" tick={{ fontSize: 12 }} />
        <YAxis
          tickFormatter={(v: number) =>
            v.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
          }
          tick={{ fontSize: 12 }}
          width={80}
        />
        <Tooltip
          formatter={(value) =>
            typeof value === 'number'
              ? value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
              : String(value)
          }
        />
        <Legend />
        <Line type="monotone" dataKey="Total_Income" stroke="#22c55e" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="Total_Expenses" stroke="#ef4444" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="Actual_Savings" stroke="#3b82f6" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
