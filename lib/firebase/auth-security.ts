import { 
  EmailAuthProvider, 
  reauthenticateWithCredential, 
  updateEmail, 
  updatePassword 
} from 'firebase/auth'
import { getClientAuth } from './client'

/**
 * Re-authenticates the current user with their email and password.
 * Required before sensitive operations like email or password updates.
 */
async function reauthenticate(password: string) {
  const auth = getClientAuth()
  const user = auth.currentUser
  
  if (!user || !user.email) {
    throw new Error('User not authenticated')
  }

  const credential = EmailAuthProvider.credential(user.email, password)
  await reauthenticateWithCredential(user, credential)
  return user
}

/**
 * Updates the user's email address after re-authentication.
 */
export async function updateAccountEmail(password: string, newEmail: string) {
  const user = await reauthenticate(password)
  await updateEmail(user, newEmail)
}

/**
 * Updates the user's password after re-authentication.
 */
export async function updateAccountPassword(password: string, newPassword: string) {
  const user = await reauthenticate(password)
  await updatePassword(user, newPassword)
}
