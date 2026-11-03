'use client'

import { AlertCircle, ArrowDownRight, ArrowUpRight, Lightbulb, Sparkle } from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  byCategory,
  cumulativeSeries,
  getSuggestions,
  inMonth,
  kindTotals,
  makeMoney,
  monthInfo,
  total,
} from '@/lib/finance'
import type { AppState } from '@/lib/types'
import { cn } from '@/lib/utils'

const tooltipStyle = {
  background: 'var(--popover)',
  border: '1px solid var(--border)',
  borderRadius: 16,
  color: 'var(--popover-foreground)',
  fontSize: 12,
  boxShadow: '0 10px 30px -10px rgb(0 0 0 / 0.2)',
}

export function InsightsView({ state }: { state: AppState }) {
  const profile = state.profile!
  const money = makeMoney(profile.currency)
  const fmt = (v: unknown) => money(Number(v), { round: true })
  const info = monthInfo()
  const thisMonth = inMonth(state.expenses, info.key)
  const lastFull = inMonth(state.expenses, info.prevKey)
  const lastSame = inMonth(state.expenses, info.prevKey, info.day)
  const spent = total(thisMonth)
  const lastSpent = total(lastFull)
  const lastSameSpent = total(lastSame)
  const delta = lastSameSpent ? spent / lastSameSpent - 1 : 0

  const thisBy = byCategory(thisMonth)
  const lastBy = byCategory(lastFull)
  const compare = state.categories
    .map((c) => ({ name: c.name, [info.label]: Math.round(thisBy[c.id] ?? 0), [info.prevLabel]: Math.round(lastBy[c.id] ?? 0) }))
    .filter((d) => Number(d[info.label]) + Number(d[info.prevLabel]) > 0)

  const cur = cumulativeSeries(state.expenses, info.key, info.daysInMonth, info.day)
  const prev = cumulativeSeries(state.expenses, info.prevKey, info.prevDays)
  const trend = Array.from({ length: Math.max(info.daysInMonth, info.prevDays) }, (_, i) => ({
    day: i + 1,
    current: cur[i],
    previous: prev[i],
  }))

  const { need, want } = kindTotals(thisMonth, state.categories)
  const split = [
    { name: 'Needs', value: Math.round(need), color: 'var(--need)' },
    { name: 'Wants', value: Math.round(want), color: 'var(--want)' },
  ]

  const lastKinds = kindTotals(lastFull, state.categories)
  const topLast = state.categories
    .map((c) => ({ c, v: lastBy[c.id] ?? 0 }))
    .sort((a, b) => b.v - a.v)[0]
  const suggestions = getSuggestions(state)

  return (
    <div className="flex flex-col gap-5">
      <header className="animate-rise">
        <p className="text-sm text-muted-foreground">Patterns & predictions</p>
        <h1 className="mt-1 font-serif text-4xl sm:text-5xl">Insights</h1>
      </header>

      <div className="grid grid-cols-2 gap-3 animate-rise" style={{ animationDelay: '80ms' }}>
        <div className="rounded-3xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground">{info.label} so far</p>
          <p className="mt-1 font-serif text-3xl tabular-nums">{money(spent, { round: true })}</p>
          {lastSameSpent > 0 && (
            <p
              className={cn(
                'mt-1 flex items-center gap-1 text-xs',
                delta > 0 ? 'text-destructive' : 'text-primary',
              )}
            >
              {delta > 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
              {Math.abs(Math.round(delta * 100))}% vs same day last month
            </p>
          )}
        </div>
        <div className="rounded-3xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground">{info.prevLabel} total</p>
          <p className="mt-1 font-serif text-3xl tabular-nums">{money(lastSpent, { round: true })}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {lastSpent <= profile.monthlyLimit
              ? `${money(profile.monthlyLimit - lastSpent, { round: true })} under limit`
              : `${money(lastSpent - profile.monthlyLimit, { round: true })} over limit`}
          </p>
        </div>
      </div>

      <Card title="Spending curve" subtitle={`Running total, ${info.label} vs ${info.prevLabel}`} delay={160}>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="g-cur" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} interval={6} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} tickFormatter={fmt} width={64} domain={[0, (max: number) => Math.ceil(Math.max(max, profile.monthlyLimit * 1.08))]} />
              <Tooltip contentStyle={tooltipStyle} formatter={fmt} labelFormatter={(d) => `Day ${d}`} />
              <ReferenceLine y={profile.monthlyLimit} stroke="var(--chart-2)" strokeDasharray="4 4" />
              <Area type="monotone" dataKey="previous" name={info.prevLabel} stroke="var(--muted-foreground)" strokeOpacity={0.5} strokeDasharray="3 3" fill="none" strokeWidth={1.5} />
              <Area type="monotone" dataKey="current" name={info.label} stroke="var(--chart-1)" fill="url(#g-cur)" strokeWidth={2.5} connectNulls={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <ChartLegend
          items={[
            { label: info.label, color: 'var(--chart-1)' },
            { label: info.prevLabel, color: 'var(--muted-foreground)' },
            { label: 'Limit', color: 'var(--chart-2)' },
          ]}
        />
      </Card>

      <section aria-labelledby="ideas" className="animate-rise" style={{ animationDelay: '240ms' }}>
        <h2 id="ideas" className="mb-3 px-1 font-serif text-2xl">
          Where you could save
        </h2>
        <ul className="flex flex-col gap-2">
          {suggestions.map((s) => (
            <li key={s.id} className="flex gap-3 rounded-3xl border border-border bg-card p-4">
              <span
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-2xl',
                  s.tone === 'warn' && 'bg-destructive/10 text-destructive',
                  s.tone === 'tip' && 'bg-accent/60 text-accent-foreground',
                  s.tone === 'good' && 'bg-primary/15 text-primary',
                )}
                aria-hidden="true"
              >
                {s.tone === 'warn' ? <AlertCircle className="size-4" /> : s.tone === 'tip' ? <Lightbulb className="size-4" /> : <Sparkle className="size-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{s.title}</p>
                <p className="mt-0.5 text-pretty text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
              {s.saving ? (
                <span className="self-start whitespace-nowrap rounded-full bg-secondary px-2.5 py-1 text-xs font-medium tabular-nums text-secondary-foreground">
                  ~{money(s.saving, { round: true })}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-5 md:grid-cols-[1fr_1.4fr]">
        <Card title="Needs vs wants" subtitle={info.label} delay={320}>
          <div className="relative h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={split} dataKey="value" innerRadius={56} outerRadius={80} paddingAngle={3} stroke="none" cornerRadius={8}>
                  {split.map((s) => (
                    <Cell key={s.name} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={fmt} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-serif text-3xl tabular-nums">{spent ? Math.round((need / spent) * 100) : 0}%</span>
              <span className="text-xs text-muted-foreground">needs</span>
            </div>
          </div>
          <ChartLegend items={split.map((s) => ({ label: `${s.name} ${money(s.value, { round: true })}`, color: s.color }))} />
        </Card>

        <Card title="By category" subtitle={`${info.label} vs all of ${info.prevLabel}`} delay={400}>
          <div style={{ height: Math.max(180, compare.length * 42) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compare} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }} barGap={2}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={96} tickLine={false} axisLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} formatter={fmt} cursor={{ fill: 'var(--muted)' }} />
                <Bar dataKey={info.label} fill="var(--chart-1)" radius={[0, 6, 6, 0]} barSize={10} />
                <Bar dataKey={info.prevLabel} fill="var(--chart-3)" fillOpacity={0.55} radius={[0, 6, 6, 0]} barSize={10} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ChartLegend
            items={[
              { label: info.label, color: 'var(--chart-1)' },
              { label: info.prevLabel, color: 'var(--chart-3)' },
            ]}
          />
        </Card>
      </div>

      {lastSpent > 0 && (
        <section
          aria-labelledby="wrap"
          className="relative overflow-hidden rounded-[2rem] bg-primary p-6 text-primary-foreground animate-rise"
          style={{ animationDelay: '480ms' }}
        >
          <div aria-hidden="true" className="absolute -right-10 -top-10 size-44 rounded-full bg-primary-foreground/10 blur-xl" />
          <p className="relative text-xs uppercase tracking-widest opacity-80">Month wrapped</p>
          <h2 id="wrap" className="relative mt-1 font-serif text-3xl">
            Your {info.prevLabel} in review
          </h2>
          <dl className="relative mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <WrapStat label="Spent" value={money(lastSpent, { round: true })} />
            <WrapStat
              label={lastSpent <= profile.monthlyLimit ? 'Saved' : 'Over'}
              value={money(Math.abs(profile.monthlyLimit - lastSpent), { round: true })}
            />
            <WrapStat label="Biggest" value={topLast?.v ? topLast.c.name : '—'} />
            <WrapStat
              label="Wants share"
              value={`${lastSpent ? Math.round((lastKinds.want / lastSpent) * 100) : 0}%`}
            />
          </dl>
        </section>
      )}
    </div>
  )
}

function Card({
  title,
  subtitle,
  delay,
  children,
}: {
  title: string
  subtitle: string
  delay: number
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[2rem] border border-border bg-card p-5 animate-rise" style={{ animationDelay: `${delay}ms` }}>
      <h2 className="font-serif text-2xl">{title}</h2>
      <p className="mb-4 text-xs text-muted-foreground">{subtitle}</p>
      {children}
    </section>
  )
}

function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ backgroundColor: i.color }} />
          {i.label}
        </li>
      ))}
    </ul>
  )
}

function WrapStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs opacity-75">{label}</dt>
      <dd className="mt-0.5 truncate font-serif text-2xl">{value}</dd>
    </div>
  )
}
