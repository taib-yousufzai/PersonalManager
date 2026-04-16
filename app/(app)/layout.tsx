import { AuthProvider } from '@/contexts/AuthContext'
import { MonthProvider } from '@/contexts/MonthContext'
import AppNav from './AppNav'
import OfflineBanner from './OfflineBanner'
import InstallPrompt from '@/components/ui/InstallPrompt'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <MonthProvider>
        <OfflineBanner />
        <InstallPrompt />
        <div className="flex min-h-screen">

          {/* ── Desktop sidebar ── */}
          <aside
            className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:z-20"
            style={{
              width: 'var(--sidebar-w)',
              background: 'var(--obsidian-2)',
              borderRight: '1px solid var(--border)',
            }}
          >
            {/* Brand */}
            <div className="px-5 pt-6 pb-4">
              <span
                className="text-xs font-semibold tracking-[0.25em] uppercase"
                style={{ color: 'var(--gold)' }}
              >
                Ledger
              </span>
            </div>

            {/* Nav */}
            <div className="flex-1 overflow-y-auto px-3 pb-4">
              <AppNav orientation="sidebar" />
            </div>

            {/* Sign out */}
            <div className="px-3 pb-5" style={{ borderTop: '1px solid var(--border)' }}>
              <AppNav orientation="signout" />
            </div>
          </aside>

          {/* ── Main content ── */}
          <main
            className="flex-1 pb-20 md:pb-0"
            style={{ marginLeft: 0 }}
          >
            <div
              className="hidden md:block"
              style={{ marginLeft: 'var(--sidebar-w)' }}
            />
            <div className="md:ml-[220px] page-enter">
              {children}
            </div>
          </main>

          {/* ── Mobile bottom bar ── */}
          <nav
            className="md:hidden fixed bottom-0 inset-x-0 z-20"
            style={{
              background: 'var(--obsidian-2)',
              borderTop: '1px solid var(--border)',
            }}
          >
            <AppNav orientation="bottom" />
          </nav>
        </div>
      </MonthProvider>
    </AuthProvider>
  )
}
