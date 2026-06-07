export {}

declare global {
  interface Window {
    aclib?: {
      runAutoTag: (options: { zoneId: string }) => void
    }
  }
}
