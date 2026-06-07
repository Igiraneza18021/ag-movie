"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp"
import { toast } from "sonner"
import { Loader2, Home as HomeIcon, ArrowLeft, RefreshCw } from "lucide-react"
import { getTMDBImageUrl } from "@/lib/tmdb"
import type { Movie } from "@/lib/types"

function VerifyContent() {
  const [isLoading, setIsLoading] = useState(false)
  const [otp, setOtp] = useState("")
  const [backgroundMovies, setBackgroundMovies] = useState<Movie[]>([])
  const [resending, setResending] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const email = searchParams.get("email") || ""
  const type = searchParams.get("type") || "signup" // signup, recovery, invite, magiclink

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

  const handleVerify = async (code: string) => {
    if (code.length !== 8) return
    
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: type as any,
      })

      if (error) throw error
      
      toast.success("Verification successful!")
      router.push("/browse")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Invalid or expired code")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    try {
      const { error } = await supabase.auth.resend({
        type: type === "signup" ? "signup" : "recovery",
        email,
      })
      if (error) throw error
      toast.success("New verification code sent!")
    } catch (error: any) {
      toast.error(error.message || "Failed to resend code")
    } finally {
      setResending(false)
    }
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

      <div className="w-full max-w-xl z-10">
        <div className="flex justify-center mb-12">
          <Link href="/" className="flex flex-col items-center gap-2">
            <div className="bg-zinc-900/50 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-2xl">
              <Image
                src="/image.png"
                alt="Agasobanuye Movies Logo"
                width={60}
                height={60}
                className="object-contain"
              />
            </div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter">
              Agasobanuye <span className="text-[#0071eb]">Movies</span>
            </h1>
          </Link>
        </div>

        <div className="space-y-8 flex flex-col items-center">
          <div className="space-y-2 text-center">
            <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">
              Verify Your Account
            </h2>
            <p className="text-zinc-400 font-bold text-lg max-w-md mx-auto">
              We've sent an 8-digit code to <span className="text-white">{email || "your email"}</span>. Enter it below to continue.
            </p>
          </div>

          <div className="grid gap-8 w-full max-w-md">
            <div className="flex justify-center scale-110 md:scale-125 my-4">
              <InputOTP 
                maxLength={8} 
                value={otp} 
                onChange={(val) => {
                  setOtp(val)
                  if (val.length === 8) handleVerify(val)
                }}
                disabled={isLoading}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="h-14 w-10 md:h-16 md:w-12 bg-white/10 border-white/10 text-xl md:text-2xl font-black text-white rounded-l-2xl" />
                  <InputOTPSlot index={1} className="h-14 w-10 md:h-16 md:w-12 bg-white/10 border-white/10 text-xl md:text-2xl font-black text-white" />
                  <InputOTPSlot index={2} className="h-14 w-10 md:h-16 md:w-12 bg-white/10 border-white/10 text-xl md:text-2xl font-black text-white" />
                  <InputOTPSlot index={3} className="h-14 w-10 md:h-16 md:w-12 bg-white/10 border-white/10 text-xl md:text-2xl font-black text-white rounded-r-2xl md:rounded-r-none" />
                </InputOTPGroup>
                <InputOTPSeparator className="hidden md:flex text-[#0071eb]" />
                <InputOTPGroup>
                  <InputOTPSlot index={4} className="h-14 w-10 md:h-16 md:w-12 bg-white/10 border-white/10 text-xl md:text-2xl font-black text-white rounded-l-2xl md:rounded-l-none" />
                  <InputOTPSlot index={5} className="h-14 w-10 md:h-16 md:w-12 bg-white/10 border-white/10 text-xl md:text-2xl font-black text-white" />
                  <InputOTPSlot index={6} className="h-14 w-10 md:h-16 md:w-12 bg-white/10 border-white/10 text-xl md:text-2xl font-black text-white" />
                  <InputOTPSlot index={7} className="h-14 w-10 md:h-16 md:w-12 bg-white/10 border-white/10 text-xl md:text-2xl font-black text-white rounded-r-2xl" />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button 
              onClick={() => handleVerify(otp)}
              className="w-full h-14 bg-[#0071eb] hover:bg-[#0071eb]/90 text-white font-black uppercase tracking-wide rounded-2xl shadow-[0_10px_30px_rgba(0,113,235,0.4)] transition-all active:scale-95 disabled:opacity-70 text-lg"
              disabled={isLoading || otp.length !== 8}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                "Verify Code"
              )}
            </Button>

            <div className="flex flex-col items-center gap-6">
              <button 
                onClick={handleResend}
                disabled={resending}
                className="flex items-center text-sm font-black text-[#0071eb] hover:underline uppercase tracking-widest disabled:opacity-50"
              >
                {resending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Resend Code
              </button>

              <Link 
                href="/login"
                className="inline-flex items-center text-zinc-400 hover:text-white font-bold transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-zinc-600 text-[10px] uppercase tracking-[0.2em] font-black pointer-events-none">
          &copy; {new Date().getFullYear()} Agasobanuye Movies &bull; All Rights Reserved
        </p>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#0071eb]" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  )
}
