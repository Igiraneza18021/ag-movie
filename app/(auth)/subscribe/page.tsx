"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Loader2, Home as HomeIcon, CheckCircle2, ShieldCheck, Zap, Info } from "lucide-react"
import { getTMDBImageUrl } from "@/lib/tmdb"
import type { Movie } from "@/lib/types"

export default function SubscribePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [backgroundMovies, setBackgroundMovies] = useState<Movie[]>([])
  const [user, setUser] = useState<any>(null)
  const [checkingUser, setCheckingUser] = useState(true)
  const [transactionRef, setTransactionRef] = useState<string | null>(null)
  const [isWaiting, setIsWaiting] = useState(false)

  const router = useRouter()
  const supabase = createClient()
  
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === "true"
  const subscriptionPrice = isDevMode ? 100 : 2000

  useEffect(() => {
    if (!transactionRef || !isWaiting) return

    // 1. Initial check: maybe it processed before the listener started?
    const checkStatus = async () => {
      const { data, error } = await supabase
        .from('paypack_transactions')
        .select('status')
        .eq('paypack_ref', transactionRef)
        .single()
      
      if (!error && data?.status === 'successful') {
        toast.success("Payment confirmed! Welcome to Premium.")
        setIsWaiting(false)
        router.push("/browse")
        router.refresh()
      } else if (!error && data?.status === 'failed') {
        toast.error("Payment failed or was cancelled.")
        setIsWaiting(false)
        setTransactionRef(null)
      }
    }
    
    checkStatus()

    // 2. Listen for real-time updates
    const channel = supabase
      .channel(`payment-${transactionRef}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'paypack_transactions',
          filter: `paypack_ref=eq.${transactionRef}`,
        },
        (payload) => {
          const status = payload.new.status
          if (status === 'successful') {
            toast.success("Payment confirmed! Welcome to Premium.")
            setIsWaiting(false)
            router.push("/browse")
            router.refresh()
          } else if (status === 'failed') {
            toast.error("Payment failed or was cancelled.")
            setIsWaiting(false)
            setTransactionRef(null)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [transactionRef, isWaiting, router, supabase])

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login?next=/subscribe")
        return
      }
      setUser(user)
      setCheckingUser(false)
    }
    checkUser()
  }, [router, supabase.auth])

  useEffect(() => {
    async function fetchBackgroundContent() {
      try {
        const { data } = await supabase
          .from("movies")
          .select("id, poster_path")
          .eq("status", "active")
          .limit(40)
        
        if (data) {
          const repeated = [...data, ...data, ...data].slice(0, 60)
          setBackgroundMovies(repeated as any)
        }
      } catch (error) {
        console.error("Error fetching background content:", error)
      }
    }
    fetchBackgroundContent()
  }, [supabase])

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!phoneNumber.match(/^(078|079|072|073)\d{7}$/)) {
      toast.error("Please enter a valid MTN or Airtel/Tigo number (e.g., 078XXXXXXX)")
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch("/api/subscriptions/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, amount: subscriptionPrice })
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || "Failed to initiate subscription")

      setTransactionRef(data.ref)
      setIsWaiting(true)
      toast.success("Request sent! Confirm on your phone.")

    } catch (error: any) {
      toast.error(error.message || "Failed to initiate subscription")
    } finally {
      setIsLoading(false)
    }
  }

  if (checkingUser) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#0071eb]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Top Right Home Button */}
      {!isWaiting && (
        <div className="absolute top-6 right-6 z-50">
          <Link href="/">
            <Button variant="ghost" className="bg-black/20 hover:bg-white/10 text-white rounded-full px-6 border border-white/10 backdrop-blur-md font-black uppercase tracking-widest text-xs transition-all active:scale-95">
              <HomeIcon className="mr-2 h-4 w-4" />
              Home
            </Button>
          </Link>
        </div>
      )}

      {/* Cinematic Background Poster Grid */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-40">
        <div 
          className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3 p-4 scale-125 -rotate-12 -translate-y-[10%] -translate-x-[5%]"
          style={{ width: '120%', height: '120%' }}
        >
          {backgroundMovies.map((movie, i) => (
            <div key={`${movie.id}-${i}`} className="aspect-[2/3] relative rounded-lg overflow-hidden shadow-2xl border border-white/5">
              <img
                src={getTMDBImageUrl(movie.poster_path, "w200")}
                alt=""
                className="object-cover w-full h-full grayscale-[0.4]"
              />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black" />
      </div>

      {/* Decorative Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#0071eb]/20 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#0071eb]/10 rounded-full blur-[120px] pointer-events-none z-0" />

      <div className="w-full max-w-4xl z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {isWaiting ? (
          /* Waiting for Payment State */
          <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="relative">
              <div className="absolute inset-0 bg-[#0071eb] rounded-full blur-[60px] opacity-20 animate-pulse" />
              <div className="relative w-32 h-32 md:w-40 md:h-40 border-4 border-[#0071eb]/20 rounded-full flex items-center justify-center">
                <div className="absolute inset-0 border-t-4 border-[#0071eb] rounded-full animate-spin" />
                <Image
                  src="/image.png"
                  alt="Processing"
                  width={60}
                  height={60}
                  className="object-contain"
                />
              </div>
            </div>
            
            <div className="text-center space-y-4 max-w-md">
              <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">
                Waiting for <span className="text-[#0071eb]">Confirmation</span>
              </h2>
              <p className="text-zinc-400 font-bold text-lg">
                Please check your phone and enter your Mobile Money PIN to authorize the payment of <span className="text-white">{subscriptionPrice.toLocaleString()} RWF</span>.
              </p>
              <div className="flex items-center justify-center gap-2 text-[#0071eb] text-sm font-black uppercase tracking-widest bg-[#0071eb]/10 py-2 px-4 rounded-full border border-[#0071eb]/20">
                <Loader2 className="w-4 h-4 animate-spin" />
                Listening for Payment...
              </div>
            </div>

            <Button 
              variant="ghost" 
              onClick={() => { setIsWaiting(false); setTransactionRef(null); }}
              className="text-zinc-500 hover:text-white font-black uppercase tracking-widest text-xs transition-all"
            >
              Cancel Request
            </Button>
          </div>
        ) : (
          /* Normal Subscription Form */
          <>
            <div className="space-y-8">
              <div className="flex flex-col items-center md:items-start gap-4">
                 <Image
                    src="/image.png"
                    alt="Agasobanuye Movies Logo"
                    width={80}
                    height={80}
                    className="object-contain drop-shadow-[0_0_30px_rgba(0,113,235,0.4)]"
                  />
                <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none">
                  Premium <br/> <span className="text-[#0071eb]">Ad-Free</span>
                </h1>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-[#0071eb]/20 flex items-center justify-center flex-shrink-0 border border-[#0071eb]/30">
                    <ShieldCheck className="w-5 h-5 text-[#0071eb]" />
                  </div>
                  <div>
                    <h3 className="text-white font-black uppercase tracking-tight">Zero Ads</h3>
                    <p className="text-zinc-500 text-sm font-bold">Watch your favorite movies without any interruptions.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-[#0071eb]/20 flex items-center justify-center flex-shrink-0 border border-[#0071eb]/30">
                    <Zap className="w-5 h-5 text-[#0071eb]" />
                  </div>
                  <div>
                    <h3 className="text-white font-black uppercase tracking-tight">Priority Support</h3>
                    <p className="text-zinc-500 text-sm font-bold">Get faster responses for your movie requests.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-[#0071eb]/20 flex items-center justify-center flex-shrink-0 border border-[#0071eb]/30">
                    <CheckCircle2 className="w-5 h-5 text-[#0071eb]" />
                  </div>
                  <div>
                    <h3 className="text-white font-black uppercase tracking-tight">HD Quality</h3>
                    <p className="text-zinc-500 text-sm font-bold">Stream in the highest quality available for all titles.</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                <Info className="w-5 h-5 text-zinc-400" />
                <p className="text-zinc-400 text-xs font-medium">All features are currently free. Your subscription will be tracked for future premium content.</p>
              </div>
            </div>

            <div className="bg-zinc-900/40 backdrop-blur-3xl border border-white/10 p-8 md:p-12 rounded-[3rem] shadow-2xl space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-black text-white uppercase tracking-tight">Subscribe</h2>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-4xl font-black text-white">{subscriptionPrice.toLocaleString()}</span>
                  <span className="text-zinc-500 font-black uppercase tracking-widest text-sm">RWF / Month</span>
                </div>
              </div>

              <form onSubmit={handleSubscribe} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-zinc-300 font-bold uppercase text-[10px] tracking-widest ml-1 block">Mobile Money Number</label>
                  <Input 
                    type="tel"
                    placeholder="078XXXXXXX" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="h-14 bg-white/10 border-white/10 backdrop-blur-md rounded-2xl focus:border-[#0071eb] focus:bg-white/15 transition-all text-lg text-center font-black tracking-widest"
                    disabled={isLoading}
                  />
                  <p className="text-[10px] text-zinc-500 font-bold text-center uppercase tracking-tighter">Enter your MTN or Airtel number to pay via Paypack</p>
                </div>

                <Button 
                  type="submit"
                  className="w-full h-16 bg-[#0071eb] hover:bg-[#005bb5] text-white font-black uppercase tracking-wide rounded-2xl shadow-[0_10px_30px_rgba(0,113,235,0.4)] transition-all active:scale-95 text-lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  ) : (
                    "Pay with Mobile Money"
                  )}
                </Button>

                <div className="flex items-center justify-center gap-6 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 pt-6">
                  {/* Professional MTN Logo SVG */}
                  <svg className="h-8 w-auto" viewBox="0 0 50 32" xmlns="http://www.w3.org/2000/svg">
                    <rect width="50" height="32" rx="16" fill="#ffcc00"/>
                    <ellipse cx="25" cy="16" rx="20" ry="12" stroke="#000" strokeWidth="1.5" fill="none"/>
                    <text x="25" y="19" textAnchor="middle" fill="#000" fontSize="10" fontWeight="900" fontFamily="Arial, sans-serif" letterSpacing="-0.5">MTN</text>
                  </svg>

                  <div className="w-px h-8 bg-white/10" />

                  {/* Professional Airtel Logo SVG */}
                  <svg className="h-8 w-auto" viewBox="0 0 80 32" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 16C10 7.16344 17.1634 0 26 0H54C62.8366 0 70 7.16344 70 16C70 24.8366 62.8366 32 54 32H26C17.1634 32 10 24.8366 10 16Z" fill="#ff0000"/>
                    <text x="40" y="21" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="900" fontFamily="Arial, sans-serif" letterSpacing="0.5">airtel</text>
                  </svg>
                </div>
              </form>
            </div>
          </>
        )}
      </div>

      <p className="mt-12 text-center text-zinc-600 text-[10px] uppercase tracking-[0.2em] font-black pointer-events-none">
        &copy; {new Date().getFullYear()} Agasobanuye Movies &bull; Secure Payments by Paypack
      </p>
    </div>
  )
}
