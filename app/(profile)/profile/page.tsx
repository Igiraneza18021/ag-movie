"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Calendar, BadgeCheck, Clock3 } from "lucide-react"
import { isSubscriptionActive } from "@/lib/subscription-access"

interface SubscriptionDetails {
  status: string
  plan_id: string
  current_period_start: string
  current_period_end: string
}

export default function AccountPage() {
  const [user, setUser] = useState<any>(null)
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("status, plan_id, current_period_start, current_period_end")
        .eq("user_id", user.id)
        .maybeSingle()

      setUser(user)
      setSubscription(subscription)
      setLoading(false)
    }
    getData()
  }, [supabase])

  if (loading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0071eb]"></div>
      </div>
    )
  }

  const activeSubscription = isSubscriptionActive(subscription)

  return (
    <Card className="bg-zinc-900/40 border-white/5 backdrop-blur-xl rounded-[2.5rem] p-4 md:p-8 shadow-2xl">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-3xl font-black text-white uppercase tracking-tight">Account Details</CardTitle>
        <CardDescription className="text-zinc-500 font-medium text-lg">Manage your personal information and preferences</CardDescription>
      </CardHeader>
      <CardContent className="px-0 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="space-y-1">
            <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest ml-1">Email Address</p>
            <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
              <Mail className="h-5 w-5 text-[#0071eb]" />
              <span className="text-white font-bold truncate">{user.email}</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest ml-1">Member Since</p>
            <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
              <Calendar className="h-5 w-5 text-[#0071eb]" />
              <span className="text-white font-bold">
                {new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5">
          <h3 className="text-xl font-black text-white uppercase tracking-tight mb-6">Subscription Status</h3>
          {subscription ? (
            <div className="space-y-6">
              <div className="bg-[#0071eb]/10 border border-[#0071eb]/20 p-6 rounded-[2rem] shadow-[0_0_30px_rgba(0,113,235,0.1)]">
                <div className="flex items-center gap-3 text-white font-black text-lg uppercase tracking-tight">
                  <BadgeCheck className="h-6 w-6 text-[#0071eb]" />
                  {activeSubscription ? "Premium Active" : "Subscription Inactive"}
                </div>
                <p className="mt-2 text-zinc-400 font-bold ml-9">
                  Plan: <span className="text-[#0071eb] uppercase tracking-widest text-sm">{subscription.plan_id.replaceAll("_", " ")}</span>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest ml-1">Current Period Start</p>
                  <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                    <Clock3 className="h-4 w-4 text-[#0071eb]" />
                    <span className="text-white font-bold text-sm">
                      {new Date(subscription.current_period_start).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest ml-1">Current Period End</p>
                  <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                    <Clock3 className="h-4 w-4 text-[#0071eb]" />
                    <span className="text-white font-bold text-sm">
                      {new Date(subscription.current_period_end).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/5 p-8 rounded-[2rem] text-center border-dashed">
              <p className="text-zinc-400 font-bold">
                No active subscription found. 
                <Link href="/subscribe" className="text-[#0071eb] hover:underline ml-2">Subscribe now</Link> to enjoy an ad-free experience.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
