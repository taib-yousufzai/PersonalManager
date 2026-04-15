'use client'

import { signOut } from '@/app/actions/auth'

export default function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut()}
      className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
    >
      Sign out
    </button>
  )
}
