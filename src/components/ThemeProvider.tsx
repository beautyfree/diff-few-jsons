'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/state/store'

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useAppStore(state => state.ui.theme)
  const setTheme = useAppStore(state => state.setTheme)

  useEffect(() => {
    // Initialize theme from localStorage or system preference
    const savedTheme = localStorage.getItem('diff-few-jsons-theme')
    if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
      setTheme(savedTheme)
    } else {
      // Use system preference
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      setTheme(systemTheme)
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? 'dark' : 'light'
      // Only update if user hasn't set a preference
      if (!localStorage.getItem('diff-few-jsons-theme')) {
        setTheme(newTheme)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [setTheme])

  useEffect(() => {
    // Apply theme to DOM
    const html = document.documentElement
    if (theme === 'dark') {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }

    // Save theme preference
    localStorage.setItem('diff-few-jsons-theme', theme)
  }, [theme])

  return <>{children}</>
}
