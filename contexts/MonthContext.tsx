'use client'

import { createContext, useContext, useState } from 'react'

interface MonthContextValue {
  selectedMonth: string
  setSelectedMonth: (month: string) => void
}

function getCurrentMonth(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

const MonthContext = createContext<MonthContextValue>({
  selectedMonth: getCurrentMonth(),
  setSelectedMonth: () => {},
})

export function MonthProvider({ children }: { children: React.ReactNode }) {
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth)

  return (
    <MonthContext.Provider value={{ selectedMonth, setSelectedMonth }}>
      {children}
    </MonthContext.Provider>
  )
}

export function useMonth(): MonthContextValue {
  return useContext(MonthContext)
}
