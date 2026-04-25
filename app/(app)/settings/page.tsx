import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/firebase/admin'
import { getCachedCategories } from '@/lib/cache'
import { CategoryManager } from './CategoryManager'
import { ProfileForm } from '@/components/forms/ProfileForm'

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  let uid: string
  try {
    uid = await verifySession()
  } catch {
    redirect('/sign-in')
  }

  const { tab = 'general' } = await searchParams
  const categories = await getCachedCategories(uid)

  return (
    <div className="px-4 py-6 md:px-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--ivory)' }}>
          Settings
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-light)' }}>
          Configure your preferences and account security.
        </p>
      </div>

      <div className="flex gap-8 border-b border-[var(--border-light)]">
        <a 
          href="/settings?tab=general"
          className={`pb-4 text-sm font-medium transition-colors relative ${
            tab === 'general' ? 'text-[var(--gold)]' : 'text-[var(--muted)] hover:text-[var(--ivory)]'
          }`}
        >
          General
          {tab === 'general' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--gold)]" />
          )}
        </a>
        <a 
          href="/settings?tab=security"
          className={`pb-4 text-sm font-medium transition-colors relative ${
            tab === 'security' ? 'text-[var(--gold)]' : 'text-[var(--muted)] hover:text-[var(--ivory)]'
          }`}
        >
          Account & Security
          {tab === 'security' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--gold)]" />
          )}
        </a>
      </div>

      {tab === 'general' ? (
        <div className="space-y-6">
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-4">
              Expense Categories
            </h2>
            <CategoryManager categories={categories} />
          </section>
        </div>
      ) : (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-4">
            Security Settings
          </h2>
          <ProfileForm />
        </section>
      )}
    </div>
  )
}
