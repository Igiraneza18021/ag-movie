"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const ADCASH_SCRIPT_ID = "adcash-anti-adblock-script"
const ADCASH_SCRIPT_SRC = "/api/adcash-lib"
const ADCASH_ZONE_ID = process.env.NEXT_PUBLIC_ADCASH_ZONE_ID || "dxsgcf7hdf"
const EXCLUDED_PREFIXES = (process.env.NEXT_PUBLIC_ADCASH_EXCLUDED_PREFIXES || "/admin")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean)

type GateState = "loading" | "blocked" | "ready"

let adcashScriptPromise: Promise<void> | null = null
let autotagStarted = false

function loadAdcashScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Window is unavailable"))
  }

  if (window.aclib) {
    return Promise.resolve()
  }

  if (adcashScriptPromise) {
    return adcashScriptPromise
  }

  adcashScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(ADCASH_SCRIPT_ID) as HTMLScriptElement | null

    const handleLoad = () => resolve()
    const handleError = () => reject(new Error("Failed to load Adcash library"))

    if (existingScript) {
      existingScript.addEventListener("load", handleLoad, { once: true })
      existingScript.addEventListener("error", handleError, { once: true })

      if (window.aclib) {
        resolve()
      }

      return
    }

    const script = document.createElement("script")
    script.id = ADCASH_SCRIPT_ID
    script.src = ADCASH_SCRIPT_SRC
    script.async = true
    script.type = "text/javascript"
    script.addEventListener("load", handleLoad, { once: true })
    script.addEventListener("error", handleError, { once: true })
    document.head.appendChild(script)
  }).catch((error) => {
    adcashScriptPromise = null
    throw error
  })

  return adcashScriptPromise
}

function checkBaitElement() {
  const bait = document.createElement("div")
  bait.className = "ad ads adsbox banner-ad ad-banner ad-unit text-ad"
  bait.setAttribute("aria-hidden", "true")
  bait.style.position = "absolute"
  bait.style.left = "-9999px"
  bait.style.top = "-9999px"
  bait.style.width = "1px"
  bait.style.height = "1px"
  bait.style.pointerEvents = "none"
  bait.style.opacity = "0"

  document.body.appendChild(bait)

  const computed = window.getComputedStyle(bait)
  const blocked =
    !bait.isConnected ||
    bait.offsetParent === null ||
    bait.offsetHeight === 0 ||
    bait.offsetWidth === 0 ||
    computed.display === "none" ||
    computed.visibility === "hidden"

  bait.remove()
  return !blocked
}

function hasWorkingAdcashLibrary() {
  return typeof window !== "undefined" && typeof window.aclib?.runAutoTag === "function"
}

function startAutotag() {
  if (!hasWorkingAdcashLibrary() || autotagStarted) {
    return
  }

  window.aclib.runAutoTag({ zoneId: ADCASH_ZONE_ID })
  autotagStarted = true
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
        await loadAdcashScript()
        startAutotag()

        const passed = hasWorkingAdcashLibrary() && checkBaitElement()

        if (!cancelled && mountedRef.current) {
          setGateState(passed ? "ready" : "blocked")
        }

        return passed
      } catch {
        if (!cancelled && mountedRef.current) {
          setGateState("blocked")
        }

        return false
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
              Disable AdBlock To Continue
            </DialogTitle>
            <DialogDescription className="text-base leading-7 text-white/70">
              This site requires ads to stay enabled. Please disable your ad blocker or allow ads for this site,
              then check again. The page will unlock automatically once the blocker is off.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/65">
            If you use an extension, open its menu and allow ads on this site, then come back here.
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
