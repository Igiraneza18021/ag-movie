"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const EXCLUDED_PREFIXES = (process.env.NEXT_PUBLIC_ADCASH_EXCLUDED_PREFIXES || "/admin")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean)

type GateState = "loading" | "blocked" | "ready"
type ProbeWindow = Window & { __agAdsProbeLoaded?: boolean }

const BAIT_SELECTORS = [
  "ad",
  "ads",
  "adsbox",
  "ad-banner",
  "ad-unit",
  "banner-ad",
  "sponsored-content",
  "advertisement",
]

function createBaitElement(selector: string) {
  const bait = document.createElement("div")
  bait.className = `${selector} text-ad promoted-box`
  bait.id = `${selector.replace(/[^a-z0-9-]/gi, "-")}-slot`
  bait.setAttribute("aria-hidden", "true")
  bait.style.position = "absolute"
  bait.style.left = "-9999px"
  bait.style.top = "-9999px"
  bait.style.width = "120px"
  bait.style.height = "120px"
  bait.style.minWidth = "120px"
  bait.style.minHeight = "120px"
  bait.style.pointerEvents = "none"
  bait.style.opacity = "0.01"
  bait.style.zIndex = "-1"
  bait.style.overflow = "hidden"
  return bait
}

function elementLooksBlocked(element: HTMLElement) {
  const computed = window.getComputedStyle(element)

  return (
    !element.isConnected ||
    element.offsetHeight === 0 ||
    element.offsetWidth === 0 ||
    element.clientHeight === 0 ||
    element.clientWidth === 0 ||
    computed.display === "none" ||
    computed.visibility === "hidden" ||
    computed.height === "0px" ||
    computed.width === "0px"
  )
}

async function detectBlockedByBaitElements() {
  const elements = BAIT_SELECTORS.map(createBaitElement)

  elements.forEach((element) => {
    document.body.appendChild(element)
  })

  await new Promise((resolve) => window.setTimeout(resolve, 150))

  const blocked = elements.some((element) => elementLooksBlocked(element))

  elements.forEach((element) => element.remove())

  return blocked
}

async function detectBlockedByScriptProbe() {
  return new Promise<boolean>((resolve) => {
    const probeWindow = window as ProbeWindow

    const cleanup = (script: HTMLScriptElement, timeoutId: number) => {
      window.clearTimeout(timeoutId)
      script.remove()
      delete probeWindow.__agAdsProbeLoaded
    }

    const script = document.createElement("script")
    const timeoutId = window.setTimeout(() => {
      cleanup(script, timeoutId)
      resolve(true)
    }, 1500)

    probeWindow.__agAdsProbeLoaded = false
    script.async = true
    script.src = `/ads/prebid/ads.js?ts=${Date.now()}`

    script.onload = () => {
      const blocked = probeWindow.__agAdsProbeLoaded !== true
      cleanup(script, timeoutId)
      resolve(blocked)
    }

    script.onerror = () => {
      cleanup(script, timeoutId)
      resolve(true)
    }

    document.head.appendChild(script)
  })
}

async function detectAdBlocker() {
  const [baitBlocked, scriptBlocked] = await Promise.all([
    detectBlockedByBaitElements(),
    detectBlockedByScriptProbe(),
  ])

  return baitBlocked || scriptBlocked
}

function isExcludedPath(pathname: string | null) {
  if (!pathname) {
    return false
  }

  return EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export function AntiAdblockGate() {
  const pathname = usePathname()
  const [gateState, setGateState] = useState<GateState>("loading")
  const [isChecking, setIsChecking] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const mountedRef = useRef(true)

  const shouldGate = useMemo(() => !isExcludedPath(pathname), [pathname])

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!shouldGate) {
      setGateState("ready")
      return
    }

    let cancelled = false
    let pollTimer: ReturnType<typeof setInterval> | null = null

    const runCheck = async () => {
      if (cancelled) return false

      setIsChecking(true)

      try {
        const blocked = await detectAdBlocker()

        if (!cancelled && mountedRef.current) {
          setGateState(blocked ? "blocked" : "ready")
        }

        return !blocked
      } catch {
        if (!cancelled && mountedRef.current) {
          setGateState("ready")
        }

        return true
      } finally {
        if (!cancelled && mountedRef.current) {
          setIsChecking(false)
        }
      }
    }

    setGateState("loading")

    void runCheck().then((passed) => {
      if (cancelled || passed) {
        return
      }

      pollTimer = setInterval(() => {
        void runCheck()
      }, 3000)
    })

    return () => {
      cancelled = true

      if (pollTimer) {
        clearInterval(pollTimer)
      }
    }
  }, [retryCount, shouldGate])

  useEffect(() => {
    if (!shouldGate) {
      document.body.style.overflow = ""
      return
    }

    document.body.style.overflow = gateState === "blocked" ? "hidden" : ""

    return () => {
      document.body.style.overflow = ""
    }
  }, [gateState, shouldGate])

  if (!shouldGate || gateState !== "blocked") {
    return null
  }

  return (
    <Dialog open>
      <DialogContent
        showCloseButton={false}
        className="max-w-xl border-white/10 bg-[#090a0a] p-0 text-white shadow-[0_30px_120px_rgba(0,0,0,0.8)]"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,113,235,0.22),transparent_55%)]" />
        <div className="relative overflow-hidden rounded-lg border border-white/10 bg-[#090a0a]/95 p-8">
          <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0071eb]/15 text-[#4ea1ff] shadow-[0_0_25px_rgba(0,113,235,0.2)]">
            <AlertTriangle className="h-7 w-7" />
          </div>

          <DialogHeader className="space-y-3 text-left">
            <DialogTitle className="text-2xl font-black tracking-tight text-white">
              Please Disable Your Ad Blocker
            </DialogTitle>
            <DialogDescription className="text-base leading-7 text-white/70">
              We do not use destructive or abusive ads. Advertising is currently the main source of income that
              helps us run and manage this project, so please allow ads on this site to continue.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/65">
            If you need an ad-free option, please contact us. We can consider a subscription-based alternative
            instead of relying on ads.
          </div>

          <div className="mt-6 flex items-center justify-end">
            <Button
              type="button"
              onClick={() => {
                setGateState("loading")
                setRetryCount((count) => count + 1)
              }}
              className="min-w-36 bg-[#0071eb] font-bold text-white hover:bg-[#0b7cff]"
              disabled={isChecking}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isChecking ? "animate-spin" : ""}`} />
              Check Again
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
