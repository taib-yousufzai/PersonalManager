'use client'

import { useEffect } from 'react'
import type { ScheduledPayment } from '@/lib/types'

interface Props {
  payments: ScheduledPayment[]
}

/**
 * Fires a one-time browser Notification for each unpaid payment due today.
 * Requests permission automatically on first load if needed.
 * Renders nothing — purely a side-effect component.
 */
export default function NotificationInit({ payments }: Props) {
  useEffect(() => {
    const unpaid = payments.filter((p) => !p.isPaid)
    if (unpaid.length === 0) return
    if (!('Notification' in window)) return

    const fireNotifications = () => {
      // Group into one notification if multiple
      if (unpaid.length === 1) {
        const p = unpaid[0]
        new Notification('Payment due today 🔔', {
          body: `${p.title} — ₹${p.amount.toLocaleString('en-IN')}`,
          icon: '/favicon.ico',
          tag: `payment-due-${p.id}`,
        })
      } else {
        const total = unpaid.reduce((s, p) => s + p.amount, 0)
        new Notification(`${unpaid.length} payments due today 🔔`, {
          body: `Total: ₹${total.toLocaleString('en-IN')} — open the app to review`,
          icon: '/favicon.ico',
          tag: 'payments-due-today',
        })
      }
    }

    if (Notification.permission === 'granted') {
      fireNotifications()
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') fireNotifications()
      })
    }
  }, [payments])

  return null
}
