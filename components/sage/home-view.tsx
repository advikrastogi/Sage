'use client'

import { BellRing, Leaf, Trash2, TrendingUp } from 'lucide-react'
import { dateKey, forecast, inMonth, kindTotals, makeMoney, monthInfo, parseKey, total } from '@/lib/finance'
import { actions } from '@/lib/store'
import type { AppState } from '@/lib/types'
import { CategoryIcon } from './category-icon'
import { Bar, ProgressRing } from './progress-ring'

function greeting(h: number) {
  if (h < 5) return 'Still up'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export function HomeView({ state, reminderDue, onAdd }: { state: AppState; reminderDue: boolean; onAdd: () => void }) {
  const profile = state.profile!
  const money = makeMoney(profile.currency)
  const now = new Date()
  const today = dateKey(now)
  const info = monthInfo(now)
  const month = inMonth(state.expenses, info.key)
  const { spent: spentMonth, projected, variable } = forecast(state.expenses, profile.monthlyLimit, now)
  const todayList = month.filter((e) => e.date === today)
  const spentToday = total(todayList)
  const variableToday = variable(todayList)
  const dailyBudget = Math.max(0, (profile.monthlyLimit - (spentMonth - variableToday)) / info.daysLeft)
  const safeToday = dailyBudget - variableToday
  const { need, want } = kindTotals(month, state.categories)
  const needShare = spentMonth ? need / spentMonth : 0
  const noSpendToday = state.noSpendDays.includes(today)
  const catMap = new Map(state.categories.map((c) => [c.id, c]))

  const recent = state.expenses
    .filter((e) => now.getTime() - parseKey(e.date).getTime() < 7 * 864e5)
    .sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : b.date.localeCompare(a.date)))
  const grouped = new Map<string, typeof recent>()
  for (const e of recent) grouped.set(e.date, [...(grouped.get(e.date) ?? []), e])

  const dayLabel = (key: string) => {
    if (key === today) return 'Today'
    const y = new Date(now)
    y.setDate(y.getDate() - 1)
    if (key === dateKey(y)) return 'Yesterday'
    return parseKey(key).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="animate-rise">
        <p className="text-sm text-muted-foreground">
          {now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1 className="mt-1 font-serif text-4xl leading-tight sm:text-5xl">
          {greeting(now.getHours())}, <em className="text-primary">{profile.name}</em>
        </h1>
      </header>

      {reminderDue && (
        <div className="flex items-center gap-3 rounded-3xl border border-accent bg-accent/40 p-4 text-accent-foreground animate-rise">
          <BellRing className="size-5 shrink-0" aria-hidden="true" />
          <p className="flex-1 text-sm leading-relaxed">Nothing logged today yet. A quick entry keeps your stats honest.</p>
          <button onClick={onAdd} className="rounded-full bg-foreground/90 px-4 py-2 text-xs font-medium text-background">
            Log now
          </button>
        </div>
      )}

      <section
        aria-label="Today"
        className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-6 animate-rise sm:p-7"
        style={{ animationDelay: '80ms' }}
      >
        <div aria-hidden="true" className="absolute -right-16 -top-16 size-56 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative flex items-center gap-6">
          <ProgressRing value={dailyBudget ? variableToday / dailyBudget : variableToday > 0 ? 2 : 0}>
            <span className="text-xs text-muted-foreground">spent</span>
            <span className="font-serif text-2xl tabular-nums">{money(variableToday, { round: true })}</span>
            {spentToday > variableToday && (
              <span className="text-[10px] text-muted-foreground">
                +{money(spentToday - variableToday, { round: true })} fixed
              </span>
            )}
          </ProgressRing>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{safeToday >= 0 ? 'Safe to spend today' : 'Over today by'}</p>
            <p
              className={`font-serif text-5xl leading-none tabular-nums ${safeToday < 0 ? 'text-destructive' : ''}`}
            >
              {money(Math.abs(safeToday), { round: true })}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Daily budget {money(dailyBudget, { round: true })} &middot; adjusts to what you&apos;ve spent so far
            </p>
          </div>
        </div>
        <div className="relative mt-6">
          <div className="mb-2 flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">{info.label}</span>
            <span className="tabular-nums">
              <span className="font-medium">{money(spentMonth, { round: true })}</span>
              <span className="text-muted-foreground"> / {money(profile.monthlyLimit, { round: true })}</span>
            </span>
          </div>
          <Bar value={spentMonth / profile.monthlyLimit} />
          <p className="mt-2 text-xs text-muted-foreground">
            {info.daysLeft} {info.daysLeft === 1 ? 'day' : 'days'} left &middot;{' '}
            {money(Math.max(0, profile.monthlyLimit - spentMonth), { round: true })} remaining
          </p>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 animate-rise sm:grid-cols-3" style={{ animationDelay: '160ms' }}>
        <MiniStat
          icon={<TrendingUp className="size-4" />}
          label="Month-end forecast"
          value={money(projected, { round: true })}
          hint={projected > profile.monthlyLimit ? 'Above limit' : 'Within limit'}
          warn={projected > profile.monthlyLimit}
        />
        <MiniStat
          icon={<Leaf className="size-4" />}
          label="Yearly pace"
          value={money(projected * 12, { round: true })}
          hint={`vs ${money(profile.monthlyLimit * 12, { round: true })} plan`}
        />
        <div className="col-span-2 rounded-3xl border border-border bg-card p-4 sm:col-span-1">
          <p className="text-xs text-muted-foreground">Needs vs wants</p>
          <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-muted">
            <div className="bg-need transition-all duration-700" style={{ width: `${needShare * 100}%` }} />
            <div className="bg-want transition-all duration-700" style={{ width: `${spentMonth ? (1 - needShare) * 100 : 0}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-xs tabular-nums">
            <span>
              <span className="mr-1 inline-block size-2 rounded-full bg-need" />
              {money(need, { round: true })}
            </span>
            <span>
              <span className="mr-1 inline-block size-2 rounded-full bg-want" />
              {money(want, { round: true })}
            </span>
          </div>
        </div>
      </div>

      <section aria-labelledby="recent" className="animate-rise" style={{ animationDelay: '240ms' }}>
        <div className="mb-3 flex items-center justify-between">
          <h2 id="recent" className="font-serif text-2xl">
            This week
          </h2>
          {!grouped.has(today) && !noSpendToday && (
            <button
              onClick={() => actions.markNoSpend()}
              className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground"
            >
              Nothing spent today
            </button>
          )}
        </div>

        {noSpendToday && !grouped.has(today) && (
          <p className="mb-3 rounded-3xl bg-secondary p-4 text-sm text-secondary-foreground">
            A no-spend day. That&apos;s {money(dailyBudget, { round: true })} quietly saved.
          </p>
        )}

        {grouped.size === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">No spends logged this week.</p>
            <button onClick={onAdd} className="mt-3 text-sm font-medium text-primary">
              Log your first spend
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {[...grouped].map(([day, list]) => (
              <div key={day}>
                <div className="mb-1.5 flex justify-between px-1 text-xs text-muted-foreground">
                  <span>{dayLabel(day)}</span>
                  <span className="tabular-nums">{money(total(list))}</span>
                </div>
                <ul className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">
                  {list.map((e) => {
                    const c = catMap.get(e.categoryId)
                    return (
                      <li key={e.id} className="group flex items-center gap-3 px-3 py-2.5">
                        {c && <CategoryIcon icon={c.icon} tone={c.tone} />}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{e.note || c?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {c?.name} &middot; {c?.kind === 'want' ? 'Want' : 'Need'}
                          </p>
                        </div>
                        <span className="text-sm font-medium tabular-nums">-{money(e.amount)}</span>
                        <button
                          onClick={() => actions.deleteExpense(e.id)}
                          className="rounded-full p-2 text-muted-foreground opacity-60 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                        >
                          <Trash2 className="size-4" />
                          <span className="sr-only">Delete</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function MiniStat({
  icon,
  label,
  value,
  hint,
  warn,
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint: string
  warn?: boolean
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-4">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-2 font-serif text-2xl tabular-nums">{value}</p>
      <p className={`mt-0.5 text-xs ${warn ? 'text-destructive' : 'text-muted-foreground'}`}>{hint}</p>
    </div>
  )
}
