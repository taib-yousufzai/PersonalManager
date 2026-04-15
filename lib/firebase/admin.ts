/**
 * Firebase Admin SDK initialization (server-side only).
 * Provides a singleton Firestore instance and a session verification helper.
 */
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { cookies } from 'next/headers'

function initAdmin() {
  if (getApps().length > 0) return

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Missing Firebase Admin environment variables: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY'
    )
  }

  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) })
}

export function getAdminFirestore() {
  initAdmin()
  return getFirestore()
}

/**
 * Verifies the session cookie and returns the authenticated user's UID.
 * Throws an error if the session is missing or invalid.
 */
export async function verifySession(): Promise<string> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')?.value

  if (!sessionCookie) {
    throw new Error('Unauthorized: no session cookie')
  }

  // Demo mode: bypass Firebase verification
  if (sessionCookie === 'demo-session') {
    return 'demo-user'
  }

  initAdmin()
  const decoded = await getAuth().verifySessionCookie(sessionCookie, true)
  return decoded.uid
}
