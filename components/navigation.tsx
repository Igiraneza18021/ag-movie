"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { PWAInstallGuide } from "@/components/pwa-install-guide"
import { useWatchlist } from "@/hooks/use-watchlist"
import {
  Search,
  Bookmark,
  Home,
  Tv,
  Film,
  Clock,
  Grid3X3,
  Plus,
  MoreHorizontal,
  X,
} from "lucide-react"

const navItems = [
  { href: "/browse", label: "Home", icon: Home },
  { href: "/movies", label: "Movies", icon: Film },
  { href: "/tv-shows", label: "TV Shows", icon: Tv },
  { href: "/categories", label: "Categories", icon: Grid3X3 },
  { href: "/coming-soon", label: "Coming Soon", icon: Clock },
  { href: "/request-movie", label: "Request", icon: Plus },
]

const headerIcons = [
  { href: "/watchlist", label: "Watchlist", icon: Bookmark },
]

const InstallIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.81.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
)

export function Navigation() {
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const moreMenuRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const { watchlist } = useWatchlist()

  const watchCount = watchlist?.length || 0

  if (pathname === "/") return null

  useEffect(() => {
    const q = searchParams.get("q")
    if (q) setSearchQuery(q)
  }, [searchParams])

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false)
      }
      if (isSearchExpanded && searchInputRef.current && !searchInputRef.current.contains(event.target as Node) && !searchQuery) {
        setIsSearchExpanded(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isSearchExpanded, searchQuery])

  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isSearchExpanded])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    if (value.trim()) {
      router.push(`/search?q=${encodeURIComponent(value)}`)
    } else if (pathname === "/search") {
      router.push("/browse")
    }
  }

  const isIOS = typeof window !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent || navigator.vendor || "")
  const isPWA = typeof window !== 'undefined' && (window.navigator as any).standalone
  const showIOSInstall = isIOS && !isPWA

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setDeferredPrompt(null)
        setIsInstalled(true)
      }
    }
  }

  const visibleItems = navItems.slice(0, 4)
  const moreItems = [
    ...navItems.slice(4),
    ...headerIcons,
    ...(showIOSInstall ? [{ href: "/ios", label: "Install", icon: InstallIcon }] : []),
  ]

  return (
    <>
      {/* Mobile Logo & Buttons Wrapper (Floating) */}
      <div className="fixed top-4 left-4 right-4 z-50 md:hidden flex items-center justify-between pointer-events-none">
        <Link href="/browse" className="pointer-events-auto bg-zinc-900/80 backdrop-blur-md p-2 rounded-2xl border border-white/10 shadow-xl">
          <Image
            src="/image.png"
            alt="Agasobanuye Movies Logo"
            width={32}
            height={32}
            className="object-contain"
            style={{ height: "auto" }}
          />
        </Link>

        <div className="flex items-center gap-2 pointer-events-auto">
          <Link
            href="/search"
            className="w-10 h-10 rounded-2xl bg-zinc-900/80 backdrop-blur-md border border-white/10 text-zinc-300 flex items-center justify-center shadow-xl active:scale-95 transition-all"
          >
            <Search className="w-5 h-5" />
          </Link>
          <Link
            href="/watchlist"
            className="relative w-10 h-10 rounded-2xl bg-zinc-900/80 backdrop-blur-md border border-white/10 text-zinc-300 flex items-center justify-center shadow-xl active:scale-95 transition-all"
          >
            <Bookmark className="w-5 h-5" />
            {watchCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center shadow-lg border border-zinc-900">
                {watchCount > 99 ? "99+" : watchCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Desktop Header (Floating) */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl z-50 hidden md:flex items-center justify-between bg-zinc-900/70 backdrop-blur-xl border border-white/10 py-2.5 px-6 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-8">
          <Link href="/browse" className="flex-shrink-0 hover:scale-105 transition-transform">
            <Image
              src="/image.png"
              alt="Agasobanuye Movies Logo"
              width={36}
              height={32}
              className="object-contain"
              style={{ height: "auto" }}
            />
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map(({ href, label }, idx) => {
              const isActive = pathname === href
              return (
                <Link
                  key={idx}
                  href={href}
                  className={`px-4 py-2 rounded-2xl text-[14px] font-black tracking-wide transition-all ${
                    isActive
                      ? "bg-[#0071eb] text-white shadow-[0_0_20px_rgba(0,113,235,0.4)]"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Expanding Search */}
          <div 
            className={`relative flex items-center transition-all duration-300 ${
              isSearchExpanded ? "w-64" : "w-10"
            }`}
          >
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search movies, TV shows..."
              value={searchQuery}
              onChange={handleSearch}
              className={`w-full h-10 bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#0071eb] transition-all ${
                isSearchExpanded ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            />
            <button
              onClick={() => setIsSearchExpanded(!isSearchExpanded)}
              className={`absolute left-0 w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                isSearchExpanded || pathname === "/search"
                  ? "text-[#0071eb]"
                  : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <Search className="w-5 h-5" />
            </button>
            {isSearchExpanded && searchQuery && (
              <button 
                onClick={() => { setSearchQuery(""); router.push("/browse"); }}
                className="absolute right-3 text-zinc-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {headerIcons.map(({ href, label, icon: Icon }, idx) => {
            const isActive = pathname === href
            return (
              <Link
                key={idx}
                href={href}
                className={`relative w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                  isActive
                    ? "bg-[#0071eb] text-white"
                    : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon className="w-5 h-5" />
                {label === "Watchlist" && watchCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center shadow-lg border-2 border-zinc-900">
                    {watchCount > 99 ? "99+" : watchCount}
                  </span>
                )}
              </Link>
            )
          })}

          {!isInstalled && (
            <div className="ml-2">
              <PWAInstallGuide />
            </div>
          )}
        </div>
      </header>

      {/* Mobile Bottom Bar */}
      <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden flex justify-around items-center py-3 bg-zinc-900/90 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] safe-area-pb">
        {visibleItems.map(({ href, label, icon: Icon }, idx) => {
          const isActive = pathname === href
          return (
            <Link
              key={idx}
              href={href}
              className={`flex flex-col items-center px-3 py-1 rounded-2xl transition-all ${
                isActive ? "text-[#0071eb] scale-110" : "text-zinc-500 hover:text-white"
              }`}
            >
              {Icon && <Icon className="w-6 h-6 mb-0.5" />}
              <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
            </Link>
          )
        })}

        <button
          onClick={() => setShowMoreMenu(true)}
          className="flex flex-col items-center px-3 py-1 text-zinc-500 hover:text-white transition-all"
        >
          <MoreHorizontal className="w-6 h-6 mb-0.5" />
          <span className="text-[10px] font-black uppercase tracking-tighter">More</span>
        </button>
      </div>

      {/* Mobile More Menu */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setShowMoreMenu(false)} />
          <div className="absolute inset-x-4 bottom-24 bg-zinc-900 border border-white/10 rounded-[2rem] p-6 max-h-[70vh] overflow-auto shadow-2xl" ref={moreMenuRef}>
            <div className="flex items-center justify-between mb-6">
              <div className="text-white font-black text-xl uppercase tracking-tight">Navigation</div>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {moreItems.map(({ href, label, icon: Icon }, idx) => {
                const isActive = pathname === href
                const isWatch = href === "/watchlist"
                const showBadge = isWatch && watchCount > 0

                return (
                  <Link
                    key={idx}
                    href={href}
                    onClick={() => setShowMoreMenu(false)}
                    className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                      isActive ? "bg-[#0071eb]/20 border-[#0071eb]/50 text-white" : "bg-white/5 border-white/5 text-zinc-300"
                    }`}
                  >
                    <div className="relative">
                      {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
                      {showBadge && (
                        <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-primary text-[8px] font-black flex items-center justify-center">
                          {watchCount}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-bold">{label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
