"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronRight, Globe, Loader2 } from "lucide-react"
import Link from "next/link"
import { getTMDBImageUrl } from "@/lib/tmdb"
import type { Movie } from "@/lib/types"

interface WelcomeHeroProps {
  movies: Movie[]
}

export function WelcomeHero({ movies }: WelcomeHeroProps) {
  const [email, setEmail] = useState("")

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

      {/* Header Navigation */}
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
            <span className="text-sm font-medium">English</span>
          </div>
          <Link href="/">
            <Button className="bg-[#e50914] hover:bg-[#b2070f] text-white font-bold px-4 py-2 text-sm rounded transition-all">
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Hero Content */}
      <div className="relative z-10 flex-grow flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-4 leading-tight">
          Unlimited movies, TV shows, and more
        </h1>
        <p className="text-xl md:text-2xl text-white mb-6">
          Watch anywhere. Cancel anytime.
        </p>
        <div className="w-full max-w-2xl mt-4">
          <p className="text-lg md:text-xl text-white mb-4">
            Ready to watch? Enter your email to create or restart your membership.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-grow relative group">
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 md:h-16 bg-black/40 border-white/30 text-white placeholder:text-white/60 text-lg px-6 rounded focus:ring-2 focus:ring-[#e50914] transition-all"
              />
            </div>
            <Link href="/" className="w-full sm:w-auto">
              <Button size="lg" className="w-full h-14 md:h-16 text-xl md:text-2xl font-bold bg-[#e50914] hover:bg-[#b2070f] text-white px-8 rounded flex items-center justify-center gap-2 group transition-all">
                Get Started
                <ChevronRight className="w-6 h-6 md:w-8 md:h-8 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Curved Separator */}
      <div className="relative z-20 w-full overflow-hidden leading-none mt-auto">
        <svg
          viewBox="0 0 1440 100"
          className="w-full h-[60px] md:h-[100px] text-[#e50914]"
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
