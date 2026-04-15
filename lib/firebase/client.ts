/**
 * Firebase client SDK initialization.
 * Lazy-initialized only when Firebase credentials are present.
 * Safe to import in Client Components — uses public env vars only.
 */
'use client'

import { getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'

function getClientApp(): FirebaseApp {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  if (!apiKey) {
    throw new Error(
      'Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_API_KEY to use Google/email sign-in.'
    )
  }

  if (getApps().length > 0) return getApps()[0]

  return initializeApp({
    apiKey,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  })
}

export function getClientAuth(): Auth {
  return getAuth(getClientApp())
}

/** @deprecated use getClientAuth() instead */
export const clientAuth = new Proxy({} as Auth, {
  get(_target, prop) {
    return getClientAuth()[prop as keyof Auth]
  },
})
