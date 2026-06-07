"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Loader2, Home as HomeIcon, Check, RefreshCw } from "lucide-react"
import { getTMDBImageUrl } from "@/lib/tmdb"
import type { Movie } from "@/lib/types"
import { createAvatar } from "@dicebear/core"
import * as collection from "@dicebear/collection"

const AVATAR_STYLES = [
  { id: "lorelei", name: "Lorelei", style: collection.lorelei },
  { id: "avataaars", name: "Avatars", style: collection.avataaars },
  { id: "bottts", name: "Robots", style: collection.bottts },
  { id: "pixelArt", name: "Pixel Art", style: collection.pixelArt },
  { id: "notionists", name: "Notionists", style: collection.notionists },
  { id: "miniavs", name: "MiniAvs", style: collection.miniavs },
  { id: "bigSmile", name: "Big Smile", style: collection.bigSmile },
  { id: "adventurer", name: "Adventurer", style: collection.adventurer },
  { id: "micah", name: "Micah", style: collection.micah },
]

export default function CompleteProfilePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [backgroundMovies, setBackgroundMovies] = useState<Movie[]>([])
  const [fullName, setFullName] = useState("")
  const [selectedStyleId, setSelectedStyleId] = useState("lorelei")
  const [user, setUser] = useState<any>(null)
  const [checkingUser, setCheckingUser] = useState(true)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function checkUser() {
      const isPreview = new URLSearchParams(window.location.search).get("preview") === "true"
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user && !isPreview) {
        router.push("/login")
        return
      }

      if (user) {
        setUser(user)
        setFullName(user.user_metadata?.full_name || "")
      } else if (isPreview) {
        setFullName("Guest User")
      }
      
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

  const selectedAvatarUri = useMemo(() => {
    const styleObj = AVATAR_STYLES.find(s => s.id === selectedStyleId)
    if (!styleObj) return ""
    
    return createAvatar(styleObj.style as any, {
      seed: fullName || user?.email || "default",
      size: 128,
    }).toDataUri()
  }, [selectedStyleId, fullName, user?.email])

  const handleComplete = async () => {
    const isPreview = new URLSearchParams(window.location.search).get("preview") === "true"

    if (!fullName.trim()) {
      toast.error("Please enter your name")
      return
    }

    if (isPreview && !user) {
      toast.success("Preview mode: Profile would be updated now!")
      router.push("/browse")
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          avatar_url: selectedAvatarUri,
          profile_completed: true,
        },
      })

      if (error) throw error
      
      toast.success("Profile updated successfully!")
      router.push("/browse")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile")
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

      <div className="w-full max-w-2xl z-10">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex flex-col items-center gap-4 group">
            <Image
              src="/image.png"
              alt="Agasobanuye Movies Logo"
              width={100}
              height={100}
              className="object-contain drop-shadow-[0_0_30px_rgba(0,113,235,0.4)] group-hover:scale-110 transition-transform duration-500"
            />
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter">
              Agasobanuye <span className="text-[#0071eb]">Movies</span>
            </h1>
          </Link>
        </div>

        <div className="space-y-8 bg-zinc-900/40 backdrop-blur-3xl border border-white/10 p-8 md:p-12 rounded-[3rem] shadow-2xl">
          <div className="space-y-2 text-center">
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter">
              Complete Your Profile
            </h2>
            <p className="text-zinc-400 font-bold">
              Choose your display name and a unique avatar
            </p>
          </div>

          <div className="grid gap-10">
            {/* Preview Section */}
            <div className="flex flex-col items-center gap-6">
               <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-tr from-[#0071eb] to-[#0071eb]/20 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="relative w-32 h-32 md:w-40 md:h-40 bg-zinc-900 rounded-full border-4 border-[#0071eb] overflow-hidden shadow-2xl">
                  <img
                    src={selectedAvatarUri}
                    alt="Selected Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              
              <div className="w-full max-w-sm">
                <label className="text-zinc-300 font-bold uppercase text-[10px] tracking-widest ml-1 mb-2 block">Display Name</label>
                <Input 
                  placeholder="Enter your name" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-14 bg-white/10 border-white/10 backdrop-blur-md rounded-2xl focus:border-[#0071eb] focus:bg-white/15 transition-all text-lg text-center font-bold"
                />
              </div>
            </div>

            {/* Style Selection Grid */}
            <div className="space-y-4">
               <label className="text-zinc-300 font-bold uppercase text-[10px] tracking-widest text-center block">Pick an Avatar Style</label>
               <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                 {AVATAR_STYLES.map((style) => {
                   const isSelected = selectedStyleId === style.id
                   const previewUri = createAvatar(style.style as any, {
                     seed: fullName || user?.email || "default",
                     size: 64,
                   }).toDataUri()

                   return (
                     <button
                       key={style.id}
                       onClick={() => setSelectedStyleId(style.id)}
                       className={`relative aspect-square rounded-2xl border-2 transition-all p-1 overflow-hidden ${
                         isSelected 
                          ? "border-[#0071eb] bg-[#0071eb]/20 scale-105 shadow-[0_0_15px_rgba(0,113,235,0.4)]" 
                          : "border-white/5 bg-white/5 hover:border-white/20"
                       }`}
                     >
                        <img src={previewUri} alt={style.name} className="w-full h-full object-cover" />
                        {isSelected && (
                          <div className="absolute top-1 right-1 bg-[#0071eb] rounded-full p-0.5">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                     </button>
                   )
                 })}
               </div>
            </div>

            <Button 
              onClick={handleComplete}
              className="w-full h-14 bg-[#0071eb] hover:bg-[#0071eb]/90 text-white font-black uppercase tracking-wide rounded-2xl shadow-[0_10px_30px_rgba(0,113,235,0.4)] transition-all active:scale-95 disabled:opacity-70 text-lg"
              disabled={isLoading || !fullName.trim()}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                "Finish Setup"
              )}
            </Button>
          </div>
        </div>

        <p className="mt-8 text-center text-zinc-600 text-[10px] uppercase tracking-[0.2em] font-black pointer-events-none">
          &copy; {new Date().getFullYear()} Agasobanuye Movies &bull; All Rights Reserved
        </p>
      </div>
    </div>
  )
}
