"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Calendar, BadgeCheck, Clock3 } from "lucide-react"
import { isSubscriptionActive } from "@/lib/subscription-access"
import Link from "next/link"

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
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-2">
        <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-tight">Account Details</h2>
        <p className="text-zinc-500 font-bold text-lg">Manage your personal information and preferences</p>
      </div>

      <div className="space-y-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
          <div className="space-y-3">
            <p className="text-zinc-500 text-[10px] uppercase font-black tracking-[0.2em] ml-1">Email Address</p>
            <div className="flex items-center gap-3 text-white">
              <Mail className="h-5 w-5 text-[#0071eb]" />
              <span className="text-xl font-black tracking-tight truncate">{user.email}</span>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-zinc-500 text-[10px] uppercase font-black tracking-[0.2em] ml-1">Member Since</p>
            <div className="flex items-center gap-3 text-white">
              <Calendar className="h-5 w-5 text-[#0071eb]" />
              <span className="text-xl font-black tracking-tight">
                {new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-10 border-t border-white/5 space-y-8">
          <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Subscription Status</h3>
          {subscription ? (
            <div className="space-y-10">
              <div className="flex items-center gap-4 group">
                <div className="w-14 h-14 rounded-2xl bg-[#0071eb]/10 border border-[#0071eb]/20 flex items-center justify-center transition-all group-hover:scale-110 group-hover:bg-[#0071eb]/20">
                  <BadgeCheck className="h-7 w-7 text-[#0071eb]" />
                </div>
                <div>
                  <div className="flex items-center gap-3 text-white font-black text-xl uppercase tracking-tighter">
                    {activeSubscription ? "Premium Active" : "Subscription Inactive"}
                  </div>
                  <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest mt-1">
                    Plan: <span className="text-[#0071eb]">{subscription.plan_id.replaceAll("_", " ")}</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <p className="text-zinc-500 text-[10px] uppercase font-black tracking-[0.2em] ml-1">Current Period Start</p>
                  <div className="flex items-center gap-3 text-white">
                    <Clock3 className="h-5 w-5 text-[#0071eb]" />
                    <span className="text-lg font-black tracking-tight">
                      {new Date(subscription.current_period_start).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-zinc-500 text-[10px] uppercase font-black tracking-[0.2em] ml-1">Current Period End</p>
                  <div className="flex items-center gap-3 text-white">
                    <Clock3 className="h-5 w-5 text-[#0071eb]" />
                    <span className="text-lg font-black tracking-tight">
                      {new Date(subscription.current_period_end).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] text-center border-dashed">
              <p className="text-zinc-400 font-bold text-lg">
                No active subscription found. 
                <Link href="/subscribe" className="text-[#0071eb] hover:underline ml-2 transition-all">Subscribe now</Link> <br className="hidden md:block" /> to enjoy an ad-free experience.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
