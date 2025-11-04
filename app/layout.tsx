import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import { ContentRefreshProvider } from "@/components/content-refresh-provider"
import { Suspense } from "react"
import "@/lib/disable-debug"
import "./globals.css"

export const metadata: Metadata = {
  title: "Agasobanuye Movies - Stream Movies & TV Shows",
  description: "Your ultimate destination for streaming movies and TV shows. Watch the latest movies and TV series online in HD quality.",
  keywords: ["movies", "tv shows", "streaming", "watch online", "HD movies", "free movies", "entertainment"],
  authors: [{ name: "Agasobanuye Movies" }],
  creator: "Agasobanuye Movies",
  publisher: "Agasobanuye Movies",
  generator: "Next.js",
  applicationName: "Agasobanuye Movies",
  referrer: "origin-when-cross-origin",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#5bbad5" },
    ],
  },
  manifest: "/site.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://ag.micorp.pro",
    siteName: "Agasobanuye Movies",
    title: "Agasobanuye Movies - Stream Movies & TV Shows",
    description: "Your ultimate destination for streaming movies and TV shows. Watch the latest movies and TV series online in HD quality.",
    images: [
      {
        url: "/placeholder.jpg",
        width: 1200,
        height: 630,
        alt: "Agasobanuye Movies - Stream Movies & TV Shows",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Agasobanuye Movies - Stream Movies & TV Shows",
    description: "Your ultimate destination for streaming movies and TV shows. Watch the latest movies and TV series online in HD quality.",
    images: ["/placeholder.jpg"],
    creator: "@agmovies",
  },
  verification: {
    google: "your-google-verification-code",
  },
  alternates: {
    canonical: "https://ag.micorp.pro",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ContentRefreshProvider />
        <Suspense fallback={null}>
          {children}
          <Toaster />
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
