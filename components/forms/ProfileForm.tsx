'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { updateAccountEmail, updateAccountPassword } from '@/lib/firebase/auth-security'

export function ProfileForm() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'email' | 'password'>('email')
  
  // Form states
  const [currentPassword, setCurrentPassword] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    
    try {
      await updateAccountEmail(currentPassword, newEmail)
      setMessage({ type: 'success', text: 'Email updated successfully!' })
      setCurrentPassword('')
      setNewEmail('')
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update email' })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }
    
    setLoading(true)
    setMessage(null)
    
    try {
      await updateAccountPassword(currentPassword, newPassword)
      setMessage({ type: 'success', text: 'Password updated successfully!' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update password' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex p-1 rounded-lg bg-[var(--obsidian-3)] border border-[var(--border-light)] w-fit">
        <button
          onClick={() => { setActiveTab('email'); setMessage(null); }}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
            activeTab === 'email' 
              ? 'bg-[var(--obsidian-1)] text-[var(--gold)] shadow-sm' 
              : 'text-[var(--muted)] hover:text-[var(--ivory)]'
          }`}
        >
          Email Address
        </button>
        <button
          onClick={() => { setActiveTab('password'); setMessage(null); }}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
            activeTab === 'password' 
              ? 'bg-[var(--obsidian-1)] text-[var(--gold)] shadow-sm' 
              : 'text-[var(--muted)] hover:text-[var(--ivory)]'
          }`}
        >
          Password
        </button>
      </div>

      {/* Form Area */}
      <div className="rounded-xl bg-[var(--obsidian-2)] border border-[var(--border-light)] p-6 shadow-sm">
        {message && (
          <div 
            className={`mb-6 p-3 rounded-lg text-xs font-medium border ${
              message.type === 'success' 
                ? 'bg-[var(--success)]/10 border-[var(--success)]/30 text-[var(--success)]' 
                : 'bg-[var(--danger)]/10 border-[var(--danger)]/30 text-[var(--danger)]'
            }`}
          >
            {message.text}
          </div>
        )}

        {activeTab === 'email' ? (
          <form onSubmit={handleEmailUpdate} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-1.5">
                Current Email
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full bg-[var(--obsidian-3)] border border-[var(--border-light)] rounded-lg px-4 py-2.5 text-sm text-[var(--muted-light)]"
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-1.5">
                New Email Address
              </label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter new email"
                className="w-full bg-[var(--obsidian-1)] border border-[var(--border-light)] rounded-lg px-4 py-2.5 text-sm text-[var(--ivory)] focus:border-[var(--gold)] outline-none transition-colors"
              />
            </div>

            <div className="pt-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-1.5">
                Current Password (required to verify)
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[var(--obsidian-1)] border border-[var(--border-light)] rounded-lg px-4 py-2.5 text-sm text-[var(--ivory)] focus:border-[var(--gold)] outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-[var(--gold)] hover:bg-[var(--gold-light)] text-[var(--obsidian-1)] font-bold py-2.5 rounded-lg text-sm transition-all shadow-lg shadow-[var(--gold)]/10 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Email'}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[var(--obsidian-1)] border border-[var(--border-light)] rounded-lg px-4 py-2.5 text-sm text-[var(--ivory)] focus:border-[var(--gold)] outline-none transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full bg-[var(--obsidian-1)] border border-[var(--border-light)] rounded-lg px-4 py-2.5 text-sm text-[var(--ivory)] focus:border-[var(--gold)] outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[var(--obsidian-1)] border border-[var(--border-light)] rounded-lg px-4 py-2.5 text-sm text-[var(--ivory)] focus:border-[var(--gold)] outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-[var(--gold)] hover:bg-[var(--gold-light)] text-[var(--obsidian-1)] font-bold py-2.5 rounded-lg text-sm transition-all shadow-lg shadow-[var(--gold)]/10 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        )}
      </div>

      <p className="text-[10px] text-[var(--muted)] px-1 leading-relaxed">
        <strong>Security Note:</strong> Changing sensitive account information requires re-authentication. 
        Your current session will remain active after the update.
      </p>
    </div>
  )
}
