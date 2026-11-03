'use client'

import { useState } from 'react'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { PrimaryButton } from './onboarding'
import { Aura, Logo } from './splash'

type Mode = 'signin' | 'signup'

export function AuthView() {
  const configured = isSupabaseConfigured()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!configured) return
    setBusy(true)
    setError(null)
    setMessage(null)
    const supabase = createClient()
    try {
      if (mode === 'signin') {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password })
        if (err) throw err
      } else {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        })
        if (err) throw err
        if (data.user && !data.session) {
          setMessage('Check your email to confirm your account, then sign in.')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5 py-10">
      <Aura />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex items-center gap-2.5">
          <Logo />
          <span className="font-serif text-2xl">Sage</span>
        </div>
        <div className="rounded-[2rem] border border-border bg-card/80 p-6 shadow-xl shadow-primary/5 backdrop-blur-xl animate-rise sm:p-8">
          <p className="text-sm text-muted-foreground">{mode === 'signin' ? 'Welcome back' : 'Create an account'}</p>
          <h1 className="mt-1 text-balance font-serif text-4xl leading-tight">
            {mode === 'signin' ? 'Sign in to your budget.' : 'Save your budget in the cloud.'}
          </h1>
          <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
            Your spends stay private to this account and follow you across devices.
          </p>

          {!configured && (
            <p className="mt-6 rounded-2xl bg-muted px-4 py-3 text-sm leading-relaxed text-muted-foreground">
              Add <code className="text-foreground">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
              <code className="text-foreground">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{' '}
              <code className="text-foreground">.env.local</code>, run{' '}
              <code className="text-foreground">supabase/schema.sql</code> in the SQL editor, then restart the app.
            </p>
          )}

          <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
            <label className="block text-sm font-medium" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="-mt-2 h-12 w-full rounded-2xl border border-input bg-background px-4 outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/15"
            />
            <label className="block text-sm font-medium" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="-mt-2 h-12 w-full rounded-2xl border border-input bg-background px-4 outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/15"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            {message && <p className="text-sm text-muted-foreground">{message}</p>}
            <PrimaryButton type="submit" disabled={busy || !configured} className="mt-2 w-full">
              {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </PrimaryButton>
          </form>

          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin')
              setError(null)
              setMessage(null)
            }}
            className={cn('mt-3 w-full rounded-2xl py-3 text-sm text-muted-foreground transition hover:text-foreground')}
          >
            {mode === 'signin' ? 'Need an account? Create one' : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </main>
  )
}
