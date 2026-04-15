'use server'

import { getAuth } from 'firebase-admin/auth'
import { getApps, initializeApp, cert } from 'firebase-admin/app'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

function initAdmin() {
  if (getApps().length > 0) return

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase Admin environment variables')
  }

  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) })
}

const SESSION_COOKIE_NAME = 'session'
const SESSION_DURATION_MS = 60 * 60 * 24 * 5 * 1000 // 5 days

export async function demoSignIn(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, 'demo-session', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION_MS / 1000,
    path: '/',
  })

  // Seed default categories for the demo user if not already done, and clean up any duplicates
  const { seedDefaultCategories, deduplicateCategories } = await import('@/lib/db/categories')
  await seedDefaultCategories('demo-user')
  await deduplicateCategories('demo-user')

  redirect('/')
}

export async function createSession(idToken: string): Promise<void> {
  initAdmin()

  const sessionCookie = await getAuth().createSessionCookie(idToken, {
    expiresIn: SESSION_DURATION_MS,
  })

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION_MS / 1000,
    path: '/',
  })

  redirect('/')
}

export async function signOut(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
  redirect('/sign-in')
}
