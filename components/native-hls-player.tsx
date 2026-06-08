"use client"

import { useEffect, useId, useRef, useState } from "react"
import Script from "next/script"
import { LoadingSpinner } from "@/components/ui/loading"
import { createClient } from "@/lib/supabase/client"
import { isSubscriptionActive } from "@/lib/subscription-access"

export interface NativeHlsPlaylistItem {
  id: string
  embedUrl: string
  title: string
  poster?: string
}

interface NativeHlsPlayerProps {
  embedUrl: string
  title: string
  poster?: string
  playlistItems?: NativeHlsPlaylistItem[]
  autoPlay?: boolean
  muted?: boolean
  initialTime?: number
  onProgress?: (progress: { time: number; duration: number }) => void
  onPlayerEvent?: (event: { type: string; time: number; duration: number }) => void
  onEnded?: () => void
}

type ResolveState = "idle" | "resolving" | "ready" | "error"
type PlayerPlaylistEntry = { id: string; title: string; file: string; poster?: string }
type PlayerSource = string | PlayerPlaylistEntry[]
const EMPTY_PLAYLIST: NativeHlsPlaylistItem[] = []

function isGoogleDriveEmbed(value: string) {
  try {
    return new URL(value).hostname === "drive.google.com"
  } catch {
    return false
  }
}

declare global {
  interface Window {
    Playerjs?: new (config: Record<string, unknown>) => {
      api?: (command: string, value?: unknown) => unknown
    }
    PlayerjsEvents?: (event: string, id: string, info?: unknown) => void
    __PLAYERJS_PROGRESS_BRIDGE__?: {
      attach: (
        player: { api?: (command: string, value?: unknown) => unknown },
        id: string,
      ) => {
        dispose: () => void
        emit: (type: string) => void
      }
    }
  }
}

type PlayerBridgeEventDetail = {
  id: string
  type: string
  time: number
  duration: number
}

function toPlayerNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function NativeHlsPlayer({
  embedUrl,
  title,
  poster,
  playlistItems = EMPTY_PLAYLIST,
  autoPlay = true,
  muted = false,
  initialTime = 0,
  onProgress,
  onPlayerEvent,
  onEnded,
}: NativeHlsPlayerProps) {
  const reactId = useId()
  const playerId = `playerjs-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`
  const playerRef = useRef<InstanceType<NonNullable<typeof window.Playerjs>> | null>(null)
  const bridgeRef = useRef<{ dispose: () => void; emit: (type: string) => void } | null>(null)
  const pendingPlaylistEntriesRef = useRef<PlayerPlaylistEntry[]>([])
  const currentTimeRef = useRef(0)
  const currentDurationRef = useRef(0)
  const initialSeekAppliedRef = useRef(false)
  const [state, setState] = useState<ResolveState>("idle")
  const [scriptReady, setScriptReady] = useState(false)
  const [playerSource, setPlayerSource] = useState<PlayerSource>("")
  const [error, setError] = useState("")
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [subscriptionResolved, setSubscriptionResolved] = useState(false)
  const shouldEmbedGoogleDrive = isGoogleDriveEmbed(embedUrl)
  const supabase = createClient()

  useEffect(() => {
    async function checkSubscription() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: subscription } = await supabase
          .from("subscriptions")
          .select("status, current_period_end")
          .eq("user_id", user.id)
          .maybeSingle()

        setIsSubscribed(isSubscriptionActive(subscription))
      } else {
        setIsSubscribed(false)
      }

      setSubscriptionResolved(true)
    }
    checkSubscription()
  }, [supabase])

  const playerScript = isSubscribed ? "/playerjs_no_ads.js" : "/playerjs.js"

  useEffect(() => {
    setScriptReady(false)
    playerRef.current?.api?.("stop")
    playerRef.current = null
    currentTimeRef.current = 0
    currentDurationRef.current = 0
    initialSeekAppliedRef.current = false
  }, [playerScript])

  useEffect(() => {
    if (shouldEmbedGoogleDrive) {
      playerRef.current?.api?.("stop")
      playerRef.current = null
      setState("idle")
      setPlayerSource("")
      setError("")
    }
  }, [shouldEmbedGoogleDrive])

  useEffect(() => {
    if (shouldEmbedGoogleDrive) return

    let cancelled = false

    async function resolveEmbed(itemEmbedUrl: string) {
      const response = await fetch("/api/hls/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embedUrl: itemEmbedUrl }),
      })
      const data = await response.json()

      if (!response.ok || !data?.hlsUrl) {
        throw new Error(data?.error || "Unable to find an HLS stream.")
      }

      const params = new URLSearchParams({
        url: data.hlsUrl,
        referer: data.referer || itemEmbedUrl,
      })

      if (data.proxy === false) {
        return data.hlsUrl as string
      }

      return `/api/hls/proxy?${params.toString()}`
    }

    async function resolveHls() {
      setState("resolving")
      setError("")
      setPlayerSource("")
      pendingPlaylistEntriesRef.current = []

      try {
        if (playlistItems.length) {
          const [currentItem, ...remainingItems] = playlistItems
          const currentEntry = {
            id: currentItem.id,
            title: currentItem.title,
            poster: currentItem.poster,
            file: await resolveEmbed(currentItem.embedUrl),
          }

          if (cancelled) return

          setPlayerSource([currentEntry])
          setState("ready")

          for (const item of remainingItems) {
            if (cancelled) return

            try {
              const entry = {
                id: item.id,
                title: item.title,
                poster: item.poster,
                file: await resolveEmbed(item.embedUrl),
              }

              if (playerRef.current) {
                playerRef.current.api?.("push", [entry])
              } else {
                pendingPlaylistEntriesRef.current.push(entry)
              }
            } catch (playlistError) {
              console.warn(`Unable to resolve playlist item ${item.title}:`, playlistError)
            }
          }

          return
        }

        const source = await resolveEmbed(embedUrl)

        if (!cancelled) {
          setPlayerSource(source)
          setState("ready")
        }
      } catch (resolveError) {
        if (!cancelled) {
          setError(resolveError instanceof Error ? resolveError.message : "Unable to load stream.")
          setState("error")
        }
      }
    }

    resolveHls()

    return () => {
      cancelled = true
    }
  }, [embedUrl, playlistItems, shouldEmbedGoogleDrive])

  useEffect(() => {
    if (!scriptReady || !playerSource || !window.Playerjs) return

    const previousEvents = window.PlayerjsEvents
    const readPlayerValue = (command: string) => toPlayerNumber(playerRef.current?.api?.(command))
    const getSnapshot = () => {
      if (currentDurationRef.current <= 0) {
        currentDurationRef.current = readPlayerValue("duration")
      }

      return {
        time: currentTimeRef.current,
        duration: currentDurationRef.current,
      }
    }
    const emitSnapshot = (event: string, time?: number, duration?: number) => {
      if (typeof time === "number" && Number.isFinite(time)) {
        currentTimeRef.current = Math.max(0, time)
      }

      if (typeof duration === "number" && Number.isFinite(duration) && duration > 0) {
        currentDurationRef.current = duration
      }

      const snapshot = getSnapshot()

      if (event === "time" || event === "duration" || event === "seek" || event === "userseek" || event === "progress") {
        if (snapshot.duration > 0) {
          onProgress?.(snapshot)
        }
      }

      onPlayerEvent?.({ type: event, ...snapshot })
    }

    window.PlayerjsEvents = (event, id, info) => {
      if (id === playerId) {
        if (event === "time") {
          emitSnapshot(event, toPlayerNumber(info))
        } else if (event === "duration") {
          emitSnapshot(event, undefined, toPlayerNumber(info))
        } else if (event === "seek" || event === "userseek") {
          emitSnapshot(event, toPlayerNumber(info))
        } else if (event === "metadata" && currentDurationRef.current <= 0) {
          emitSnapshot(event, undefined, readPlayerValue("duration"))
        } else {
          emitSnapshot(event)
        }

        if (event === "end") {
          emitSnapshot("progress", currentDurationRef.current || currentTimeRef.current, currentDurationRef.current)
          onEnded?.()
        }
      }

      previousEvents?.(event, id, info)
    }

    const handleBridgeEvent = (rawEvent: Event) => {
      const bridgeEvent = rawEvent as CustomEvent<PlayerBridgeEventDetail>
      const detail = bridgeEvent.detail

      if (!detail || detail.id !== playerId) return

      emitSnapshot(detail.type, detail.time, detail.duration)
    }

    window.addEventListener("playerjs-bridge", handleBridgeEvent as EventListener)

    playerRef.current = new window.Playerjs({
      id: playerId,
      file: playerSource,
      title,
      poster,
      autoplay: autoPlay ? 1 : 0,
      mute: muted ? 1 : 0,
      start: initialTime > 0 ? initialTime : undefined,
    })

    bridgeRef.current?.dispose()
    bridgeRef.current = window.__PLAYERJS_PROGRESS_BRIDGE__?.attach(playerRef.current, playerId) ?? null

    if (initialTime > 0) {
      window.setTimeout(() => {
        if (initialSeekAppliedRef.current) return

        playerRef.current?.api?.("seek", initialTime)
        currentTimeRef.current = initialTime
        initialSeekAppliedRef.current = true
      }, 400)
    }

    if (pendingPlaylistEntriesRef.current.length > 0) {
      playerRef.current.api?.("push", pendingPlaylistEntriesRef.current)
      pendingPlaylistEntriesRef.current = []
    }

    return () => {
      window.removeEventListener("playerjs-bridge", handleBridgeEvent as EventListener)
      bridgeRef.current?.dispose()
      bridgeRef.current = null
      playerRef.current?.api?.("stop")
      playerRef.current = null
      currentTimeRef.current = 0
      currentDurationRef.current = 0
      initialSeekAppliedRef.current = false
      window.PlayerjsEvents = previousEvents
    }
  }, [autoPlay, initialTime, muted, onEnded, onPlayerEvent, onProgress, playerSource, playerId, poster, scriptReady, title])

  if (shouldEmbedGoogleDrive) {
    return (
      <iframe
        src={embedUrl}
        className="absolute inset-0 h-full w-full bg-black"
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
        title={title}
      />
    )
  }

  if (!subscriptionResolved || state === "resolving" || state === "idle") {
    return (
      <>
        <Script
          key={playerScript}
          src={playerScript}
          strategy="afterInteractive"
          onReady={() => setScriptReady(true)}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black text-white">
          <div className="text-center space-y-4">
            <LoadingSpinner size="lg" className="text-white" />
            <p className="text-sm text-white/80">Preparing stream...</p>
          </div>
        </div>
      </>
    )
  }

  if (state === "error") {
    return (
      <>
        <Script
          key={playerScript}
          src={playerScript}
          strategy="afterInteractive"
          onReady={() => setScriptReady(true)}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black px-6 text-white">
          <div className="max-w-md text-center">
            <h2 className="text-xl font-semibold">Stream unavailable</h2>
            <p className="mt-2 text-sm text-white/70">{error}</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Script
        key={playerScript}
        src={playerScript}
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      <div id={playerId} className="absolute inset-0 h-full w-full bg-black" />
      {!scriptReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black text-white">
          <div className="text-center space-y-4">
            <LoadingSpinner size="lg" className="text-white" />
            <p className="text-sm text-white/80">Loading player...</p>
          </div>
        </div>
      )}
    </>
  )
}
