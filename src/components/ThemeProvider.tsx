'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/state/store'

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useAppStore(state => state.ui.theme)

  useEffect(() => {
    const html = document.documentElement
    if (theme === 'dark') {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
  }, [theme])

  return <>{children}</>
}
