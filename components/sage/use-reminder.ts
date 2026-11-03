'use client'

import { useEffect, useState } from 'react'
import { dateKey } from '@/lib/finance'
import type { AppState } from '@/lib/types'

const NOTIFIED_KEY = 'sage-last-reminder'

export function useReminder(state: AppState) {
  const [due, setDue] = useState(false)
  const profile = state.profile
  const today = dateKey(new Date())
  const loggedToday = state.expenses.some((e) => e.date === today) || state.noSpendDays.includes(today)

  useEffect(() => {
    if (!profile?.reminderEnabled) {
      setDue(false)
      return
    }
    const check = () => {
      const now = new Date()
      const [h, m] = profile.reminderTime.split(':').map(Number)
      const past = now.getHours() * 60 + now.getMinutes() >= h * 60 + m
      const isDue = past && !loggedToday
      setDue(isDue)
      if (!isDue) return
      const key = dateKey(now)
      if (localStorage.getItem(NOTIFIED_KEY) === key) return
      localStorage.setItem(NOTIFIED_KEY, key)
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Sage', {
          body: `Hey ${profile.name}, take 10 seconds to log today's spends.`,
          icon: '/icon.svg',
          tag: 'sage-daily',
        })
      }
    }
    check()
    const id = setInterval(check, 60_000)
    return () => clearInterval(id)
  }, [profile?.reminderEnabled, profile?.reminderTime, profile?.name, loggedToday])

  return due
}
