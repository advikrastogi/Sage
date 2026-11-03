'use client'

import { Bell, Check, Download, LogOut, Monitor, Moon, RotateCcw, Sun, Wand2 } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { CURRENCIES, buildSample } from '@/lib/presets'
import { actions } from '@/lib/store'
import type { AppState } from '@/lib/types'
import { cn } from '@/lib/utils'
import { usePalette, type Palette } from './theme-provider'

export function SettingsView({ state }: { state: AppState }) {
  const profile = state.profile!
  const { theme, setTheme } = useTheme()
  const { palette, setPalette } = usePalette()
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default')

  useEffect(() => {
    setPermission('Notification' in window ? Notification.permission : 'unsupported')
  }, [])

  const exportCsv = () => {
    const cats = new Map(state.categories.map((c) => [c.id, c]))
    const rows = [
      ['date', 'amount', 'category', 'type', 'note'],
      ...state.expenses.map((e) => [
        e.date,
        e.amount.toFixed(2),
        cats.get(e.categoryId)?.name ?? '',
        cats.get(e.categoryId)?.kind ?? '',
        `"${e.note.replace(/"/g, '""')}"`,
      ]),
    ]
    const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'sage-spends.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="animate-rise">
        <p className="text-sm text-muted-foreground">Make it yours</p>
        <h1 className="mt-1 font-serif text-4xl sm:text-5xl">Settings</h1>
      </header>

      <Group title="Profile" delay={80}>
        <Row label="Name" htmlFor="s-name">
          <input
            id="s-name"
            defaultValue={profile.name}
            onBlur={(e) => e.target.value.trim() && actions.updateProfile({ name: e.target.value.trim().slice(0, 30) })}
            className="h-10 w-40 rounded-xl bg-muted px-3 text-right text-sm outline-none focus:ring-2 focus:ring-ring/30"
          />
        </Row>
        <Row label="Currency" htmlFor="s-cur">
          <select
            id="s-cur"
            value={profile.currency}
            onChange={(e) => actions.updateProfile({ currency: e.target.value })}
            className="h-10 rounded-xl bg-muted px-3 text-sm outline-none"
          >
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Row>
      </Group>

      <Group title="Color theme" delay={160}>
        <div role="radiogroup" aria-label="Color theme" className="grid gap-2 sm:grid-cols-2">
          {PALETTES.map((option) => {
            const selected = palette === option.id
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setPalette(option.id)}
                className={cn(
                  'rounded-[1.4rem] border p-4 text-left transition',
                  selected ? 'border-primary bg-primary/10 ring-2 ring-primary/25' : 'border-border hover:bg-muted/60',
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{option.label}</p>
                  {selected && <Check className="size-4 text-primary" aria-hidden="true" />}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{option.blurb}</p>
                <div className="mt-3 flex gap-1.5">
                  {option.swatches.map((color) => (
                    <span key={color} className="size-6 rounded-full border border-border/60" style={{ backgroundColor: color }} />
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      </Group>

      <Group title="Appearance" delay={200}>
        <div role="radiogroup" aria-label="Light or dark mode" className="grid grid-cols-3 gap-1 rounded-2xl bg-muted p-1">
          {[
            { v: 'light', label: 'Light', Icon: Sun },
            { v: 'dark', label: 'Dark', Icon: Moon },
            { v: 'system', label: 'Auto', Icon: Monitor },
          ].map(({ v, label, Icon }) => (
            <button
              key={v}
              role="radio"
              aria-checked={theme === v}
              onClick={() => setTheme(v)}
              className={cn(
                'flex h-11 items-center justify-center gap-2 rounded-xl text-sm transition',
                theme === v ? 'bg-card font-medium shadow-sm' : 'text-muted-foreground',
              )}
            >
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {palette === 'indigo'
            ? 'Midnight Indigo uses Clean Ice in light mode and Obsidian Oasis in dark mode.'
            : 'Sage Green Classic keeps the current warm sage palette in both modes.'}
        </p>
      </Group>

      <Group title="Daily reminder" delay={240}>
        <Row label="Remind me to log spends" htmlFor="s-rem">
          <Switch
            id="s-rem"
            checked={profile.reminderEnabled}
            onChange={(v) => actions.updateProfile({ reminderEnabled: v })}
          />
        </Row>
        <Row label="Time" htmlFor="s-time">
          <input
            id="s-time"
            type="time"
            value={profile.reminderTime}
            disabled={!profile.reminderEnabled}
            onChange={(e) => e.target.value && actions.updateProfile({ reminderTime: e.target.value })}
            className="h-10 rounded-xl bg-muted px-3 text-sm outline-none disabled:opacity-50"
          />
        </Row>
        {permission !== 'granted' && permission !== 'unsupported' && (
          <button
            onClick={async () => setPermission(await Notification.requestPermission())}
            disabled={permission === 'denied'}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary py-3 text-sm font-medium text-secondary-foreground disabled:opacity-60"
          >
            <Bell className="size-4" />
            {permission === 'denied' ? 'Notifications blocked in browser settings' : 'Allow notifications'}
          </button>
        )}
        <p className="text-xs leading-relaxed text-muted-foreground">
          If you haven&apos;t logged anything by this time, Sage will nudge you with an in-app banner and a notification
          while the app is open.
        </p>
      </Group>

      <Group title="Data" delay={320}>
        <ActionRow icon={<Download className="size-4" />} label="Export spends as CSV" onClick={exportCsv} />
        <ActionRow
          icon={<Wand2 className="size-4" />}
          label="Replace with sample data"
          onClick={() => confirm('Replace your data with two months of sample spends?') && actions.replace(buildSample(profile.name, profile.currency))}
        />
        <ActionRow
          icon={<RotateCcw className="size-4" />}
          label="Reset everything"
          danger
          onClick={() => confirm('This deletes all your Sage data. Continue?') && actions.reset()}
        />
        <ActionRow
          icon={<LogOut className="size-4" />}
          label="Sign out"
          onClick={() => void actions.signOut()}
        />
        <p className="text-xs leading-relaxed text-muted-foreground">
          Spends are saved to your Sage account so they stay available on other devices.
        </p>
      </Group>
    </div>
  )
}

const PALETTES: { id: Palette; label: string; blurb: string; swatches: string[] }[] = [
  {
    id: 'sage',
    label: 'Sage Green Classic',
    blurb: 'Warm cream, garden sage, and gold savings.',
    swatches: ['#f6f5ee', '#4f7a6a', '#e0b45a'],
  },
  {
    id: 'indigo',
    label: 'Midnight Indigo',
    blurb: 'Frost white, electric indigo, and emerald savings.',
    swatches: ['#f8fafc', '#6366f1', '#10b981'],
  },
]

function Group({ title, delay, children }: { title: string; delay: number; children: React.ReactNode }) {
  return (
    <section
      aria-label={title}
      className="flex flex-col gap-3 rounded-[2rem] border border-border bg-card p-5 animate-rise"
      style={{ animationDelay: `${delay}ms` }}
    >
      <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{title}</h2>
      {children}
    </section>
  )
}

function Row({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label htmlFor={htmlFor} className="text-sm">
        {label}
      </label>
      {children}
    </div>
  )
}

function ActionRow({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm transition hover:bg-muted',
        danger && 'text-destructive hover:bg-destructive/10',
      )}
    >
      {icon}
      {label}
    </button>
  )
}

function Switch({ id, checked, onChange }: { id: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn('relative h-7 w-12 rounded-full transition-colors', checked ? 'bg-primary' : 'bg-muted-foreground/30')}
    >
      <span
        className={cn(
          'absolute left-1 top-1 size-5 rounded-full bg-background shadow transition-transform',
          checked && 'translate-x-5',
        )}
      />
    </button>
  )
}
