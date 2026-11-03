import type { AppState, Category, Expense, Profile } from '@/lib/types'
import { createClient } from './client'

export type ProfileRow = {
  id: string
  name: string
  currency: string
  monthly_limit: number | string
  reminder_enabled: boolean
  reminder_time: string
}

export type CategoryRow = {
  id: string
  user_id: string
  name: string
  kind: Category['kind']
  allocation: number | string
  tone: Category['tone']
  icon: Category['icon']
}

export type ExpenseRow = {
  id: string
  user_id: string
  category_id: string
  amount: number | string
  note: string
  date: string
  created_at: string
}

export type NoSpendRow = { user_id: string; day: string }

function num(v: number | string) {
  return typeof v === 'number' ? v : Number(v)
}

function profilePayload(userId: string, profile: Profile) {
  return {
    id: userId,
    name: profile.name,
    currency: profile.currency,
    monthly_limit: profile.monthlyLimit,
    reminder_enabled: profile.reminderEnabled,
    reminder_time: profile.reminderTime,
  }
}

function categoryPayload(userId: string, cat: Category) {
  return {
    id: cat.id,
    user_id: userId,
    name: cat.name,
    kind: cat.kind,
    allocation: cat.allocation,
    tone: cat.tone,
    icon: cat.icon,
  }
}

function expensePayload(userId: string, e: Expense) {
  return {
    id: e.id,
    user_id: userId,
    category_id: e.categoryId,
    amount: e.amount,
    note: e.note,
    date: e.date,
    created_at: new Date(e.createdAt).toISOString(),
  }
}

export function mapState(
  profile: ProfileRow | null,
  categories: CategoryRow[],
  expenses: ExpenseRow[],
  days: NoSpendRow[],
): AppState {
  return {
    profile: profile
      ? {
          name: profile.name,
          currency: profile.currency,
          monthlyLimit: num(profile.monthly_limit),
          reminderEnabled: profile.reminder_enabled,
          reminderTime: profile.reminder_time,
        }
      : null,
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      kind: c.kind,
      allocation: num(c.allocation),
      tone: c.tone,
      icon: c.icon,
    })),
    expenses: expenses.map((e) => ({
      id: e.id,
      amount: num(e.amount),
      categoryId: e.category_id,
      note: e.note,
      date: e.date,
      createdAt: new Date(e.created_at).getTime(),
    })),
    noSpendDays: days.map((d) => d.day),
  }
}

export async function loadState(userId: string): Promise<AppState> {
  const sb = createClient()
  const [profileRes, catsRes, expRes, daysRes] = await Promise.all([
    sb.from('profiles').select('*').eq('id', userId).maybeSingle(),
    sb.from('categories').select('*').eq('user_id', userId),
    sb.from('expenses').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    sb.from('no_spend_days').select('user_id, day').eq('user_id', userId),
  ])

  if (profileRes.error) throw profileRes.error
  if (catsRes.error) throw catsRes.error
  if (expRes.error) throw expRes.error
  if (daysRes.error) throw daysRes.error

  return mapState(
    profileRes.data as ProfileRow | null,
    (catsRes.data ?? []) as CategoryRow[],
    (expRes.data ?? []) as ExpenseRow[],
    (daysRes.data ?? []) as NoSpendRow[],
  )
}

export async function persistProfile(userId: string, profile: Profile) {
  const { error } = await createClient().from('profiles').upsert(profilePayload(userId, profile))
  if (error) throw error
}

export async function persistCategory(userId: string, cat: Category) {
  const { error } = await createClient().from('categories').upsert(categoryPayload(userId, cat))
  if (error) throw error
}

export async function persistDeleteCategory(id: string) {
  const { error } = await createClient().from('categories').delete().eq('id', id)
  if (error) throw error
}

export async function persistExpense(userId: string, e: Expense) {
  const sb = createClient()
  const { error } = await sb.from('expenses').insert(expensePayload(userId, e))
  if (error) throw error
  const day = await sb.from('no_spend_days').delete().eq('user_id', userId).eq('day', e.date)
  if (day.error) throw day.error
}

export async function persistDeleteExpense(id: string) {
  const { error } = await createClient().from('expenses').delete().eq('id', id)
  if (error) throw error
}

export async function persistNoSpend(userId: string, day: string) {
  const { error } = await createClient().from('no_spend_days').upsert({ user_id: userId, day })
  if (error) throw error
}

export async function persistReplace(userId: string, next: AppState) {
  const sb = createClient()
  const expenses = await sb.from('expenses').delete().eq('user_id', userId)
  if (expenses.error) throw expenses.error
  const days = await sb.from('no_spend_days').delete().eq('user_id', userId)
  if (days.error) throw days.error
  const cats = await sb.from('categories').delete().eq('user_id', userId)
  if (cats.error) throw cats.error
  const profile = await sb.from('profiles').delete().eq('id', userId)
  if (profile.error) throw profile.error

  if (!next.profile) return

  const p = await sb.from('profiles').insert(profilePayload(userId, next.profile))
  if (p.error) throw p.error
  if (next.categories.length) {
    const c = await sb.from('categories').insert(next.categories.map((cat) => categoryPayload(userId, cat)))
    if (c.error) throw c.error
  }
  if (next.expenses.length) {
    const e = await sb.from('expenses').insert(next.expenses.map((exp) => expensePayload(userId, exp)))
    if (e.error) throw e.error
  }
  if (next.noSpendDays.length) {
    const d = await sb.from('no_spend_days').insert(next.noSpendDays.map((day) => ({ user_id: userId, day })))
    if (d.error) throw d.error
  }
}
