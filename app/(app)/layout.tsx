import { AuthProvider } from '@/contexts/AuthContext'
import { MonthProvider } from '@/contexts/MonthContext'
import AppNav from './AppNav'
import OfflineBanner from './OfflineBanner'
import SignOutButton from '@/components/ui/SignOutButton'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <MonthProvider>
        <OfflineBanner />
        <div className="flex min-h-screen">
          {/* Desktop sidebar */}
          <aside className="hidden md:flex md:w-56 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-gray-200">
            <div className="flex flex-col flex-1 overflow-y-auto py-4">
              <div className="px-4 mb-6">
                <h1 className="text-lg font-semibold text-gray-900">Finance</h1>
              </div>
              <AppNav orientation="sidebar" />
            </div>
            {/* Sign out at bottom of sidebar */}
            <div className="px-4 py-4 border-t border-gray-200">
              <SignOutButton />
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 md:ml-56 pb-16 md:pb-0">
            {children}
          </main>

          {/* Mobile bottom bar */}
          <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-10">
            <AppNav orientation="bottom" />
          </nav>
        </div>
      </MonthProvider>
    </AuthProvider>
  )
}
