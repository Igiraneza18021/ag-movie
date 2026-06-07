"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Check, Plus } from "lucide-react"
import { useWatchlist } from "@/hooks/use-watchlist"
import { WatchlistEntryDialog } from "@/components/watchlist-entry-dialog"
import { cn } from "@/lib/utils"
import type { WatchlistItemType, WatchlistMediaSummary } from "@/lib/types"

interface WatchlistButtonProps {
  id: string
  type: WatchlistItemType
  title: string
  poster_path: string | null
  vote_average: number
  release_date?: string
  first_air_date?: string
  number_of_episodes?: number
  variant?: "default" | "ghost" | "outline"
  size?: "sm" | "md" | "lg"
  showText?: boolean
  iconOnly?: boolean
  className?: string
}

export function WatchlistButton({
  id,
  type,
  title,
  poster_path,
  vote_average,
  release_date,
  first_air_date,
  number_of_episodes,
  variant = "outline",
  size = "md",
  showText = true,
  iconOnly = false,
  className,
}: WatchlistButtonProps) {
  const {
    isAuthenticated,
    promptLogin,
    saveWatchlistEntry,
    deleteWatchlistEntry,
    getEntryByItem,
    isInWatchlist,
  } = useWatchlist()
  const [isAnimating, setIsAnimating] = useState(false)
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const inWatchlist = isInWatchlist(id, type)
  const existingEntry = getEntryByItem(id, type)
  const item: WatchlistMediaSummary = {
    id,
    type,
    title,
    poster_path,
    vote_average,
    release_date: release_date ?? null,
    first_air_date: first_air_date ?? null,
    number_of_episodes: number_of_episodes ?? null,
  }

  const handleClick = () => {
    setIsAnimating(true)

    if (!isAuthenticated) {
      promptLogin(pathname)
      window.setTimeout(() => setIsAnimating(false), 300)
      return
    }

    setOpen(true)
    window.setTimeout(() => setIsAnimating(false), 300)
  }

  const buttonSize = size === "sm" ? "sm" : size === "lg" ? "lg" : "default"
  const iconSize = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5"

  return (
    <>
      <Button
        variant={variant}
        size={buttonSize}
        onClick={handleClick}
        className={cn(
          "transition-all duration-200",
          inWatchlist && "bg-primary/20 border-primary text-primary hover:bg-primary/30",
          isAnimating && "scale-95",
          iconOnly && "px-0",
          className,
        )}
      >
        {inWatchlist ? (
          <Check className={cn(iconSize, showText && !iconOnly && "mr-2")} />
        ) : (
          <Plus className={cn(iconSize, showText && !iconOnly && "mr-2")} />
        )}
        {showText && !iconOnly ? (inWatchlist ? "In Watchlist" : "Add to List") : null}
      </Button>

      <WatchlistEntryDialog
        item={item}
        entry={existingEntry}
        open={open}
        onOpenChange={setOpen}
        onSave={saveWatchlistEntry}
        onDelete={existingEntry?.id ? deleteWatchlistEntry : undefined}
      />
    </>
  )
}
