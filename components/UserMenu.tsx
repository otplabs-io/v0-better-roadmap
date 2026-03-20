"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, Trash2 } from "lucide-react"

export function UserMenu() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? null)
    })
  }, [])

  const handleSignOut = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }, [router])

  const handleDeleteAccount = useCallback(async () => {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete your account? All your roadmaps will be lost. This cannot be undone."
    )
    if (!confirmed) return

    const res = await fetch("/api/account/delete", { method: "DELETE" })
    if (res.ok) {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push("/")
      router.refresh()
    } else {
      alert("Failed to delete account. Please try again.")
    }
  }, [router])

  if (!email) return null

  const initial = email.charAt(0).toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full bg-primary/10 text-sm font-medium text-primary hover:bg-primary/20"
        >
          {initial}
          <span className="sr-only">User menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-3 py-2">
          <p className="truncate text-sm font-medium text-foreground">{email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="gap-2">
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleDeleteAccount}
          className="gap-2 text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          Delete account
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
