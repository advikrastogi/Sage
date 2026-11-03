'use client'

import { useState } from 'react'
import { actions } from '@/lib/store'
import type { Category, IconName, Kind, Tone } from '@/lib/types'
import { cn } from '@/lib/utils'
import { CategoryIcon, ICONS, TONES } from './category-icon'
import { PrimaryButton } from './onboarding'
import { Sheet } from './sheet'

export function CategorySheet({
  open,
  onClose,
  category,
}: {
  open: boolean
  onClose: () => void
  category: Category | null
}) {
  return (
    <Sheet open={open} onClose={onClose} title={category ? 'Edit category' : 'New category'}>
      {open && <CategoryForm key={category?.id ?? 'new'} category={category} onDone={onClose} />}
    </Sheet>
  )
}

function CategoryForm({ category, onDone }: { category: Category | null; onDone: () => void }) {
  const [name, setName] = useState(category?.name ?? '')
  const [kind, setKind] = useState<Kind>(category?.kind ?? 'need')
  const [allocation, setAllocation] = useState(String(category?.allocation ?? ''))
  const [tone, setTone] = useState<Tone>(category?.tone ?? 'sage')
  const [icon, setIcon] = useState<IconName>(category?.icon ?? 'sparkles')
  const valid = name.trim().length > 0 && Number(allocation) >= 0

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!valid) return
        actions.saveCategory({
          id: category?.id,
          name: name.trim().slice(0, 32),
          kind,
          allocation: Math.max(0, Math.round(Number(allocation))),
          tone,
          icon,
        })
        onDone()
      }}
      className="flex flex-col gap-5"
    >
      <div className="flex items-center gap-3">
        <CategoryIcon icon={icon} tone={tone} size="lg" />
        <label htmlFor="cat-name" className="sr-only">
          Name
        </label>
        <input
          id="cat-name"
          data-autofocus
          value={name}
          maxLength={32}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category name"
          className="h-12 min-w-0 flex-1 rounded-2xl border border-input bg-background px-4 outline-none focus:border-ring"
        />
      </div>

      <div role="radiogroup" aria-label="Type" className="grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1">
        {(['need', 'want'] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={kind === k}
            onClick={() => setKind(k)}
            className={cn(
              'h-10 rounded-xl text-sm font-medium transition',
              kind === k ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground',
            )}
          >
            {k === 'need' ? 'Need' : 'Want'}
          </button>
        ))}
      </div>

      <div>
        <label htmlFor="cat-alloc" className="text-sm font-medium">
          Monthly allocation
        </label>
        <input
          id="cat-alloc"
          type="number"
          inputMode="decimal"
          min={0}
          value={allocation}
          onChange={(e) => setAllocation(e.target.value)}
          className="mt-2 h-12 w-full rounded-2xl border border-input bg-background px-4 tabular-nums outline-none focus:border-ring"
        />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Colour</legend>
        <div className="flex flex-wrap gap-2">
          {TONES.map((t) => (
            <button
              key={t}
              type="button"
              aria-label={t}
              aria-pressed={tone === t}
              onClick={() => setTone(t)}
              className={cn(
                'size-8 rounded-full ring-offset-2 ring-offset-popover transition',
                tone === t && 'ring-2 ring-foreground/60',
              )}
              style={{ backgroundColor: `var(--tone-${t})` }}
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Icon</legend>
        <div className="grid grid-cols-8 gap-2">
          {(Object.keys(ICONS) as IconName[]).map((i) => {
            const Icon = ICONS[i]
            return (
              <button
                key={i}
                type="button"
                aria-label={i}
                aria-pressed={icon === i}
                onClick={() => setIcon(i)}
                className={cn(
                  'flex aspect-square items-center justify-center rounded-xl transition',
                  icon === i ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                )}
              >
                <Icon className="size-4" />
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className="flex gap-2">
        {category && (
          <button
            type="button"
            onClick={() => {
              if (confirm(`Delete ${category.name} and its logged spends?`)) {
                actions.deleteCategory(category.id)
                onDone()
              }
            }}
            className="h-12 rounded-2xl px-4 text-sm font-medium text-destructive transition hover:bg-destructive/10"
          >
            Delete
          </button>
        )}
        <PrimaryButton type="submit" disabled={!valid} className="flex-1">
          {category ? 'Save changes' : 'Add category'}
        </PrimaryButton>
      </div>
    </form>
  )
}
