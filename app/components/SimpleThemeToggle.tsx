"use client"

import * as React from "react"
import { useTheme } from "next-themes"

export function SimpleThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Prevent hydration mismatch
  React.useEffect(() => {
    console.log('SimpleThemeToggle: mounting')
    setMounted(true)
  }, [])

  if (!mounted) {
    console.log('SimpleThemeToggle: not mounted, showing fallback')
    return (
      <button className="w-10 h-10 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
    )
  }

  const isDark = theme === 'dark'
  console.log('SimpleThemeToggle: rendered', { theme, isDark, mounted })

  return (
    <button
      onClick={() => {
        const newTheme = isDark ? 'light' : 'dark'
        console.log('SimpleThemeToggle: switching theme to', newTheme)
        setTheme(newTheme)
      }}
      className="p-2 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
} 