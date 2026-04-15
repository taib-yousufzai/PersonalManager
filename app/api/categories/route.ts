import type { NextRequest } from 'next/server'
import { verifySession } from '@/lib/firebase/admin'
import { getCategories } from '@/lib/db/categories'

export async function GET(_req: NextRequest) {
  let uid: string
  try {
    uid = await verifySession()
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const categories = await getCategories(uid)
  return Response.json(categories)
}
