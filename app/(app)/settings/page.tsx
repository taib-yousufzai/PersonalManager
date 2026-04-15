import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/firebase/admin'
import { getCachedCategories } from '@/lib/cache'
import { CategoryManager } from './CategoryManager'

export default async function SettingsPage() {
  let uid: string
  try {
    uid = await verifySession()
  } catch {
    redirect('/sign-in')
  }

  const categories = await getCachedCategories(uid)

  return (
    <div className="px-4 py-6 md:px-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--ivory)' }}>
          Settings
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-light)' }}>
          Manage your expense categories
        </p>
      </div>

      <CategoryManager categories={categories} />
    </div>
  )
}
