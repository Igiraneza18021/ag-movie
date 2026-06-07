"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut, Bookmark, User as UserIcon, PlayCircle, Settings } from "lucide-react"
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
    { href: "/watchlist", label: "Watchlist", icon: Bookmark },
    { href: "/continue-watching", label: "Continue Watching", icon: PlayCircle },
  ]

  return (
    <div className="min-h-screen bg-black pt-32 pb-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="bg-zinc-900/40 border-white/5 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl">
              <CardContent className="pt-10 pb-8 flex flex-col items-center">
                <div className="relative group mb-6">
                  <div className="absolute -inset-4 bg-gradient-to-tr from-[#0071eb] to-[#0071eb]/20 rounded-full blur-2xl opacity-40" />
                  <Avatar className="w-24 h-24 border-4 border-[#0071eb]/30 relative z-10">
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-[#0071eb] text-white text-3xl font-black">
                      {user.email?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight text-center leading-tight">
                  {user.user_metadata?.full_name || user.email?.split("@")[0]}
                </h2>
                <p className="text-zinc-500 text-sm font-medium mt-1 truncate w-full text-center">{user.email}</p>
              </CardContent>
            </Card>

            <nav className="flex flex-col gap-2 bg-zinc-900/20 p-2 rounded-[2rem] border border-white/5">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href}>
                    <Button 
                      variant="ghost" 
                      className={`w-full justify-start h-14 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${
                        isActive 
                          ? "bg-[#0071eb] text-white shadow-[0_10px_20px_rgba(0,113,235,0.3)] hover:bg-[#0071eb]" 
                          : "text-zinc-500 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <item.icon className={`mr-3 h-5 w-5 ${isActive ? "text-white" : "text-[#0071eb]"}`} />
                      {item.label}
                    </Button>
                  </Link>
                )
              })}
              
              <div className="h-px bg-white/5 my-2 mx-4" />
              
              <Button 
                variant="ghost" 
                className="w-full justify-start h-14 rounded-2xl text-red-500 hover:text-red-500 hover:bg-red-500/10 font-black uppercase text-xs tracking-widest"
                onClick={handleSignOut}
              >
                <LogOut className="mr-3 h-5 w-5" />
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
