"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import * as Switch from "@radix-ui/react-switch"
import { cn } from "~/lib/utils"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Prevent hydration mismatch
  React.useEffect(() => {
    console.log('ThemeToggle: useEffect mounting')
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-11 h-6 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
    )
  }

  const isDark = theme === 'dark'

  return (
    <div className="flex items-center space-x-2">
      <Sun className="h-4 w-4 text-yellow-500" />
      <Switch.Root
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
        className={cn(
          "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-200",
          "dark:data-[state=unchecked]:bg-gray-700"
        )}
      >
        <Switch.Thumb
          className={cn(
            "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
            "data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
          )}
        />
      </Switch.Root>
      <Moon className="h-4 w-4 text-blue-600" />
    </div>
  )
}

export function MobileThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    console.log('MobileThemeToggle: useEffect mounting')
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button
        className="p-2 rounded-md bg-gray-100 dark:bg-gray-800 animate-pulse"
        disabled
      >
        <div className="h-5 w-5" />
      </button>
    )
  }

  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium",
        "transition-colors focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50",
        "disabled:pointer-events-none h-10 w-10",
        "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
      )}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-yellow-500" />
      ) : (
        <Moon className="h-5 w-5 text-gray-600" />
      )}
    </button>
  )
} 