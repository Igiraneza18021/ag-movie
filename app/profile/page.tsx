"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Mail, Calendar, LogOut, Bookmark, BadgeCheck, Clock3 } from "lucide-react"
import Link from "next/link"
import { isSubscriptionActive } from "@/lib/subscription-access"

interface SubscriptionDetails {
  status: string
  plan_id: string
  current_period_start: string
  current_period_end: string
}

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }

      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("status, plan_id, current_period_start, current_period_end")
        .eq("user_id", user.id)
        .maybeSingle()

      setUser(user)
      setSubscription(subscription)
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

  const activeSubscription = isSubscriptionActive(subscription)

  return (
    <div className="min-h-screen bg-black pt-32 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="bg-zinc-900/40 border-white/5 backdrop-blur-xl rounded-[2rem] overflow-hidden">
              <CardContent className="pt-8 pb-6 flex flex-col items-center">
                <Avatar className="w-24 h-24 border-4 border-[#0071eb]/20 mb-4">
                  <AvatarImage src={user.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-[#0071eb] text-white text-3xl font-black">
                    {user.email?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-black text-white uppercase tracking-tight text-center">
                  {user.user_metadata?.full_name || user.email?.split("@")[0]}
                </h2>
                <p className="text-zinc-500 text-sm font-medium">{user.email}</p>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-2">
              <Link href="/watchlist">
                <Button variant="ghost" className="w-full justify-start h-12 rounded-2xl text-zinc-400 hover:text-white hover:bg-white/5 font-bold">
                  <Bookmark className="mr-3 h-5 w-5" />
                  My Watchlist
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                className="w-full justify-start h-12 rounded-2xl text-red-500 hover:text-red-500 hover:bg-red-500/10 font-bold"
                onClick={handleSignOut}
              >
                <LogOut className="mr-3 h-5 w-5" />
                Sign Out
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            <Card className="bg-zinc-900/40 border-white/5 backdrop-blur-xl rounded-[2.5rem] p-4 md:p-8">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-3xl font-black text-white uppercase tracking-tight">Account Details</CardTitle>
                <CardDescription className="text-zinc-500 font-medium">Manage your personal information and preferences</CardDescription>
              </CardHeader>
              <CardContent className="px-0 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">Email Address</p>
                    <div className="flex items-center gap-2 text-white font-bold">
                      <Mail className="h-4 w-4 text-[#0071eb]" />
                      {user.email}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">Member Since</p>
                    <div className="flex items-center gap-2 text-white font-bold">
                      <Calendar className="h-4 w-4 text-[#0071eb]" />
                      {new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">User ID</p>
                    <div className="flex items-center gap-2 text-white/50 font-mono text-xs">
                      {user.id}
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-white/5">
                  <h3 className="text-lg font-black text-white uppercase tracking-tight mb-4">Subscription</h3>
                  {subscription ? (
                    <div className="space-y-4">
                      <div className="bg-[#0071eb]/10 border border-[#0071eb]/20 p-4 rounded-2xl">
                        <div className="flex items-center gap-2 text-white font-bold">
                          <BadgeCheck className="h-4 w-4 text-[#0071eb]" />
                          {activeSubscription ? "Premium Active" : "Subscription Inactive"}
                        </div>
                        <p className="mt-2 text-sm text-zinc-300">
                          Plan: {subscription.plan_id.replaceAll("_", " ")}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">Term Start</p>
                          <div className="flex items-center gap-2 text-white font-bold">
                            <Clock3 className="h-4 w-4 text-[#0071eb]" />
                            {new Date(subscription.current_period_start).toLocaleString()}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">Term End</p>
                          <div className="flex items-center gap-2 text-white font-bold">
                            <Clock3 className="h-4 w-4 text-[#0071eb]" />
                            {new Date(subscription.current_period_end).toLocaleString()}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">Status</p>
                          <div className="text-white font-bold capitalize">{subscription.status}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                      <p className="text-zinc-300 text-sm font-bold">
                        No active subscription found yet. Subscribe to see your current premium term here.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
