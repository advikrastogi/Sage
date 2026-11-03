import { Sprout } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex size-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground',
        className,
      )}
    >
      <Sprout className="size-[55%]" strokeWidth={1.8} aria-hidden="true" />
    </span>
  )
}

export function Splash({ leaving }: { leaving: boolean }) {
  return (
    <div
      role="status"
      aria-label="Loading Sage"
      className={cn(
        'fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden bg-background transition-opacity duration-700',
        leaving && 'pointer-events-none opacity-0',
      )}
    >
      <Aura />
      <div className="relative flex items-center justify-center">
        <span className="absolute size-24 rounded-full border border-primary/40 animate-ripple" />
        <span
          className="absolute size-24 rounded-full border border-primary/30 animate-ripple"
          style={{ animationDelay: '0.8s' }}
        />
        <Logo className="relative size-24 rounded-[2rem] shadow-xl shadow-primary/20 animate-sprout" />
      </div>
      <p className="relative mt-10 font-serif text-5xl animate-rise" style={{ animationDelay: '0.35s' }}>
        Sage
      </p>
      <p
        className="relative mt-2 text-sm tracking-wide text-muted-foreground animate-rise"
        style={{ animationDelay: '0.55s' }}
      >
        spend softly, save surely
      </p>
    </div>
  )
}

export function Aura() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-1/4 -top-1/4 size-[70vmax] rounded-full bg-primary/10 blur-3xl animate-drift" />
      <div
        className="absolute -bottom-1/3 -right-1/4 size-[60vmax] rounded-full bg-accent/40 blur-3xl animate-drift dark:bg-accent/20"
        style={{ animationDelay: '-7s' }}
      />
    </div>
  )
}
