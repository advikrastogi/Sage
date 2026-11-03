'use client'

import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { useMemo, useState } from 'react'
import { makeMoney } from '@/lib/finance'
import { CURRENCIES, PRESETS, buildSample } from '@/lib/presets'
import { actions } from '@/lib/store'
import { cn } from '@/lib/utils'
import { CategoryIcon } from './category-icon'
import { Aura, Logo } from './splash'

export function Onboarding() {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [limit, setLimit] = useState(2500)
  const [picked, setPicked] = useState<Record<string, number>>(() =>
    Object.fromEntries(PRESETS.map((p) => [p.key, Math.round(2500 * p.share)])),
  )
  const money = useMemo(() => makeMoney(currency), [currency])
  const allocated = Object.values(picked).reduce((s, v) => s + v, 0)
  const left = limit - allocated

  const setLimitAndRescale = (v: number) => {
    setLimit(v)
    setPicked((prev) =>
      Object.fromEntries(
        Object.keys(prev).map((k) => [k, Math.round(v * (PRESETS.find((p) => p.key === k)?.share ?? 0))]),
      ),
    )
  }

  const toggle = (key: string) =>
    setPicked((prev) => {
      const next = { ...prev }
      if (key in next) delete next[key]
      else next[key] = Math.round(limit * (PRESETS.find((p) => p.key === key)?.share ?? 0))
      return next
    })

  const finish = () => {
    actions.setup(
      { name: name.trim() || 'Friend', currency, monthlyLimit: limit, reminderEnabled: true, reminderTime: '20:30' },
      PRESETS.filter((p) => p.key in picked).map((p) => ({
        name: p.name,
        kind: p.kind,
        tone: p.tone,
        icon: p.icon,
        allocation: picked[p.key],
      })),
    )
  }

  const steps = ['You', 'Limit', 'Plan']

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5 py-10">
      <Aura />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo />
            <span className="font-serif text-2xl">Sage</span>
          </div>
          <ol className="flex items-center gap-1.5" aria-label="Setup progress">
            {steps.map((s, i) => (
              <li
                key={s}
                aria-current={i === step ? 'step' : undefined}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-500',
                  i === step ? 'w-8 bg-primary' : i < step ? 'w-3 bg-primary/60' : 'w-3 bg-border',
                )}
              >
                <span className="sr-only">{s}</span>
              </li>
            ))}
          </ol>
        </div>

        <div key={step} className="rounded-[2rem] border border-border bg-card/80 p-6 shadow-xl shadow-primary/5 backdrop-blur-xl animate-rise sm:p-8">
          {step === 0 && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                setStep(1)
              }}
            >
              <p className="text-sm text-muted-foreground">Welcome</p>
              <h1 className="mt-1 text-balance font-serif text-4xl leading-tight">
                Let&apos;s make money feel <em className="text-primary">calmer.</em>
              </h1>
              <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
                Set a limit, split it between needs and wants, and log as you go. Sage does the maths and nudges
                you gently.
              </p>
              <label htmlFor="name" className="mt-8 block text-sm font-medium">
                What should we call you?
              </label>
              <input
                id="name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your first name"
                autoComplete="given-name"
                className="mt-2 h-12 w-full rounded-2xl border border-input bg-background px-4 outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/15"
              />
              <PrimaryButton type="submit" className="mt-6 w-full">
                Continue <ArrowRight className="size-4" />
              </PrimaryButton>
              <button
                type="button"
                onClick={() => actions.replace(buildSample(name.trim() || 'Ava', currency))}
                className="mt-3 w-full rounded-2xl py-3 text-sm text-muted-foreground transition hover:text-foreground"
              >
                Just exploring? Try it with sample data
              </button>
            </form>
          )}

          {step === 1 && (
            <div>
              <p className="text-sm text-muted-foreground">Step 2 of 3</p>
              <h2 className="mt-1 font-serif text-4xl leading-tight">Your monthly limit</h2>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                The most you want to spend in a month. You can change it anytime.
              </p>
              <div className="mt-6 flex gap-2">
                <label className="sr-only" htmlFor="currency">
                  Currency
                </label>
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="h-14 rounded-2xl border border-input bg-background px-3 text-sm outline-none focus:border-ring"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <label className="sr-only" htmlFor="limit">
                  Monthly limit
                </label>
                <input
                  id="limit"
                  type="number"
                  inputMode="decimal"
                  min={1}
                  value={limit || ''}
                  onChange={(e) => setLimitAndRescale(Number(e.target.value))}
                  className="h-14 min-w-0 flex-1 rounded-2xl border border-input bg-background px-4 font-serif text-3xl tabular-nums outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/15"
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Stat label="Per day" value={money(limit / 30, { round: true })} />
                <Stat label="Per year" value={money(limit * 12, { round: true })} />
              </div>
              <Nav onBack={() => setStep(0)} onNext={() => setStep(2)} disabled={limit <= 0} />
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="text-sm text-muted-foreground">Step 3 of 3</p>
              <h2 className="mt-1 font-serif text-4xl leading-tight">Plan your spending</h2>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                Pick your categories and how much each gets. Whatever is left over becomes savings.
              </p>
              <div
                className={cn(
                  'mt-5 flex items-center justify-between rounded-2xl px-4 py-3 text-sm',
                  left < 0 ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-secondary-foreground',
                )}
              >
                <span>{left < 0 ? 'Over your limit by' : 'Left for savings'}</span>
                <span className="font-semibold tabular-nums">{money(Math.abs(left), { round: true })}</span>
              </div>
              {(['need', 'want'] as const).map((kind) => (
                <fieldset key={kind} className="mt-5">
                  <legend className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    {kind === 'need' ? 'Needs' : 'Wants'}
                  </legend>
                  <ul className="flex flex-col gap-2">
                    {PRESETS.filter((p) => p.kind === kind).map((p) => {
                      const on = p.key in picked
                      return (
                        <li
                          key={p.key}
                          className={cn(
                            'flex items-center gap-3 rounded-2xl border p-2 pr-3 transition',
                            on ? 'border-border bg-background' : 'border-transparent opacity-55',
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => toggle(p.key)}
                            aria-pressed={on}
                            className="flex min-w-0 flex-1 items-center gap-3 text-left"
                          >
                            <CategoryIcon icon={p.icon} tone={p.tone} />
                            <span className="truncate text-sm font-medium">{p.name}</span>
                            {on && <Check className="ml-auto size-4 shrink-0 text-primary" aria-hidden="true" />}
                          </button>
                          {on && (
                            <input
                              type="number"
                              inputMode="decimal"
                              aria-label={`${p.name} monthly allocation`}
                              value={picked[p.key] || ''}
                              onChange={(e) => setPicked((prev) => ({ ...prev, [p.key]: Number(e.target.value) }))}
                              className="h-9 w-20 rounded-xl bg-muted px-2 text-right text-sm tabular-nums outline-none focus:ring-2 focus:ring-ring/30"
                            />
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </fieldset>
              ))}
              <Nav
                onBack={() => setStep(1)}
                onNext={finish}
                nextLabel="Start tracking"
                disabled={Object.keys(picked).length === 0}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-medium tabular-nums">{value}</p>
    </div>
  )
}

function Nav({
  onBack,
  onNext,
  nextLabel = 'Continue',
  disabled,
}: {
  onBack: () => void
  onNext: () => void
  nextLabel?: string
  disabled?: boolean
}) {
  return (
    <div className="mt-8 flex gap-2">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        <span className="sr-only">Back</span>
      </button>
      <PrimaryButton type="button" onClick={onNext} disabled={disabled} className="flex-1">
        {nextLabel} <ArrowRight className="size-4" />
      </PrimaryButton>
    </div>
  )
}

export function PrimaryButton({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        'inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition hover:brightness-105 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
    />
  )
}
