'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from 'firebase/auth'

interface AuthContextValue {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Only initialize Firebase Auth listener if credentials are configured
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
    if (!apiKey) {
      // Demo mode — no Firebase Auth, just mark as not loading
      setLoading(false)
      return
    }

    let unsubscribe: (() => void) | undefined

    import('firebase/auth').then(({ onAuthStateChanged }) =>
      import('@/lib/firebase/client').then(({ getClientAuth }) => {
        unsubscribe = onAuthStateChanged(getClientAuth(), (firebaseUser) => {
          setUser(firebaseUser)
          setLoading(false)
        })
      })
    ).catch(() => {
      setLoading(false)
    })

    return () => unsubscribe?.()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}
