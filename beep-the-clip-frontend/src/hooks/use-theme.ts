import { use } from "react"
import { ThemeContext, type Theme } from "@/contexts/theme-context"

export type { Theme }

export function useTheme() {
  const ctx = use(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>")
  return ctx
}
