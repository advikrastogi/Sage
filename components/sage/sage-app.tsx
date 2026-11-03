'use client'

import { ChartSpline, House, Moon, Plus, Settings2, Sun, WalletCards } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { useAppState, useSession } from '@/lib/store'
import type { AppState } from '@/lib/types'
import { cn } from '@/lib/utils'
import { AddExpenseSheet } from './add-expense-sheet'
import { AuthView } from './auth-view'
import { BudgetView } from './budget-view'
import { HomeView } from './home-view'
import { InsightsView } from './insights-view'
import { Onboarding } from './onboarding'
import { SettingsView } from './settings-view'
import { Aura, Logo, Splash } from './splash'
import { useReminder } from './use-reminder'

type Tab = 'home' | 'budget' | 'insights' | 'settings'

const TABS: { id: Tab; label: string; Icon: typeof House }[] = [
  { id: 'home', label: 'Today', Icon: House },
  { id: 'budget', label: 'Budget', Icon: WalletCards },
  { id: 'insights', label: 'Insights', Icon: ChartSpline },
  { id: 'settings', label: 'Settings', Icon: Settings2 },
]

export function SageApp() {
  const session = useSession()
  const state = useAppState()
  const [splash, setSplash] = useState<'show' | 'leaving' | 'gone'>('show')
  const signedIn = Boolean(session.user)
  const ready = session.ready && (!signedIn || state !== null)

  useEffect(() => {
    if (sessionStorage.getItem('sage-splash')) {
      setSplash('gone')
      return
    }
    const a = setTimeout(() => setSplash('leaving'), 1900)
    const b = setTimeout(() => {
      setSplash('gone')
      sessionStorage.setItem('sage-splash', '1')
    }, 2600)
    return () => {
      clearTimeout(a)
      clearTimeout(b)
    }
  }, [])

  return (
    <>
      {session.ready && !signedIn && <AuthView />}
      {signedIn && state && (state.profile ? <Shell state={state} /> : <Onboarding />)}
      {(splash !== 'gone' || !ready) && <Splash leaving={splash === 'leaving' && ready} />}
    </>
  )
}

function Shell({ state }: { state: AppState }) {
  const [tab, setTab] = useState<Tab>('home')
  const [adding, setAdding] = useState(false)
  const reminderDue = useReminder(state)
  const { resolvedTheme, setTheme } = useTheme()

  const change = (t: Tab) => {
    setTab(t)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="relative min-h-dvh">
      <div className="fixed inset-0 -z-10">
        <Aura />
      </div>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-background/60 p-5 backdrop-blur-xl lg:flex">
        <div className="flex items-center gap-2.5 px-2">
          <Logo />
          <span className="font-serif text-2xl">Sage</span>
        </div>
        <nav aria-label="Main" className="mt-10 flex flex-col gap-1">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => change(id)}
              aria-current={tab === id ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition',
                tab === id ? 'bg-secondary font-medium text-secondary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </nav>
        <button
          onClick={() => setAdding(true)}
          className="mt-6 flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition hover:brightness-105 active:scale-[0.98]"
        >
          <Plus className="size-4" /> Log a spend
        </button>
        <p className="mt-auto px-2 text-xs leading-relaxed text-muted-foreground">
          Small, honest entries make the calmest budgets.
        </p>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/60 bg-background/70 px-5 py-3 backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-2">
          <Logo className="size-8 rounded-xl" />
          <span className="font-serif text-xl">Sage</span>
        </div>
        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="inline-flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition hover:text-foreground"
        >
          <Sun className="hidden size-4 dark:block" />
          <Moon className="size-4 dark:hidden" />
          <span className="sr-only">Toggle theme</span>
        </button>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 pb-36 pt-6 lg:ml-60 lg:max-w-none lg:px-12 lg:pb-16 lg:pt-12">
        <div key={tab} className="mx-auto max-w-3xl">
          {tab === 'home' && <HomeView state={state} reminderDue={reminderDue} onAdd={() => setAdding(true)} />}
          {tab === 'budget' && <BudgetView state={state} />}
          {tab === 'insights' && <InsightsView state={state} />}
          {tab === 'settings' && <SettingsView state={state} />}
        </div>
      </main>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:hidden"
      >
        <div className="flex w-full max-w-md items-center justify-between rounded-[2rem] border border-border bg-card/85 p-1.5 shadow-2xl shadow-foreground/10 backdrop-blur-xl">
          {TABS.slice(0, 2).map((t) => (
            <NavItem key={t.id} {...t} active={tab === t.id} onClick={() => change(t.id)} />
          ))}
          <button
            onClick={() => setAdding(true)}
            className="relative -my-4 flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 transition active:scale-95"
          >
            {reminderDue && <span className="absolute inset-0 rounded-full border-2 border-primary animate-ripple" />}
            <Plus className="size-6" />
            <span className="sr-only">Log a spend</span>
          </button>
          {TABS.slice(2).map((t) => (
            <NavItem key={t.id} {...t} active={tab === t.id} onClick={() => change(t.id)} />
          ))}
        </div>
      </nav>

      <AddExpenseSheet
        open={adding}
        onClose={() => setAdding(false)}
        categories={state.categories}
        currency={state.profile!.currency}
      />
    </div>
  )
}

function NavItem({
  label,
  Icon,
  active,
  onClick,
}: {
  label: string
  Icon: typeof House
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex flex-1 flex-col items-center gap-0.5 rounded-3xl py-2 text-[11px] transition',
        active ? 'text-primary' : 'text-muted-foreground',
      )}
    >
      <Icon className="size-5" strokeWidth={active ? 2.2 : 1.8} />
      {label}
    </button>
  )
}
