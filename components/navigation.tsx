"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { SearchModal } from "@/components/search-modal"
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
  Menu,
  X,
  MoreHorizontal,
} from "lucide-react"

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/movies", label: "Movies", icon: Film },
  { href: "/tv-shows", label: "TV Shows", icon: Tv },
  { href: "/categories", label: "Categories", icon: Grid3X3 },
  { href: "/coming-soon", label: "Coming Soon", icon: Clock },
  { href: "/request-movie", label: "Request", icon: Plus },
  { href: "/watchlist", label: "Watchlist", icon: Bookmark },
]

const headerIcons = [
  { href: "/search", label: "Search", icon: Search },
  { href: "/watchlist", label: "Watchlist", icon: Bookmark },
]

const InstallIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.81.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
)

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const pathname = usePathname()
  const moreMenuRef = useRef<HTMLDivElement>(null)
  const { watchlist } = useWatchlist()

  const watchCount = watchlist?.length || 0

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  // Scroll detection
  useEffect(() => {
    let ticking = false

    const handleScroll = () => {
      if (ticking) return
      ticking = true

      requestAnimationFrame(() => {
        const currentScrollY = window.scrollY

        // Update background style
        setIsScrolled(currentScrollY > 10)

        // Show navbar when at top or scrolling up, hide when scrolling down
        if (currentScrollY < 10) {
          setIsVisible(true)
        } else if (currentScrollY < lastScrollY) {
          // Scrolling up
          setIsVisible(true)
        } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
          // Scrolling down (only hide after 100px)
          setIsVisible(false)
        }

        setLastScrollY(currentScrollY)
        ticking = false
      })
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [lastScrollY])

  // Keyboard shortcut for search (Ctrl+G / Cmd+G)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (pathname.startsWith("/anime")) {
        return
      }

      // Open search with Ctrl+G / Cmd+G
      if ((e.ctrlKey || e.metaKey) && e.key === "g") {
        e.preventDefault()
        setIsSearchOpen(true)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [pathname])

  // Outside clicks (for the More menu only)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // iOS PWA check
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

  // Mobile visible items (first 4)
  const visibleItems = navItems.slice(0, 4)
  const moreItems = [
    ...navItems.slice(4),
    ...headerIcons,
    ...(showIOSInstall ? [{ href: "/ios", label: "Install", icon: InstallIcon }] : []),
  ]

  return (
    <>
      {/* Mobile Logo - Top Center */}
      <div className="fixed top-3 left-1/2 transform -translate-x-1/2 z-50 md:hidden pointer-events-auto">
        <Link href="/">
          <Image
            src="/image.png"
            alt="Agasobanuye Movies Logo"
            width={40}
            height={40}
            className="object-contain drop-shadow-lg"
          />
        </Link>
      </div>

      {/* Mobile top-right buttons */}
      <div className="fixed top-3 right-3 z-50 md:hidden flex items-center gap-1.5">
        {/* Search button */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-zinc-900/90 backdrop-blur-sm border border-zinc-700/50 text-zinc-300 hover:bg-primary hover:border-primary hover:text-white transition-all duration-300 hover:scale-105 hover:shadow-[0_4px_20px_rgba(99,102,241,0.4)]"
          aria-label="Search"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Watchlist button */}
        <Link
          href="/watchlist"
          className="relative inline-flex items-center justify-center w-9 h-9 rounded-full bg-zinc-900/90 backdrop-blur-sm border border-zinc-700/50 text-zinc-300 hover:bg-primary hover:border-primary hover:text-white transition-all duration-300 hover:scale-105 hover:shadow-[0_4px_20px_rgba(99,102,241,0.4)]"
          aria-label="Watchlist"
          title="Watchlist"
        >
          <Bookmark className="w-4 h-4" />
          {watchCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] px-1 rounded-full bg-primary text-white text-[9px] font-bold leading-[16px] text-center shadow-[0_2px_8px_rgba(99,102,241,0.6)] border border-zinc-900">
              {watchCount > 99 ? "99+" : watchCount}
            </span>
          )}
        </Link>
      </div>

      {/* Desktop Header */}
      <header
        className={`fixed top-0 left-0 right-0 w-full py-3 lg:py-4 px-4 lg:px-6 xl:px-10 z-50 flex items-center justify-between text-white transition-all duration-500 hidden md:flex ${
          isScrolled
            ? "bg-zinc-900/90 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(99,102,241,0.1)] border-b border-zinc-800/50"
            : "bg-gradient-to-b from-black/60 to-transparent backdrop-blur-sm"
        } ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}`}
      >
        {/* Left side: logo + nav */}
        <div className="flex items-center gap-3 lg:gap-6">
          <Link href="/" className="mr-2 lg:mr-4">
            <Image
              src="/image.png"
              alt="Agasobanuye Movies Logo"
              width={40}
              height={40}
              className="object-contain"
            />
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map(({ href, label }, idx) => {
              const isActive = pathname === href || (href === "/" && pathname === "/")
              return (
                <Link
                  key={idx}
                  href={href}
                  className={`relative px-2 lg:px-4 py-2 lg:py-2.5 rounded-lg transition-all duration-300 text-[13px] lg:text-[15px] font-medium ${
                    isActive
                      ? "text-white after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1/2 after:h-[3px] after:bg-primary after:rounded-full after:shadow-[0_0_10px_rgba(99,102,241,0.6)] after:transition-all after:duration-300"
                      : "text-zinc-300 hover:text-white hover:bg-zinc-800/40"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Right side: icons + install */}
        <div className="flex items-center gap-1 lg:gap-2">
          {headerIcons.map(({ href, label, icon: Icon }, idx) => {
            const isWatch = href === "/watchlist"
            const showBadge = isWatch && watchCount > 0
            const isActive = pathname === href

            if (href === "/search") {
              return (
                <button
                  key={idx}
                  onClick={() => setIsSearchOpen(true)}
                  className={`relative p-2 lg:p-2.5 rounded-xl transition-all duration-300 ${
                    isActive
                      ? "bg-primary text-white shadow-[0_4px_16px_rgba(99,102,241,0.4)]"
                      : "text-zinc-300 hover:text-white hover:bg-zinc-800/60 hover:scale-105"
                  }`}
                  aria-label={label}
                >
                  <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
                </button>
              )
            }

            return (
              <Link
                key={idx}
                href={href}
                className={`relative p-2 lg:p-2.5 rounded-xl transition-all duration-300 ${
                  isActive
                    ? "bg-primary text-white shadow-[0_4px_16px_rgba(99,102,241,0.4)]"
                    : "text-zinc-300 hover:text-white hover:bg-zinc-800/60 hover:scale-105"
                }`}
                aria-label={label}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1.5 rounded-full bg-primary text-white text-[11px] font-bold leading-[22px] text-center shadow-[0_2px_12px_rgba(99,102,241,0.6)] border-2 border-zinc-900">
                    {watchCount > 99 ? "99+" : watchCount}
                  </span>
                )}
              </Link>
            )
          })}

          {/* Install button */}
          {!isInstalled && (
            <div className="ml-2 lg:ml-3">
              <PWAInstallGuide />
            </div>
          )}
        </div>
      </header>

      {/* Mobile Bar */}
      <div className="fixed bottom-0 left-0 right-0 w-full flex justify-around items-center py-3 pb-6 z-50 md:hidden bg-zinc-900/95 backdrop-blur-2xl border-t border-zinc-800/50 shadow-[0_-4px_24px_rgba(0,0,0,0.3)] transition-all duration-300 safe-area-pb">
        {visibleItems.map(({ href, label, icon: Icon }, idx) => {
          const isActive = pathname === href || (href === "/" && pathname === "/")
          return (
            <Link
              key={idx}
              href={href}
              className={`relative flex flex-col items-center transition-all duration-300 px-2 py-1 rounded-xl ${
                isActive ? "text-primary scale-105" : "text-zinc-400 hover:text-white active:scale-95"
              }`}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
            >
              <div className="relative">
                {Icon && <Icon className="w-5 h-5 lg:w-6 lg:h-6 mb-1" />}
              </div>
              <span className="text-[10px] lg:text-[11px] font-medium">{label}</span>
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary shadow-[0_0_8px_rgba(99,102,241,0.8)] transition-all duration-300" />
              )}
            </Link>
          )
        })}

        {/* More button */}
        <div className="relative">
          <button
            onClick={() => setShowMoreMenu(true)}
            className="flex flex-col items-center text-zinc-400 hover:text-white transition-all duration-300 px-2 py-1 rounded-xl active:scale-95"
            aria-label="More"
          >
            <MoreHorizontal className="w-5 h-5 lg:w-6 lg:h-6 mb-1" />
            <span className="text-[10px] lg:text-[11px] font-medium">More</span>
          </button>
        </div>
      </div>

      {/* Full-screen overlay nav (mobile) */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/85 backdrop-blur-md transition-opacity duration-300"
            onClick={() => setShowMoreMenu(false)}
          />
          <div
            className="absolute inset-x-0 bottom-0 bg-zinc-900/98 backdrop-blur-2xl rounded-t-3xl border-t-2 border-zinc-800/80 p-5 pb-10 max-h-[85vh] overflow-auto shadow-[0_-8px_32px_rgba(0,0,0,0.4)]"
            ref={moreMenuRef}
            style={{
              animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="text-white font-bold text-lg">Quick Navigation</div>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800/60 hover:bg-primary text-white text-sm font-medium transition-all duration-300 hover:scale-105 border border-zinc-700/50 hover:border-primary"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {moreItems.map(({ href, label, icon: Icon }, idx) => {
                const isWatch = href === "/watchlist"
                const showBadge = isWatch && watchCount > 0
                const isActive = pathname === href

                if (href === "/search") {
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setShowMoreMenu(false)
                        setIsSearchOpen(true)
                      }}
                      className={`flex items-center gap-3 py-3.5 px-4 rounded-xl border transition-all duration-300 active:scale-95 ${
                        isActive
                          ? "text-white bg-primary/15 border-primary/70 shadow-[0_2px_12px_rgba(99,102,241,0.2)]"
                          : "text-zinc-300 border-zinc-800/60 bg-zinc-800/30 hover:bg-zinc-800/50 hover:border-zinc-700"
                      }`}
                      style={{
                        animationDelay: `${idx * 30}ms`,
                        animation: "fadeInUp 0.4s ease-out forwards",
                        opacity: 0,
                      }}
                    >
                      {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
                      <span className="flex items-center gap-2 text-sm font-medium">
                        {label}
                      </span>
                    </button>
                  )
                }

                if (href === "/ios") {
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setShowMoreMenu(false)
                        handleInstallClick()
                      }}
                      className="flex items-center gap-3 py-3.5 px-4 rounded-xl border transition-all duration-300 active:scale-95 text-zinc-300 border-zinc-800/60 bg-zinc-800/30 hover:bg-zinc-800/50 hover:border-zinc-700"
                      style={{
                        animationDelay: `${idx * 30}ms`,
                        animation: "fadeInUp 0.4s ease-out forwards",
                        opacity: 0,
                      }}
                    >
                      {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
                      <span className="flex items-center gap-2 text-sm font-medium">
                        {label}
                      </span>
                    </button>
                  )
                }

                return (
                  <Link
                    key={idx}
                    href={href}
                    onClick={() => setShowMoreMenu(false)}
                    className={`flex items-center gap-3 py-3.5 px-4 rounded-xl border transition-all duration-300 active:scale-95 ${
                      isActive
                        ? "text-white bg-primary/15 border-primary/70 shadow-[0_2px_12px_rgba(99,102,241,0.2)]"
                        : "text-zinc-300 border-zinc-800/60 bg-zinc-800/30 hover:bg-zinc-800/50 hover:border-zinc-700"
                    }`}
                    style={{
                      animationDelay: `${idx * 30}ms`,
                      animation: "fadeInUp 0.4s ease-out forwards",
                      opacity: 0,
                    }}
                  >
                    <div className="relative">
                      {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
                    </div>
                    <span className="flex items-center gap-2 text-sm font-medium">
                      {label}
                      {showBadge && (
                        <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full bg-primary text-white text-[10px] font-bold leading-[20px] shadow-[0_2px_10px_rgba(99,102,241,0.5)] border border-zinc-900">
                          {watchCount > 99 ? "99+" : watchCount}
                        </span>
                      )}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  )
}