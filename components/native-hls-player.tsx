"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Hls from "hls.js"
import { LoadingSpinner } from "@/components/ui/loading"

interface NativeHlsPlayerProps {
  embedUrl: string
  title: string
  poster?: string
  autoPlay?: boolean
  muted?: boolean
  onEnded?: () => void
}

type ResolveState = "idle" | "resolving" | "ready" | "error"

export function NativeHlsPlayer({
  embedUrl,
  title,
  poster,
  autoPlay = true,
  muted = false,
  onEnded,
}: NativeHlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [state, setState] = useState<ResolveState>("idle")
  const [playbackUrl, setPlaybackUrl] = useState("")
  const [error, setError] = useState("")

  const proxiedUrl = useMemo(() => {
    if (!playbackUrl) return ""
    return playbackUrl
  }, [playbackUrl])

  useEffect(() => {
    let cancelled = false

    async function resolveHls() {
      setState("resolving")
      setError("")
      setPlaybackUrl("")

      try {
        const response = await fetch("/api/hls/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ embedUrl }),
        })
        const data = await response.json()

        if (!response.ok || !data?.hlsUrl) {
          throw new Error(data?.error || "Unable to find an HLS stream.")
        }

        const params = new URLSearchParams({
          url: data.hlsUrl,
          referer: data.referer || embedUrl,
        })

        if (!cancelled) {
          setPlaybackUrl(`/api/hls/proxy?${params.toString()}`)
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
  }, [embedUrl])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !proxiedUrl) return

    hlsRef.current?.destroy()
    hlsRef.current = null

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = proxiedUrl
      return
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      })

      hlsRef.current = hls
      hls.loadSource(proxiedUrl)
      hls.attachMedia(video)
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setError("The HLS stream could not be played.")
          setState("error")
        }
      })

      return () => {
        hls.destroy()
        hlsRef.current = null
      }
    }

    setError("This browser does not support HLS playback.")
    setState("error")
  }, [proxiedUrl])

  if (state === "resolving" || state === "idle") {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black text-white">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" className="text-white" />
          <p className="text-sm text-white/80">Preparing stream...</p>
        </div>
      </div>
    )
  }

  if (state === "error") {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black px-6 text-white">
        <div className="max-w-md text-center">
          <h2 className="text-xl font-semibold">Stream unavailable</h2>
          <p className="mt-2 text-sm text-white/70">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <video
      ref={videoRef}
      className="absolute inset-0 h-full w-full bg-black"
      title={title}
      poster={poster}
      controls
      playsInline
      autoPlay={autoPlay}
      muted={muted}
      onEnded={onEnded}
    />
  )
}
