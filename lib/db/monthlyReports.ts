import { FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore } from '../firebase/admin'
import type { MonthlyReport } from '../types'

function reportsCol(uid: string) {
  return getAdminFirestore().collection(`users/${uid}/monthlyReports`)
}

/** Strip Firestore Timestamps so reports are safe to pass to Client Components */
function toPlainReport(id: string, data: FirebaseFirestore.DocumentData): MonthlyReport {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { generatedAt, ...rest } = data
  return { monthYear: id, ...rest, generatedAt: null as never } as MonthlyReport
}

/**
 * Reads a single Monthly_Report by its YYYY-MM document ID.
 */
export async function getMonthlyReport(
  uid: string,
  monthYear: string
): Promise<MonthlyReport | null> {
  const doc = await reportsCol(uid).doc(monthYear).get()
  if (!doc.exists) return null
  return toPlainReport(doc.id, doc.data()!)
}

/**
 * Returns the last 12 Monthly_Reports ordered by monthYear descending.
 */
export async function getRecentMonthlyReports(uid: string): Promise<MonthlyReport[]> {
  const snap = await reportsCol(uid).orderBy('monthYear', 'desc').limit(12).get()
  return snap.docs.map((d) => toPlainReport(d.id, d.data()))
}

/**
 * Writes (creates or overwrites) a Monthly_Report document.
 * The document ID is the monthYear string (YYYY-MM).
 */
export async function saveMonthlyReport(
  uid: string,
  report: Omit<MonthlyReport, 'generatedAt'>
): Promise<void> {
  await reportsCol(uid)
    .doc(report.monthYear)
    .set({ ...report, generatedAt: FieldValue.serverTimestamp() })
}
