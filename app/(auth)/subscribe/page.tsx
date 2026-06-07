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

  const router = useRouter()
  const supabase = createClient()

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
    
    // Simulate Paypack integration for now as requested
    try {
      // In a real integration, we would call an API route that:
      // 1. Authenticates with Paypack agents/authorize
      // 2. Initiates a cashin request
      // 3. Stores the 'ref' and 'pending' status in paypack_transactions table
      
      const { data, error } = await supabase
        .from("paypack_transactions")
        .insert({
          user_id: user.id,
          paypack_ref: `sim_${Math.random().toString(36).substring(7)}`,
          amount: 2000,
          client_phone: phoneNumber,
          status: 'pending',
          kind: 'CASHIN'
        })

      if (error) throw error

      toast.success("Payment request sent! Please check your phone to confirm.")
      
      // Since all features are free for now, we just redirect or show success
      setTimeout(() => {
        router.push("/browse")
      }, 3000)

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
      <div className="absolute top-6 right-6 z-50">
        <Link href="/">
          <Button variant="ghost" className="bg-black/20 hover:bg-white/10 text-white rounded-full px-6 border border-white/10 backdrop-blur-md font-black uppercase tracking-widest text-xs transition-all active:scale-95">
            <HomeIcon className="mr-2 h-4 w-4" />
            Home
          </Button>
        </Link>
      </div>

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
              <span className="text-4xl font-black text-white">2,000</span>
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

            <div className="flex items-center justify-center gap-4 opacity-50 grayscale pt-4">
              <img src="https://upload.wikimedia.org/wikipedia/commons/9/93/MTN_Logo.svg" alt="MTN" className="h-8" />
              <div className="w-px h-6 bg-white/20" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/c/cc/Airtel_logo.svg" alt="Airtel" className="h-6" />
            </div>
          </form>
        </div>
      </div>

      <p className="mt-12 text-center text-zinc-600 text-[10px] uppercase tracking-[0.2em] font-black pointer-events-none">
        &copy; {new Date().getFullYear()} Agasobanuye Movies &bull; Secure Payments by Paypack
      </p>
    </div>
  )
}
