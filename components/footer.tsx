"use client"

import Link from "next/link"
import Image from "next/image"
import { Github, Instagram } from "lucide-react"

const sections = [
  {
    title: "Explore",
    links: [
      { label: "Home", href: "/" },
      { label: "Movies", href: "/movies" },
      { label: "TV Shows", href: "/tv-shows" },
      { label: "Categories", href: "/categories" },
      { label: "Coming Soon", href: "/coming-soon" },
      { label: "Browse All", href: "/list" },
    ],
  },
  {
    title: "My List",
    links: [
      { label: "Watchlist", href: "/watchlist" },
      { label: "Request Content", href: "/request-movie" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
    ],
  },
  {
    title: "About",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Our Team", href: "/team" },
      { label: "FAQ", href: "/faq" },
    ],
  },
]

const socials = [
  { icon: Github, href: "https://github.com/chaste-djaziri", label: "GitHub" },
  { icon: Instagram, href: "https://instagram.com/_nepoflix", label: "Instagram" },
]

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-[#090a0a] border-t border-white/10 py-12 px-4 sm:px-6 mt-16 relative">
      <div className="max-w-6xl mx-auto grid gap-10 md:grid-cols-[1.2fr,2fr] items-start">
        {/* Brand + blurb */}
        <div>
          <Link href="/" className="inline-flex items-center space-x-3">
            <Image
              src="/image.png"
              alt="Agasobanuye Movies Logo"
              width={48}
              height={48}
              className="object-contain"
            />
            <h2 className="text-2xl font-semibold text-white">AGASOBANUYE MOVIES</h2>
          </Link>
          <p className="text-gray-400 mt-1 text-sm leading-6 max-w-md">
            Stream the latest movies, TV shows with high quality video. Your ultimate entertainment destination.
          </p>

          {/* Socials */}
          <div className="flex items-center gap-5 mt-4">
            {socials.map((s) => {
              const Icon = s.icon
              return (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="text-gray-400 hover:text-white transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/30"
                >
                  <Icon className="h-6 w-6" />
                  <span className="sr-only">{s.label}</span>
                </a>
              )
            })}
          </div>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8">
          {sections.map((section) => (
            <nav key={section.title} aria-labelledby={`footer-${section.title}`}>
              <h3 id={`footer-${section.title}`} className="text-white font-medium mb-3">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      {/* Back to top */}
      <div className="flex justify-end mt-4">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-white text-sm transition-colors duration-200"
          aria-label="Back to top"
        >
          ↑
        </button>
      </div>

      {/* Bottom bar */}
      <div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-white/10 flex flex-col items-center gap-1 text-xs text-gray-400">
        <span className="text-gray-500">© {year} Agasobanuye Movies. All rights reserved.</span>
        <span className="text-gray-400 text-center">
          Agasobanuye Movies does not store any files on our server. All content is provided by non-affiliated third parties.
        </span>
      </div>
    </footer>
  )
}