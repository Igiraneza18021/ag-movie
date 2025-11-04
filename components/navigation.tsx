"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { SearchModal } from "@/components/search-modal"
import { PWAInstallGuide } from "@/components/pwa-install-guide"
import { Search, Home, Clock, Bookmark, Grid3X3, Download, Film, Tv, Plus, Menu, X } from "lucide-react"

export function Navigation() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

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

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/movies", label: "Movies" },
    { href: "/tv-shows", label: "TV Shows" },
    { href: "/categories", label: "Categories" },
    { href: "/coming-soon", label: "Coming Soon" },
    { href: "/request-movie", label: "Request Content" },
    { href: "/watchlist", label: "My List" },
  ]

  const mobileNavItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/movies", label: "Movies", icon: Film },
    { href: "/tv-shows", label: "Shows", icon: Tv },
    { href: "/coming-soon", label: "Coming", icon: Clock },
    { href: "/watchlist", label: "My List", icon: Bookmark },
  ]

  const additionalMobileItems = [
    { href: "/categories", label: "Categories", icon: Grid3X3 },
    { href: "/request-movie", label: "Request", icon: Plus },
  ]

  // Add install button to mobile nav if not installed
  const allMobileNavItems = isInstalled 
    ? mobileNavItems 
    : [...mobileNavItems, { href: "#", label: "Install", icon: Download, isInstall: true }]

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-foreground">AGASOBANUYE MOVIES</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="flex items-center space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Search and Install */}
            <div className="flex items-center space-x-4">
              <PWAInstallGuide />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSearchOpen(true)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Search className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Top Navigation */}
      <nav className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between h-14 px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-lg font-bold text-foreground">AGASOBANUYE MOVIES</span>
          </Link>

          {/* Mobile Actions */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSearchOpen(true)}
              className="text-muted-foreground hover:text-foreground p-2"
            >
              <Search className="h-5 w-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-muted-foreground hover:text-foreground p-2"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="absolute top-14 left-0 right-0 bg-background/95 backdrop-blur-md border-b border-border shadow-lg">
            <div className="px-4 py-3 space-y-3">
              {additionalMobileItems.map((item) => {
                const IconComponent = item.icon
                const isActive = pathname === item.href
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 py-2 px-3 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    <IconComponent className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )
              })}
              
              {!isInstalled && (
                <button
                  onClick={() => {
                    handleInstallClick()
                    setIsMobileMenuOpen(false)
                  }}
                  className="flex items-center space-x-3 py-2 px-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors w-full"
                >
                  <Download className="h-5 w-5" />
                  <span className="font-medium">Install App</span>
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border safe-area-pb">
        <div className="flex items-center justify-around py-2 px-1">
          {allMobileNavItems.map((item) => {
            const IconComponent = item.icon
            const isActive = pathname === item.href
            const isInstallButton = item.isInstall
            
            if (isInstallButton) {
              return (
                <button
                  key="install"
                  onClick={handleInstallClick}
                  className="flex flex-col items-center justify-center py-2 px-1 text-muted-foreground hover:text-foreground transition-colors min-w-0 flex-1"
                >
                  <IconComponent className="h-5 w-5 mb-1" />
                  <span className="text-xs font-medium truncate">Install</span>
                </button>
              )
            }
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 px-1 transition-colors min-w-0 flex-1 ${
                  isActive 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <IconComponent className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium truncate">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  )
}
