import {
  BookOpen,
  Bus,
  Coffee,
  Dumbbell,
  Film,
  Gift,
  HeartPulse,
  House,
  PawPrint,
  Plane,
  ShoppingBag,
  ShoppingBasket,
  Smartphone,
  Sparkles,
  UtensilsCrossed,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { IconName, Tone } from '@/lib/types'

export const ICONS: Record<IconName, LucideIcon> = {
  home: House,
  basket: ShoppingBasket,
  bus: Bus,
  zap: Zap,
  health: HeartPulse,
  food: UtensilsCrossed,
  coffee: Coffee,
  bag: ShoppingBag,
  film: Film,
  plane: Plane,
  gift: Gift,
  phone: Smartphone,
  book: BookOpen,
  paw: PawPrint,
  dumbbell: Dumbbell,
  sparkles: Sparkles,
}

export const TONES: Tone[] = ['sage', 'mint', 'sky', 'lavender', 'peach', 'clay', 'sand', 'rose']

export function CategoryIcon({
  icon,
  tone,
  className,
  size = 'md',
}: {
  icon: IconName
  tone: Tone
  className?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const Icon = ICONS[icon] ?? Sparkles
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-2xl',
        size === 'sm' && 'size-8 rounded-xl',
        size === 'md' && 'size-10',
        size === 'lg' && 'size-12',
        className,
      )}
      style={{ color: `var(--tone-${tone})` }}
    >
      <span className="absolute inset-0 bg-current opacity-15" />
      <Icon className={cn('relative', size === 'sm' ? 'size-4' : 'size-5')} strokeWidth={1.8} />
    </span>
  )
}
