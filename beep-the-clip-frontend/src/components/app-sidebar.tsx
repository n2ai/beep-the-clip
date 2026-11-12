import { Film, LayoutDashboard, LogOut, Plus, Settings } from "lucide-react"
import { Link, NavLink, useNavigate } from "react-router-dom"
import { signOut } from "aws-amplify/auth"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/theme-toggle"

// Placeholder user data — replace with real Cognito user later
const MOCK_USER = {
  username: "longhai2511",
  email: "longhai2511@gmail.com",
  tier: "Free",
}

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
]

export function AppSidebar() {
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate("/login")
  }

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 px-4 border-b border-sidebar-border">
        <Film className="size-5 text-sidebar-primary" />
        <span className="font-semibold text-sm text-sidebar-foreground tracking-tight">
          Beep the Clip
        </span>
      </div>

      {/* New upload button */}
      <div className="px-3 pt-3">
        <Button
          className="w-full justify-start gap-2"
          size="sm"
          onClick={() => navigate("/workspace/new")}
        >
          <Plus className="size-4" />
          New upload
        </Button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                  )
                }
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <Separator />

      {/* Bottom section */}
      <div className="flex flex-col gap-2 p-3">
        {/* Theme toggle */}
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>

        {/* Settings link */}
        <Link
          to="/settings"
          className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground transition-colors"
        >
          <Settings className="size-4 shrink-0" />
          Settings
        </Link>

        <Separator />

        {/* User info */}
        <div className="flex items-center gap-2.5 px-1 py-1">
          {/* Avatar placeholder */}
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold uppercase">
            {MOCK_USER.username.slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-sidebar-foreground">
              {MOCK_USER.username}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {MOCK_USER.tier} plan
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Sign out"
            onClick={handleLogout}
          >
            <LogOut className="size-3.5" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
