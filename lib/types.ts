export type Kind = 'need' | 'want'

export type Tone = 'sage' | 'peach' | 'lavender' | 'sky' | 'sand' | 'rose' | 'mint' | 'clay'

export type IconName =
  | 'home'
  | 'basket'
  | 'bus'
  | 'zap'
  | 'health'
  | 'food'
  | 'coffee'
  | 'bag'
  | 'film'
  | 'plane'
  | 'gift'
  | 'phone'
  | 'book'
  | 'paw'
  | 'dumbbell'
  | 'sparkles'

export interface Category {
  id: string
  name: string
  kind: Kind
  allocation: number
  tone: Tone
  icon: IconName
}

export interface Expense {
  id: string
  amount: number
  categoryId: string
  note: string
  date: string
  createdAt: number
}

export interface Profile {
  name: string
  currency: string
  monthlyLimit: number
  reminderEnabled: boolean
  reminderTime: string
}

export interface AppState {
  profile: Profile | null
  categories: Category[]
  expenses: Expense[]
  noSpendDays: string[]
}
