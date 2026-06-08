"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronRight, Globe, User, LogOut } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { getTMDBImageUrl } from "@/lib/tmdb"
import type { Movie } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface WelcomeHeroProps {
  movies: Movie[]
}

export function WelcomeHero({ movies }: WelcomeHeroProps) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  // Create a larger array of movies for the background grid
  const gridMovies = [...movies, ...movies, ...movies, ...movies, ...movies].slice(0, 60)

  return (
    <div className="relative min-h-[100vh] w-full overflow-hidden flex flex-col">
      {/* Background Poster Grid */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-black">
        <div 
          className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 md:gap-3 p-2 opacity-30 scale-125 -rotate-12 -translate-y-[15%] -translate-x-[10%]"
          style={{ width: '130%', height: '140%' }}
        >
          {gridMovies.map((movie, i) => (
            <div key={`${movie.id}-${i}`} className="aspect-[2/3] relative rounded-sm overflow-hidden shadow-xl">
              <img
                src={getTMDBImageUrl(movie.poster_path, "w200") || "/placeholder.svg"}
                alt=""
                className="object-cover w-full h-full grayscale-[0.2]"
              />
            </div>
          ))}
        </div>
        {/* Dark Overlays */}
        <div className="absolute inset-0 bg-black/50 z-1" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/70 z-2" />
      </div>

      {/* Header Navigation (Logo only for Landing) */}
      <header className="relative z-20 flex items-center justify-between px-6 py-6 md:px-12 md:py-8 container mx-auto">
        <div className="flex items-center">
          <Image
            src="/image.png"
            alt="Agasobanuye Movies Logo"
            width={160}
            height={40}
            className="object-contain h-8 md:h-12 w-auto"
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded border border-white/30 bg-black/20 text-white backdrop-blur-sm">
            <Globe className="w-4 h-4" />
            <span className="text-sm font-black uppercase tracking-wider">English</span>
          </div>
          
          {!loading && (
            user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 outline-none">
                    <Avatar className="h-10 w-10 border border-white/10 ring-2 ring-transparent hover:ring-[#0071eb] transition-all">
                      <AvatarImage src={user.user_metadata?.avatar_url} />
                      <AvatarFallback className="bg-[#0071eb] text-white font-black">
                        {user.email?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-white/10 rounded-2xl p-2 shadow-2xl backdrop-blur-xl">
                  <DropdownMenuLabel className="px-3 py-2">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-black text-white leading-none">Account</p>
                      <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/5" />
                  <DropdownMenuItem className="rounded-xl px-3 py-2 text-zinc-300 hover:bg-[#0071eb] hover:text-white cursor-pointer transition-colors font-bold" onClick={() => router.push("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-xl px-3 py-2 text-red-500 hover:bg-red-500/20 cursor-pointer transition-colors font-bold" onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button className="bg-[#0071eb] hover:bg-[#005bb5] text-white font-black px-6 py-2 text-sm rounded-lg transition-all shadow-lg active:scale-95">
                  Sign In
                </Button>
              </Link>
            )
          )}
        </div>
      </header>

      {/* Main Hero Content */}
      <div className="relative z-10 flex-grow flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto">
        <div className="mb-6 flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0071eb] animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Premium ad-free experience coming soon</span>
        </div>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-4 leading-tight uppercase tracking-tighter">
          Unlimited movies, TV shows, and more
        </h1>
        <p className="text-xl md:text-2xl text-white mb-8 font-bold">
          Watch anywhere. Cancel anytime.
        </p>
        <div className="w-full max-w-2xl mt-8 flex justify-center">
          <Link href="/browse" className="w-full max-w-xl cursor-pointer">
            <Button size="lg" className="w-full h-14 md:h-18 text-xl md:text-3xl font-black bg-[#0071eb] hover:bg-[#005bb5] text-white px-16 rounded-full flex items-center justify-center gap-4 group transition-all shadow-2xl hover:scale-105 active:scale-95 cursor-pointer">
              Get Started
              <ChevronRight className="w-8 h-8 md:w-10 md:h-10 group-hover:translate-x-2 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Curved Separator */}
      <div className="relative z-20 w-full overflow-hidden leading-none mt-auto">
        <svg
          viewBox="0 0 1440 100"
          className="w-full h-[60px] md:h-[100px] text-[#0071eb]"
          preserveAspectRatio="none"
        >
          <path
            fill="currentColor"
            d="M0,0 C480,100 960,100 1440,0 L1440,100 L0,100 Z"
            className="opacity-20"
          />
          <path
            fill="black"
            d="M0,10 C480,110 960,110 1440,10 L1440,110 L0,110 Z"
          />
          <path
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            d="M0,5 C480,105 960,105 1440,5"
            className="opacity-50"
          />
        </svg>
      </div>
    </div>
  )
}
