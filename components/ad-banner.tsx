"use client"

import { useEffect, useRef } from "react"

export function AdBanner({ zoneId }: { zoneId: string }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Clear previous ad if any to prevent duplicates during re-renders
    containerRef.current.innerHTML = ''

    // Dynamically insert the ad script into the container
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.text = `aclib.runBanner({ zoneId: '${zoneId}' });`
    
    containerRef.current.appendChild(script)
  }, [zoneId])

  return (
    <div className="w-full flex justify-center items-center my-12 min-h-[90px] overflow-hidden">
      <div ref={containerRef} id={`ad-container-${zoneId}`} className="max-w-full" />
    </div>
  )
}
