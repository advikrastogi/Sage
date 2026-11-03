import type { AppState, Category, Expense } from './types'

export const pad = (n: number) => String(n).padStart(2, '0')

export const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const parseKey = (key: string) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function monthInfo(ref = new Date()) {
  const y = ref.getFullYear()
  const m = ref.getMonth()
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const prev = new Date(y, m - 1, 1)
  return {
    key: `${y}-${pad(m + 1)}`,
    label: ref.toLocaleDateString(undefined, { month: 'long' }),
    day: ref.getDate(),
    daysInMonth,
    daysLeft: daysInMonth - ref.getDate() + 1,
    prevKey: `${prev.getFullYear()}-${pad(prev.getMonth() + 1)}`,
    prevLabel: prev.toLocaleDateString(undefined, { month: 'long' }),
    prevDays: new Date(prev.getFullYear(), prev.getMonth() + 1, 0).getDate(),
  }
}

export const total = (list: Expense[]) => list.reduce((s, e) => s + e.amount, 0)

export const inMonth = (list: Expense[], monthKey: string, uptoDay?: number) =>
  list.filter(
    (e) => e.date.startsWith(monthKey) && (uptoDay === undefined || Number(e.date.slice(8)) <= uptoDay),
  )

export function byCategory(list: Expense[]) {
  const map: Record<string, number> = {}
  for (const e of list) map[e.categoryId] = (map[e.categoryId] ?? 0) + e.amount
  return map
}

export function kindTotals(list: Expense[], categories: Category[]) {
  const kinds = new Map(categories.map((c) => [c.id, c.kind]))
  let need = 0
  let want = 0
  for (const e of list) {
    if (kinds.get(e.categoryId) === 'want') want += e.amount
    else need += e.amount
  }
  return { need, want }
}

export function makeMoney(currency: string) {
  const full = new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 })
  const round = new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 })
  return (n: number, opts?: { round?: boolean }) =>
    opts?.round || Math.abs(n) >= 1000 ? round.format(n) : full.format(n)
}

export function cumulativeSeries(list: Expense[], monthKey: string, days: number, upto?: number) {
  const perDay = new Array(days).fill(0)
  for (const e of inMonth(list, monthKey)) perDay[Number(e.date.slice(8)) - 1] += e.amount
  let running = 0
  return perDay.map((v, i) => {
    running += v
    return upto !== undefined && i + 1 > upto ? undefined : Math.round(running)
  })
}

/** Large single payments (rent, annual subs) shouldn't be extrapolated as if they repeat daily. */
export const isFixed = (e: Expense, monthlyLimit: number) => e.amount >= monthlyLimit * 0.15

export function forecast(expenses: Expense[], monthlyLimit: number, now = new Date()) {
  const info = monthInfo(now)
  const today = dateKey(now)
  const month = inMonth(expenses, info.key)
  const spent = total(month)
  const windowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30)
  const first = expenses.reduce<string | null>((m, e) => (!m || e.date < m ? e.date : m), null)
  const start = first && parseKey(first) > windowStart ? parseKey(first) : windowStart
  const days = Math.max(1, Math.round((parseKey(today).getTime() - start.getTime()) / 864e5) + 1)
  const recentVariable = expenses.filter(
    (e) => parseKey(e.date) >= start && e.date <= today && !isFixed(e, monthlyLimit),
  )
  const dailyPace = total(recentVariable) / days
  const projected = spent + dailyPace * (info.daysLeft - 1)
  const variable = (list: Expense[]) => total(list.filter((e) => !isFixed(e, monthlyLimit)))
  return { spent, dailyPace, projected, variable }
}

export type Suggestion = {
  id: string
  tone: 'warn' | 'tip' | 'good'
  title: string
  body: string
  saving?: number
}

export function getSuggestions(state: AppState, now = new Date()): Suggestion[] {
  const { profile, categories, expenses } = state
  if (!profile) return []
  const money = makeMoney(profile.currency)
  const info = monthInfo(now)
  const month = inMonth(expenses, info.key)
  const lastSame = inMonth(expenses, info.prevKey, info.day)
  const spent = total(month)
  const pace = info.day / info.daysInMonth
  const out: Suggestion[] = []
  const thisBy = byCategory(month)
  const lastBy = byCategory(lastSame)

  for (const c of categories) {
    const s = thisBy[c.id] ?? 0
    if (!c.allocation || s === 0) continue
    const catMonth = month.filter((e) => e.categoryId === c.id)
    const fixed = total(catMonth.filter((e) => isFixed(e, profile.monthlyLimit)))
    const projected = fixed + (s - fixed) / pace
    if (projected > c.allocation * 1.05 && info.day >= 3) {
      const over = projected - c.allocation
      const weeksLeft = Math.max(1, info.daysLeft / 7)
      out.push({
        id: `pace-${c.id}`,
        tone: 'warn',
        title: `${c.name} is running hot`,
        body: `At this pace you'll spend ${money(projected, { round: true })} against a ${money(c.allocation, { round: true })} plan. Trimming ${money(over / weeksLeft, { round: true })} a week keeps you on track.`,
        saving: over,
      })
    }
  }

  for (const c of categories) {
    const now_ = thisBy[c.id] ?? 0
    const then = lastBy[c.id] ?? 0
    if (then > 20 && now_ > then * 1.25) {
      out.push({
        id: `mom-${c.id}`,
        tone: 'tip',
        title: `${c.name} is up ${Math.round((now_ / then - 1) * 100)}%`,
        body: `You've spent ${money(now_ - then, { round: true })} more on ${c.name.toLowerCase()} than at this point in ${info.prevLabel}.`,
      })
    }
  }

  const recent = expenses.filter((e) => now.getTime() - parseKey(e.date).getTime() < 30 * 864e5)
  const recentBy = new Map<string, Expense[]>()
  for (const e of recent) recentBy.set(e.categoryId, [...(recentBy.get(e.categoryId) ?? []), e])
  for (const [id, list] of recentBy) {
    const avg = total(list) / list.length
    const cat = categories.find((c) => c.id === id)
    if (cat && cat.kind === 'want' && list.length >= 8 && avg < 15) {
      const t = total(list)
      out.push({
        id: `small-${id}`,
        tone: 'tip',
        title: `Little ${cat.name.toLowerCase()} buys add up`,
        body: `${list.length} purchases averaging ${money(avg)} came to ${money(t, { round: true })} in 30 days. Halving them saves about ${money((t / 2) * 12, { round: true })} a year.`,
        saving: t / 2,
      })
    }
  }

  const { need, want } = kindTotals(month, categories)
  if (spent > 0 && want / spent > 0.35) {
    const target = spent * 0.3
    out.push({
      id: 'wants-share',
      tone: 'tip',
      title: `Wants are ${Math.round((want / spent) * 100)}% of spending`,
      body: `A calm ratio is 50/30/20: needs, wants, savings. Bringing wants to 30% would free ${money((want - target) / pace, { round: true })} this month.`,
      saving: (want - target) / pace,
    })
  }

  const weekday: number[] = []
  const weekend: number[] = []
  const perDay = new Map<string, number>()
  for (const e of recent) perDay.set(e.date, (perDay.get(e.date) ?? 0) + e.amount)
  for (const [k, v] of perDay) (([0, 6].includes(parseKey(k).getDay()) ? weekend : weekday) as number[]).push(v)
  const avg = (a: number[]) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0)
  if (weekend.length >= 3 && weekday.length >= 5 && avg(weekend) > avg(weekday) * 1.5) {
    out.push({
      id: 'weekend',
      tone: 'tip',
      title: 'Weekends cost more',
      body: `You average ${money(avg(weekend), { round: true })} on weekend days vs ${money(avg(weekday), { round: true })} on weekdays. Planning one free weekend activity could save ${money((avg(weekend) - avg(weekday)) * 2, { round: true })} a week.`,
    })
  }

  const { projected } = forecast(expenses, profile.monthlyLimit, now)
  if (spent > 0 && projected < profile.monthlyLimit) {
    out.push({
      id: 'on-track',
      tone: 'good',
      title: 'You are on track',
      body: `Projected ${info.label} spending is ${money(projected, { round: true })}, leaving about ${money(profile.monthlyLimit - projected, { round: true })} to save. ${need > 0 ? 'Consider moving it to savings on payday.' : ''}`,
    })
  }

  if (out.length === 0) {
    out.push({
      id: 'empty',
      tone: 'good',
      title: 'Keep logging',
      body: 'A few more days of entries and Sage will spot patterns and places to save.',
    })
  }
  return out
}
