"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut, Bookmark, User as UserIcon, PlayCircle } from "lucide-react"
import Link from "next/link"

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }
      setUser(user)
      setLoading(false)
    }
    getUser()
  }, [router, supabase.auth])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0071eb]"></div>
      </div>
    )
  }

  const navItems = [
    { href: "/profile", label: "Account", icon: UserIcon },
    { href: "/user-watchlist", label: "Watchlist", icon: Bookmark },
    { href: "/continue-watching", label: "Continue Watching", icon: PlayCircle },
  ]

  return (
    <div className="min-h-screen bg-black pt-32 pb-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Sidebar */}
          <div className="space-y-10">
            {/* Profile Info - No Card */}
            <div className="flex flex-col items-center md:items-start gap-6 px-2">
              <div className="relative group">
                <Avatar className="w-20 h-24 md:w-24 md:h-24 border-2 border-[#0071eb]/30 rounded-2xl relative z-10 transition-transform duration-500 group-hover:scale-105">
                  <AvatarImage src={user.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-[#0071eb] text-white text-3xl font-black rounded-2xl">
                    {user.email?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="space-y-1 text-center md:text-left">
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">
                  {user.user_metadata?.full_name || user.email?.split("@")[0]}
                </h2>
                <p className="text-zinc-500 text-sm font-bold truncate w-full">{user.email}</p>
              </div>
            </div>

            {/* Navigation - Minimal Links */}
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href} className="cursor-pointer block">
                    <Button 
                      variant="ghost" 
                      className={`w-full justify-start h-12 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] transition-all cursor-pointer ${
                        isActive 
                          ? "bg-[#0071eb] text-white shadow-[0_10px_20px_rgba(0,113,235,0.2)]" 
                          : "text-zinc-500 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <item.icon className={`mr-4 h-4 w-4 ${isActive ? "text-white" : "text-[#0071eb]"}`} />
                      {item.label}
                    </Button>
                  </Link>
                )
              })}
              
              <div className="h-px bg-white/5 my-4 mx-2" />
              
              <Button 
                variant="ghost" 
                className="w-full justify-start h-12 rounded-xl text-red-500/60 hover:text-red-500 hover:bg-red-500/10 font-black uppercase text-[10px] tracking-[0.2em] cursor-pointer"
                onClick={handleSignOut}
              >
                <LogOut className="mr-4 h-4 w-4" />
                Sign Out
              </Button>
            </nav>
          </div>

          {/* Main Content Area */}
          <div className="md:col-span-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
