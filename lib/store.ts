'use client'

import type { User } from '@supabase/supabase-js'
import { useSyncExternalStore } from 'react'
import { dateKey } from './finance'
import { createClient } from './supabase/client'
import { isSupabaseConfigured } from './supabase/env'
import {
  loadState,
  persistCategory,
  persistDeleteCategory,
  persistDeleteExpense,
  persistExpense,
  persistNoSpend,
  persistProfile,
  persistReplace,
} from './supabase/persist'
import type { AppState, Category, Expense, Profile } from './types'

const LEGACY_KEY = 'sage-budget-v1'
const EMPTY: AppState = { profile: null, categories: [], expenses: [], noSpendDays: [] }

export type SessionSnapshot = {
  ready: boolean
  user: User | null
}

type Snapshot = SessionSnapshot & { state: AppState | null }

const SERVER_SESSION: SessionSnapshot = { ready: false, user: null }
let snapshot: Snapshot = { ready: false, user: null, state: null }
let sessionSnap: SessionSnapshot = SERVER_SESSION
let started = false
let loadGen = 0
const listeners = new Set<() => void>()

function emit() {
  if (sessionSnap.ready !== snapshot.ready || sessionSnap.user !== snapshot.user) {
    sessionSnap = { ready: snapshot.ready, user: snapshot.user }
  }
  listeners.forEach((l) => l())
}

function persist(label: string, work: () => Promise<void>) {
  work().catch((err) => console.error(`[sage] ${label}`, err))
}

function readLegacy(): AppState | null {
  try {
    const raw = window.localStorage.getItem(LEGACY_KEY)
    if (!raw) return null
    const parsed = { ...EMPTY, ...JSON.parse(raw) } as AppState
    return parsed.profile ? parsed : null
  } catch {
    return null
  }
}

function clearLegacy() {
  try {
    window.localStorage.removeItem(LEGACY_KEY)
  } catch {}
}

const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

function commit(next: AppState) {
  snapshot = { ...snapshot, state: next }
  emit()
}

async function hydrate(user: User) {
  const gen = ++loadGen
  snapshot = { ready: true, user, state: null }
  emit()

  let state: AppState = EMPTY
  try {
    state = await loadState(user.id)
    if (!state.profile) {
      const legacy = readLegacy()
      if (legacy) {
        await persistReplace(user.id, legacy)
        clearLegacy()
        state = legacy
      }
    } else {
      clearLegacy()
    }
  } catch (err) {
    console.error('[sage] load', err)
  }

  if (gen !== loadGen || snapshot.user?.id !== user.id) return
  snapshot = { ready: true, user, state }
  emit()
}

function applyUser(user: User | null) {
  if (!user) {
    loadGen += 1
    snapshot = { ready: true, user: null, state: null }
    emit()
    return
  }
  if (snapshot.user?.id === user.id && snapshot.state) return
  void hydrate(user)
}

function start() {
  if (started || typeof window === 'undefined') return
  started = true

  if (!isSupabaseConfigured()) {
    snapshot = { ready: true, user: null, state: null }
    emit()
    return
  }

  const supabase = createClient()
  void supabase.auth.getSession().then(({ data }) => applyUser(data.session?.user ?? null))
  supabase.auth.onAuthStateChange((_event, session) => applyUser(session?.user ?? null))
}

function subscribe(listener: () => void) {
  start()
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useSession(): SessionSnapshot {
  return useSyncExternalStore(
    subscribe,
    () => sessionSnap,
    () => SERVER_SESSION,
  )
}

export function useAppState(): AppState | null {
  return useSyncExternalStore(
    subscribe,
    () => snapshot.state,
    () => null,
  )
}

function requireUser() {
  return snapshot.user
}

export const actions = {
  setup(profile: Profile, categories: Omit<Category, 'id'>[]) {
    const user = requireUser()
    if (!user) return
    const next: AppState = {
      ...EMPTY,
      profile,
      categories: categories.map((c) => ({ ...c, id: uid() })),
    }
    commit(next)
    persist('setup', () => persistReplace(user.id, next))
  },
  updateProfile(patch: Partial<Profile>) {
    const user = requireUser()
    const state = snapshot.state
    if (!user || !state?.profile) return
    const profile = { ...state.profile, ...patch }
    commit({ ...state, profile })
    persist('updateProfile', () => persistProfile(user.id, profile))
  },
  saveCategory(cat: Omit<Category, 'id'> & { id?: string }) {
    const user = requireUser()
    const state = snapshot.state
    if (!user || !state) return
    const exists = cat.id && state.categories.some((c) => c.id === cat.id)
    const saved: Category = exists
      ? ({ ...state.categories.find((c) => c.id === cat.id)!, ...cat } as Category)
      : { ...cat, id: cat.id ?? uid() }
    commit({
      ...state,
      categories: exists
        ? state.categories.map((c) => (c.id === saved.id ? saved : c))
        : [...state.categories, saved],
    })
    persist('saveCategory', () => persistCategory(user.id, saved))
  },
  deleteCategory(id: string) {
    const user = requireUser()
    const state = snapshot.state
    if (!user || !state) return
    commit({
      ...state,
      categories: state.categories.filter((c) => c.id !== id),
      expenses: state.expenses.filter((e) => e.categoryId !== id),
    })
    persist('deleteCategory', () => persistDeleteCategory(id))
  },
  addExpense(e: Omit<Expense, 'id' | 'createdAt'>) {
    const user = requireUser()
    const state = snapshot.state
    if (!user || !state) return
    const expense: Expense = { ...e, id: uid(), createdAt: Date.now() }
    commit({
      ...state,
      expenses: [expense, ...state.expenses],
      noSpendDays: state.noSpendDays.filter((d) => d !== e.date),
    })
    persist('addExpense', () => persistExpense(user.id, expense))
  },
  deleteExpense(id: string) {
    const user = requireUser()
    const state = snapshot.state
    if (!user || !state) return
    commit({ ...state, expenses: state.expenses.filter((e) => e.id !== id) })
    persist('deleteExpense', () => persistDeleteExpense(id))
  },
  markNoSpend(day = dateKey(new Date())) {
    const user = requireUser()
    const state = snapshot.state
    if (!user || !state) return
    if (state.noSpendDays.includes(day)) return
    commit({ ...state, noSpendDays: [...state.noSpendDays, day] })
    persist('markNoSpend', () => persistNoSpend(user.id, day))
  },
  replace(next: AppState) {
    const user = requireUser()
    if (!user) return
    commit(next)
    persist('replace', () => persistReplace(user.id, next))
  },
  reset() {
    const user = requireUser()
    if (!user) return
    commit(EMPTY)
    persist('reset', () => persistReplace(user.id, EMPTY))
  },
  async signOut() {
    if (!isSupabaseConfigured()) return
    await createClient().auth.signOut()
  },
}
