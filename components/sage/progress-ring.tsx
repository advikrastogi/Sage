export function ProgressRing({
  value,
  size = 132,
  stroke = 10,
  children,
}: {
  value: number
  size?: number
  stroke?: number
  children?: React.ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const clamped = Math.min(Math.max(value, 0), 1)
  const over = value > 1
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-muted" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped)}
          className={over ? 'stroke-destructive' : 'stroke-primary'}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  )
}

export function Bar({ value, tone, className }: { value: number; tone?: string; className?: string }) {
  const over = value > 1
  return (
    <div className={`h-2 overflow-hidden rounded-full bg-muted ${className ?? ''}`}>
      <div
        className="h-full rounded-full animate-grow-x"
        style={{
          width: `${Math.min(value, 1) * 100}%`,
          backgroundColor: over ? 'var(--destructive)' : (tone ?? 'var(--primary)'),
        }}
      />
    </div>
  )
}
