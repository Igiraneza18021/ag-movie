import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Browse Movies & TV Shows",
  description: "Explore our vast collection of Agasobanuye translated movies and TV shows. Find the latest releases, trending films, and popular series in HD.",
}

export default function BrowseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
