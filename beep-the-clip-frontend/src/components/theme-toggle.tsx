import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme, type Theme } from "@/hooks/use-theme"
import { cn } from "@/lib/utils"

const options: { value: Theme; icon: React.ReactNode; label: string }[] = [
  { value: "light", icon: <Sun className="size-3.5" />, label: "Light" },
  { value: "system", icon: <Monitor className="size-3.5" />, label: "System" },
  { value: "dark", icon: <Moon className="size-3.5" />, label: "Dark" },
]

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()

  return (
    <div
      className={cn(
        "flex items-center rounded-lg border border-border bg-muted p-0.5 gap-0.5",
        className
      )}
      role="group"
      aria-label="Color theme"
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          aria-pressed={theme === opt.value}
          aria-label={opt.label}
          className={cn(
            "flex items-center justify-center rounded-md p-1.5 transition-colors",
            theme === opt.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {opt.icon}
        </button>
      ))}
    </div>
  )
}
