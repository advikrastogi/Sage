import { dateKey } from './finance'
import type { AppState, Category, Expense } from './types'

export type Preset = Omit<Category, 'id' | 'allocation'> & { share: number; key: string }

export const PRESETS: Preset[] = [
  { key: 'rent', name: 'Rent & home', kind: 'need', share: 0.32, tone: 'sage', icon: 'home' },
  { key: 'groceries', name: 'Groceries', kind: 'need', share: 0.12, tone: 'mint', icon: 'basket' },
  { key: 'transport', name: 'Transport', kind: 'need', share: 0.05, tone: 'sky', icon: 'bus' },
  { key: 'bills', name: 'Bills & utilities', kind: 'need', share: 0.06, tone: 'sand', icon: 'zap' },
  { key: 'health', name: 'Health', kind: 'need', share: 0.03, tone: 'rose', icon: 'health' },
  { key: 'dining', name: 'Dining out', kind: 'want', share: 0.08, tone: 'peach', icon: 'food' },
  { key: 'coffee', name: 'Coffee', kind: 'want', share: 0.02, tone: 'clay', icon: 'coffee' },
  { key: 'shopping', name: 'Shopping', kind: 'want', share: 0.06, tone: 'lavender', icon: 'bag' },
  { key: 'fun', name: 'Entertainment', kind: 'want', share: 0.04, tone: 'sky', icon: 'film' },
]

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'NGN', 'CAD', 'AUD', 'JPY', 'AED', 'ZAR']

function rng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function buildSample(name = 'Friend', currency = 'USD'): AppState {
  const limit = 2500
  const categories: Category[] = PRESETS.map((p) => ({
    id: p.key,
    name: p.name,
    kind: p.kind,
    tone: p.tone,
    icon: p.icon,
    allocation: Math.round(limit * p.share),
  }))
  const r = rng(42)
  const between = (a: number, b: number) => Math.round((a + r() * (b - a)) * 100) / 100
  const expenses: Expense[] = []
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  let n = 0
  const add = (d: Date, categoryId: string, amount: number, note: string) =>
    expenses.push({ id: `s${n++}`, amount, categoryId, note, date: dateKey(d), createdAt: d.getTime() })

  for (let d = new Date(start); d <= now; d.setDate(d.getDate() + 1)) {
    const day = new Date(d)
    const dow = day.getDay()
    const weekend = dow === 0 || dow === 6
    if (day.getDate() === 1) add(day, 'rent', 800, 'Monthly rent')
    if (day.getDate() === 5) add(day, 'bills', between(120, 160), 'Electricity & internet')
    if (r() < 0.3) add(day, 'groceries', between(22, 68), 'Weekly shop')
    if (!weekend && r() < 0.8) add(day, 'transport', between(2.5, 7), 'Metro')
    if (r() < (weekend ? 0.65 : 0.3)) add(day, 'dining', between(14, 48), weekend ? 'Brunch with friends' : 'Lunch')
    if (r() < 0.6) add(day, 'coffee', between(3.5, 6.5), 'Oat latte')
    if (r() < 0.12) add(day, 'shopping', between(18, 90), 'Clothes')
    if (weekend && r() < 0.35) add(day, 'fun', between(12, 40), 'Cinema')
    if (r() < 0.04) add(day, 'health', between(15, 55), 'Pharmacy')
  }

  return {
    profile: { name, currency, monthlyLimit: limit, reminderEnabled: true, reminderTime: '20:30' },
    categories,
    expenses: expenses.reverse(),
    noSpendDays: [],
  }
}
