'use client'

import { Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { byCategory, inMonth, makeMoney, monthInfo, total } from '@/lib/finance'
import { actions } from '@/lib/store'
import type { AppState, Category } from '@/lib/types'
import { CategoryIcon } from './category-icon'
import { CategorySheet } from './category-sheet'
import { Bar } from './progress-ring'

export function BudgetView({ state }: { state: AppState }) {
  const profile = state.profile!
  const money = makeMoney(profile.currency)
  const info = monthInfo()
  const month = inMonth(state.expenses, info.key)
  const spentBy = byCategory(month)
  const [editing, setEditing] = useState<Category | null>(null)
  const [open, setOpen] = useState(false)
  const [limitDraft, setLimitDraft] = useState<string | null>(null)

  const needAlloc = state.categories.filter((c) => c.kind === 'need').reduce((s, c) => s + c.allocation, 0)
  const wantAlloc = state.categories.filter((c) => c.kind === 'want').reduce((s, c) => s + c.allocation, 0)
  const savings = profile.monthlyLimit - needAlloc - wantAlloc
  const pct = (n: number) => `${Math.max(0, (n / profile.monthlyLimit) * 100)}%`

  const openSheet = (c: Category | null) => {
    setEditing(c)
    setOpen(true)
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="animate-rise">
        <p className="text-sm text-muted-foreground">{info.label} plan</p>
        <h1 className="mt-1 font-serif text-4xl sm:text-5xl">Your budget</h1>
      </header>

      <section
        aria-label="Monthly limit"
        className="rounded-[2rem] border border-border bg-card p-6 animate-rise"
        style={{ animationDelay: '80ms' }}
      >
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">Monthly limit</p>
            {limitDraft === null ? (
              <button
                onClick={() => setLimitDraft(String(profile.monthlyLimit))}
                className="group flex items-center gap-2 font-serif text-5xl tabular-nums"
              >
                {money(profile.monthlyLimit, { round: true })}
                <Pencil className="size-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                <span className="sr-only">Edit limit</span>
              </button>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const v = Number(limitDraft)
                  if (v > 0) actions.updateProfile({ monthlyLimit: Math.round(v) })
                  setLimitDraft(null)
                }}
                className="mt-1 flex gap-2"
              >
                <label htmlFor="limit-edit" className="sr-only">
                  Monthly limit
                </label>
                <input
                  id="limit-edit"
                  autoFocus
                  type="number"
                  inputMode="decimal"
                  value={limitDraft}
                  onChange={(e) => setLimitDraft(e.target.value)}
                  className="h-12 w-40 rounded-2xl border border-input bg-background px-3 font-serif text-3xl tabular-nums outline-none focus:border-ring"
                />
                <button className="rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground">Save</button>
              </form>
            )}
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p>{money(profile.monthlyLimit / info.daysInMonth, { round: true })} / day</p>
            <p>{money(profile.monthlyLimit * 12, { round: true })} / year</p>
          </div>
        </div>

        <div className="mt-6 flex h-3 gap-0.5 overflow-hidden rounded-full bg-muted">
          <div className="bg-need animate-grow-x" style={{ width: pct(needAlloc) }} />
          <div className="bg-want animate-grow-x" style={{ width: pct(wantAlloc) }} />
          <div className="bg-save animate-grow-x" style={{ width: pct(savings) }} />
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
          <Legend color="bg-need" label="Needs" value={money(needAlloc, { round: true })} />
          <Legend color="bg-want" label="Wants" value={money(wantAlloc, { round: true })} />
          <Legend
            color="bg-save"
            label={savings < 0 ? 'Over plan' : 'Savings'}
            value={money(Math.abs(savings), { round: true })}
            warn={savings < 0}
          />
        </dl>
      </section>

      {(['need', 'want'] as const).map((kind, idx) => {
        const list = state.categories.filter((c) => c.kind === kind)
        const spent = total(month.filter((e) => list.some((c) => c.id === e.categoryId)))
        return (
          <section
            key={kind}
            aria-labelledby={`h-${kind}`}
            className="animate-rise"
            style={{ animationDelay: `${160 + idx * 80}ms` }}
          >
            <div className="mb-3 flex items-baseline justify-between px-1">
              <h2 id={`h-${kind}`} className="font-serif text-2xl">
                {kind === 'need' ? 'Needs' : 'Wants'}
              </h2>
              <span className="text-xs tabular-nums text-muted-foreground">{money(spent, { round: true })} spent</span>
            </div>
            {list.length === 0 ? (
              <p className="rounded-3xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
                No {kind === 'need' ? 'needs' : 'wants'} yet.
              </p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {list.map((c) => {
                  const s = spentBy[c.id] ?? 0
                  const ratio = c.allocation ? s / c.allocation : s > 0 ? 2 : 0
                  const left = c.allocation - s
                  return (
                    <li key={c.id}>
                      <button
                        onClick={() => openSheet(c)}
                        className="w-full rounded-3xl border border-border bg-card p-4 text-left transition hover:border-ring/50 active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-3">
                          <CategoryIcon icon={c.icon} tone={c.tone} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{c.name}</p>
                            <p className={`text-xs tabular-nums ${left < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                              {left < 0
                                ? `${money(-left, { round: true })} over`
                                : `${money(left, { round: true })} left`}
                            </p>
                          </div>
                          <p className="text-right text-xs tabular-nums text-muted-foreground">
                            <span className="text-sm font-medium text-foreground">{money(s, { round: true })}</span>
                            <br />/ {money(c.allocation, { round: true })}
                          </p>
                        </div>
                        <Bar value={ratio} tone={`var(--tone-${c.tone})`} className="mt-3" />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        )
      })}

      <button
        onClick={() => openSheet(null)}
        className="flex items-center justify-center gap-2 rounded-3xl border border-dashed border-border p-4 text-sm text-muted-foreground transition hover:border-ring/50 hover:text-foreground"
      >
        <Plus className="size-4" /> Add a category
      </button>

      <CategorySheet open={open} onClose={() => setOpen(false)} category={editing} />
    </div>
  )
}

function Legend({ color, label, value, warn }: { color: string; label: string; value: string; warn?: boolean }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className={`size-2 rounded-full ${color}`} />
        {label}
      </dt>
      <dd className={`mt-0.5 font-medium tabular-nums ${warn ? 'text-destructive' : ''}`}>{value}</dd>
    </div>
  )
}
