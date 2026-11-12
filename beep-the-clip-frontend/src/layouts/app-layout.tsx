import { useEffect, useState } from "react"
import { Outlet, Navigate } from "react-router-dom"
import { fetchAuthSession } from "aws-amplify/auth"
import { AppSidebar } from "@/components/app-sidebar"

type AuthState = "loading" | "authenticated" | "unauthenticated"

export default function AppLayout() {
  const [authState, setAuthState] = useState<AuthState>("loading")

  useEffect(() => {
    fetchAuthSession()
      .then((session) => {
        const isAuthed = !!session.tokens?.accessToken
        setAuthState(isAuthed ? "authenticated" : "unauthenticated")
      })
      .catch(() => setAuthState("unauthenticated"))
  }, [])

  if (authState === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="size-5 animate-spin rounded-full border-2 border-border border-t-foreground" />
      </div>
    )
  }

  if (authState === "unauthenticated") {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
