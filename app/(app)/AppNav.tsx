'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/app/actions/auth'

const navItems = [
  { href: '/', label: 'Dashboard', icon: '🏠' },
  { href: '/expenses', label: 'Expenses', icon: '💸' },
  { href: '/budgets', label: 'Budgets', icon: '📊' },
  { href: '/reports', label: 'Reports', icon: '📈' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
]

interface AppNavProps {
  orientation: 'sidebar' | 'bottom'
}

export default function AppNav({ orientation }: AppNavProps) {
  const pathname = usePathname()

  if (orientation === 'sidebar') {
    return (
      <nav className="flex flex-col gap-1 px-2">
        {navItems.map(({ href, label, icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
    )
  }

  return (
    <div className="flex items-center justify-around h-16">
      {navItems.map(({ href, label, icon }) => {
        const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 text-xs font-medium transition-colors ${
              isActive ? 'text-blue-700' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <span className="text-xl">{icon}</span>
            <span>{label}</span>
          </Link>
        )
      })}
      <button
        type="button"
        onClick={() => signOut()}
        className="flex flex-col items-center gap-0.5 px-2 py-1 text-xs font-medium text-gray-500 hover:text-gray-900"
      >
        <span className="text-xl">🚪</span>
        <span>Sign out</span>
      </button>
    </div>
  )
}
