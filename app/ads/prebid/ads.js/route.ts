export function GET() {
  return new Response("window.__agAdsProbeLoaded = true;", {
    headers: {
      "Content-Type": "application/javascript; charset=UTF-8",
      "Cache-Control": "no-store",
    },
  })
}
