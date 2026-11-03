'use client'

import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes'
import { createContext, useContext, useEffect, useState, type ComponentProps, type ReactNode } from 'react'

export type Palette = 'sage' | 'indigo'

const PALETTE_KEY = 'sage-palette'

const THEME_COLORS: Record<Palette, { light: string; dark: string }> = {
  sage: { light: '#f6f5ee', dark: '#142320' },
  indigo: { light: '#F8FAFC', dark: '#090A0F' },
}

type PaletteContextValue = {
  palette: Palette
  setPalette: (palette: Palette) => void
}

const PaletteContext = createContext<PaletteContextValue>({
  palette: 'sage',
  setPalette: () => {},
})

export function usePalette() {
  return useContext(PaletteContext)
}

function applyPalette(palette: Palette) {
  document.documentElement.dataset.palette = palette
  try {
    localStorage.setItem(PALETTE_KEY, palette)
  } catch {}
}

function PaletteProvider({ children }: { children: ReactNode }) {
  const [palette, setPaletteState] = useState<Palette>('sage')
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PALETTE_KEY)
      if (stored === 'sage' || stored === 'indigo') {
        setPaletteState(stored)
        document.documentElement.dataset.palette = stored
      }
    } catch {}
  }, [])

  useEffect(() => {
    const mode = resolvedTheme === 'dark' ? 'dark' : 'light'
    const color = THEME_COLORS[palette][mode]
    document.querySelectorAll('meta[name="theme-color"]').forEach((el) => {
      el.setAttribute('content', color)
    })
  }, [palette, resolvedTheme])

  const setPalette = (next: Palette) => {
    setPaletteState(next)
    applyPalette(next)
  }

  return <PaletteContext.Provider value={{ palette, setPalette }}>{children}</PaletteContext.Provider>
}

export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      <PaletteProvider>{children}</PaletteProvider>
    </NextThemesProvider>
  )
}
