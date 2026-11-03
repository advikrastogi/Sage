'use client'

import { useState } from 'react'
import { dateKey } from '@/lib/finance'
import { actions } from '@/lib/store'
import type { Category } from '@/lib/types'
import { cn } from '@/lib/utils'
import { CategoryIcon } from './category-icon'
import { PrimaryButton } from './onboarding'
import { Sheet } from './sheet'

export function AddExpenseSheet({
  open,
  onClose,
  categories,
  currency,
}: {
  open: boolean
  onClose: () => void
  categories: Category[]
  currency: string
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Log a spend">
      {open && <ExpenseForm categories={categories} currency={currency} onDone={onClose} />}
    </Sheet>
  )
}

function ExpenseForm({
  categories,
  currency,
  onDone,
}: {
  categories: Category[]
  currency: string
  onDone: () => void
}) {
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(dateKey(new Date()))
  const value = Number(amount)
  const valid = value > 0 && value < 1e8 && categoryId

  const symbol =
    new Intl.NumberFormat(undefined, { style: 'currency', currency })
      .formatToParts(0)
      .find((p) => p.type === 'currency')?.value ?? '$'

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!valid) return
        actions.addExpense({
          amount: Math.round(value * 100) / 100,
          categoryId,
          note: note.trim().slice(0, 80),
          date,
        })
        onDone()
      }}
    >
      <label htmlFor="amount" className="sr-only">
        Amount
      </label>
      <div className="flex items-baseline justify-center gap-1 rounded-3xl bg-muted py-6">
        <span className="font-serif text-3xl text-muted-foreground">{symbol}</span>
        <input
          id="amount"
          data-autofocus
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-44 bg-transparent text-center font-serif text-6xl tabular-nums outline-none placeholder:text-muted-foreground/40"
        />
      </div>

      {(['need', 'want'] as const).map((kind) => {
        const list = categories.filter((c) => c.kind === kind)
        if (!list.length) return null
        return (
          <fieldset key={kind} className="mt-5">
            <legend className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {kind === 'need' ? 'Needs' : 'Wants'}
            </legend>
            <div className="flex flex-wrap gap-2">
              {list.map((c) => {
                const active = c.id === categoryId
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setCategoryId(c.id)}
                    className={cn(
                      'flex items-center gap-2 rounded-2xl border py-1.5 pl-1.5 pr-3 text-sm transition active:scale-95',
                      active
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <CategoryIcon icon={c.icon} tone={c.tone} size="sm" />
                    {c.name}
                  </button>
                )
              })}
            </div>
          </fieldset>
        )
      })}

      <div className="mt-5 grid grid-cols-[1fr_auto] gap-2">
        <label className="sr-only" htmlFor="note">
          Note
        </label>
        <input
          id="note"
          value={note}
          maxLength={80}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What was it? (optional)"
          className="h-12 rounded-2xl border border-input bg-background px-4 text-sm outline-none focus:border-ring"
        />
        <label className="sr-only" htmlFor="date">
          Date
        </label>
        <input
          id="date"
          type="date"
          value={date}
          max={dateKey(new Date())}
          onChange={(e) => setDate(e.target.value)}
          className="h-12 rounded-2xl border border-input bg-background px-3 text-sm outline-none focus:border-ring"
        />
      </div>

      <PrimaryButton type="submit" disabled={!valid} className="mt-6 w-full">
        Save spend
      </PrimaryButton>
    </form>
  )
}
