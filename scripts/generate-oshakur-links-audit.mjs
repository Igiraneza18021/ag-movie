#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises"
import { pathToFileURL } from "node:url"

const SITEMAP_URL = "https://oshakurfilms.com/sitemap.xml"
const DEFAULT_OUTPUT_FILE = process.env.OSHAKUR_AUDIT_FILE?.trim() || "oshakur-links-audit.md"
const PAGE_FETCH_CONCURRENCY = 24
const TMDB_CONCURRENCY = 6
const TMDB_BASE_URL = "https://api.themoviedb.org/3"
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p"
const REQUEST_TIMEOUT_MS = 12000
const MAX_FETCH_RETRIES = 3
const PAGE_PROGRESS_INTERVAL = 100
const TMDB_PROGRESS_INTERVAL = 50

const MOVIE_TMBD_FIELDS = ["poster_path", "poster_url", "backdrop_path", "backdrop_url", "trailer_url", "release_date", "runtime", "vote_average", "vote_count", "genres", "overview"]
const TV_SHOW_TMDB_FIELDS = ["poster_path", "poster_url", "backdrop_path", "backdrop_url", "trailer_url", "first_air_date", "last_air_date", "number_of_seasons", "number_of_episodes", "vote_average", "vote_count", "genres", "overview"]
const SEASON_TMDB_FIELDS = ["tmdb_id", "name", "overview", "poster_path", "poster_url", "air_date", "episode_count"]
const EPISODE_TMDB_FIELDS = ["tmdb_episode_id", "canonical_episode_name"]

const KNOWN_NARRATORS = [
  ["pk agasobanuye mu kinyarwanda", "PK"],
  ["pk agasobanuye mukinyarwanda", "PK"],
  ["rocky agasobanuye mu kinyarwanda", "Rocky"],
  ["rocky agasobanuye mukinyarwanda", "Rocky"],
  ["rocky love story", "Rocky"],
  ["rocky n", "Rocky"],
  ["fey agasobanuye mu kinyarwanda", "Fey"],
  ["fey agasobanuye mukinyarwanda", "Fey"],
  ["skov agasobanuye mu kinyarwanda", "Skov"],
  ["skov agasobanuye mukinyarwanda", "Skov"],
  ["yanga agasobanuye mu kinyarwanda", "Yanga"],
  ["yanga agasobanuye mukinyarwanda", "Yanga"],
  ["kim agasobanuye mu kinyarwanda", "Kim"],
  ["kim agasobanuye mukinyarwanda", "Kim"],
  ["dylan agasobanuye mu kinyarwanda", "Dylan"],
  ["dylan agasobanuye mukinyarwanda", "Dylan"],
  ["junior giti", "Junior Giti"],
  ["junio giti", "Junior Giti"],
  ["pk the sound", "PK The Sound"],
  ["savimbi musa", "Savimbi Musa"],
  ["gaheza simba", "Gaheza Simba"],
  ["gaheya simba", "Gaheya Simba"],
  ["sankra de premier", "Sankra De Premier"],
  ["mr jeromy", "Mr Jeromy"],
  ["vj stepin", "VJ Stepin"],
  ["be the great", "Be The Great"],
  ["b the great", "Be The Great"],
  ["yanga hd", "Yanga"],
  ["junior", "Junior"],
  ["master p", "Master P"],
  ["de premier", "De Premier"],
  ["premier", "Premier"],
  ["savimbi", "Savimbi"],
  ["sankra", "Sankra"],
  ["sankara", "Sankara"],
  ["senior", "Senior"],
  ["gaheza", "Gaheza"],
  ["rocky", "Rocky"],
  ["pk", "PK"],
  ["fey", "Fey"],
  ["yanga", "Yanga"],
  ["andre", "Andre"],
  ["doctor", "Doctor"],
  ["didier", "Didier"],
  ["remmy debande", "Remmy Debande"],
  ["remmy", "Remmy"],
  ["remy", "Remy"],
  ["bigwi", "Bigwi"],
  ["jascov", "Jascov"],
  ["skov", "Skov"],
  ["perfect", "Perfect"],
  ["jovi", "Jovi"],
  ["yakuza", "Yakuza"],
  ["hakim", "Hakim"],
  ["jeromy", "Jeromy"],
  ["steppin", "Steppin"],
  ["habibu", "Habibu"],
  ["moses", "Moses"],
  ["genius", "Genius"],
  ["kim", "Kim"],
  ["nkuba", "Nkuba"],
  ["mungeli", "Mungeli"],
  ["dylan", "Dylan"],
]

const SORTED_NARRATORS = [...KNOWN_NARRATORS].sort((a, b) => b[0].length - a[0].length)
const TRAILING_SOURCE_PHRASES_RE = /(?:\s*[-.]\s*|\s+)(?:agasobanuye\s+mu\s+kinyarw(?:anda|ana)|agasobanuye\s+mukinyarw(?:anda|a)|agasobanuye|free|final|\d+\s*frw|frw)\b.*$/i
const TRAILING_QUALITY_RE = /(?:\s+|[-.]\s*)(?:hd|full\s*hd|fhd|1080p|720p|480p|camrip|hdrip|webrip|web-dl|bluray|brrip|dvdrip|x264|x265)\s*$/i
const TRAILING_NARRATOR_TAIL_RE = /(?:\s+[-.]?\s*(?:free|final|hd|\d+\s*frw|frw))*\s*$/

const IGNORE_HOSTS = new Set([
  "wa.me",
  "www.youtube.com",
  "youtube.com",
  "www.instagram.com",
  "instagram.com",
  "www.tiktok.com",
  "tiktok.com",
  "x.com",
  "twitter.com",
  "www.imdb.com",
  "imdb.com",
  "facebook.com",
  "www.facebook.com",
  "telegram.me",
  "t.me",
])

const IGNORE_ENTRY_LABELS = new Set([
  "",
  "go to home",
  "home",
  "related movies",
  "related shows",
  "related series",
  "back",
  "next",
  "previous",
  "oshakur",
  "oshakur films",
])

const anchorRe = /<a[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/gis
const liRe = /<li[^>]*>(.*?)<\/li>/gis
const spanRe = /<span[^>]*>(.*?)<\/span>/gis
const titleRe = /<title>(.*?)<\/title>/is
const tagRe = /<[^>]+>/g
const urlRe = /^https?:\/\//

const tmdbCache = new Map()

await loadEnvFile(".env")

const TMDB_TOKEN = process.env.NEXT_PUBLIC_TMDB_TOKEN?.trim() || ""
const TMDB_API_KEY = process.env.TMDB_API_KEY?.trim() || ""

if (!TMDB_TOKEN && !TMDB_API_KEY) {
  throw new Error("Missing TMDB credentials. Expected NEXT_PUBLIC_TMDB_TOKEN or TMDB_API_KEY in .env.")
}

function cleanText(value) {
  return value
    .replace(tagRe, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/\s+/g, " ")
    .trim()
}

function normalizeForCompare(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/agasobanuye mu kinyarwanda/g, "")
    .replace(/agasobanuye/g, "")
    .replace(/season\s+\d+/g, "")
    .replace(/\bs\d+\b/g, "")
    .replace(/\bep(?:isode)?\s*\d+[a-z]?\b/g, "")
    .replace(/\bfinal\b/g, "")
    .replace(/\bpart\s+\d+\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function compactCompare(value) {
  return normalizeForCompare(value).replace(/\s+/g, "")
}

function tokenSetCompare(value) {
  return normalizeForCompare(value).split(" ").filter(Boolean).sort().join(" ")
}

function escapeMd(value) {
  return String(value ?? "").replace(/\|/g, "\\|")
}

function hostOf(url) {
  try {
    return new URL(url).host.toLowerCase()
  } catch {
    return ""
  }
}

function slugFromUrl(url) {
  const { pathname } = new URL(url)
  return pathname.split("/").filter(Boolean).at(-1) ?? ""
}

function dedupeBy(items, keyFn) {
  const seen = new Set()
  const out = []
  for (const item of items) {
    const key = keyFn(item)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(item)
  }
  return out
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function cleanSourceTitle(value) {
  return cleanText(String(value ?? ""))
    .replace(/\s+\.\s+/g, " . ")
    .replace(/\s+-\s+/g, " - ")
    .replace(/\s+/g, " ")
    .trim()
}

function trimSourceNoise(value) {
  let output = cleanSourceTitle(value)
  let previous = ""
  while (output && output !== previous) {
    previous = output
    output = output
      .replace(TRAILING_SOURCE_PHRASES_RE, "")
      .replace(TRAILING_QUALITY_RE, "")
      .replace(/\s+[.-]\s*$/, "")
      .replace(/\s{2,}/g, " ")
      .trim()
  }
  return output
}

function findNarratorSuffix(value) {
  const cleaned = trimSourceNoise(value)
  for (const [needle, label] of SORTED_NARRATORS) {
    const escaped = escapeRegex(needle)
    const suffixRe = new RegExp(`(?:^|\\s*[-.]\\s*|\\s+)${escaped}${TRAILING_NARRATOR_TAIL_RE.source}`, "i")
    if (suffixRe.test(cleaned)) return { needle, label }
  }
  return null
}

function guessNarrator(value) {
  return findNarratorSuffix(value)?.label ?? null
}

function stripNarratorSuffix(value) {
  let output = trimSourceNoise(value)
  let previous = ""
  while (output && output !== previous) {
    previous = output
    for (const [needle] of SORTED_NARRATORS) {
      const escaped = escapeRegex(needle)
      output = output.replace(new RegExp(`(?:\\s*[-.]\\s*|\\s+)${escaped}\\b${TRAILING_NARRATOR_TAIL_RE.source}`, "i"), "")
      output = trimSourceNoise(output)
    }
  }
  return output.replace(/\s+[.-]\s*$/, "").trim()
}

function stripPartSuffix(value) {
  return value
    .replace(/\s*[-.]?\s*part\s+\d+\b.*$/i, "")
    .replace(/\s+(\d+)[ABC]\b$/i, " $1")
    .replace(/\s+[ABC]\b$/i, "")
    .replace(/\s+[.-]\s*$/, "")
    .trim()
}

function normalizeMovieTitle(value) {
  return stripPartSuffix(stripNarratorSuffix(value))
    .replace(/\s+\.\s+/g, " ")
    .replace(TRAILING_QUALITY_RE, "")
    .replace(/\s{2,}/g, " ")
    .trim()
}

function extractPartNumber(value) {
  const cleanTitle = stripNarratorSuffix(value)
  const partMatch = cleanTitle.match(/\bpart\s+(\d+)\b/i)
  if (partMatch) return Number(partMatch[1])
  const sequelPartMatch = cleanTitle.match(/\s+\d+([ABC])\b$/i)
  if (sequelPartMatch) return { A: 1, B: 2, C: 3 }[sequelPartMatch[1].toUpperCase()] ?? null
  const letterMatch = cleanTitle.match(/\s+([ABC])\b$/i)
  if (!letterMatch) return null
  return { A: 1, B: 2, C: 3 }[letterMatch[1].toUpperCase()] ?? null
}

function extractSeasonGuess(value) {
  const seasonMatch = value.match(/\bseason\s+0*(\d+)\b/i)
  if (seasonMatch) return Number(seasonMatch[1])
  const sMatch = value.match(/\bs0*(\d+)\b/i)
  if (sMatch) return Number(sMatch[1])
  return null
}

function extractEpisodeGuess(value) {
  const match = value.match(/\bep(?:isode)?\s*0*(\d+)([a-z]+)?\b/i)
  if (!match) return null
  return { number: Number(match[1]), suffix: match[2] ? match[2].toUpperCase() : null }
}

function guessTvShowName(title) {
  return stripNarratorSuffix(title)
    .replace(/\bseason\s+\d+\b.*$/i, "")
    .replace(/\bs\d+\b.*$/i, "")
    .replace(/\bep(?:isode)?\s*\d+[a-z]*\b.*$/i, "")
    .replace(/\bfinal\b.*$/i, "")
    .replace(/\s+[.-]\s*$/, "")
    .replace(TRAILING_QUALITY_RE, "")
    .trim()
}

function isWatchLabel(label) {
  const lower = label.toLowerCase()
  return lower.includes("watch") || lower.includes("stream") || lower.includes("play now")
}

function isDownloadLabel(label) {
  const lower = label.toLowerCase()
  return lower.includes("download") || lower.includes("dl now")
}

function chooseEntryLabel(spans, index, fallbackTitle) {
  for (const span of spans) {
    const lower = span.toLowerCase()
    if (IGNORE_ENTRY_LABELS.has(lower)) continue
    if (/^episode\s+\d+[a-z]?$/i.test(span)) return span
    if (/^ep\s*\d+[a-z]?$/i.test(span)) return span
    if (/^part\s+\d+$/i.test(span)) return span
    if (/^season\s+\d+$/i.test(span)) return span
  }

  const episodeGuess = extractEpisodeGuess(fallbackTitle)
  if (episodeGuess) return `Episode ${episodeGuess.number}${episodeGuess.suffix ?? ""}`

  for (const span of spans) {
    const lower = span.toLowerCase()
    if (IGNORE_ENTRY_LABELS.has(lower)) continue
    if (isWatchLabel(span) || isDownloadLabel(span)) continue
    return span
  }

  return `Entry ${index}`
}

function parsePage(html, url) {
  const title = cleanText(html.match(titleRe)?.[1] ?? slugFromUrl(url)).replace(/\s+\|\s+OSHAkur Films$/i, "").trim()
  const anchors = []

  for (const match of html.matchAll(anchorRe)) {
    const href = match[1]
    if (!urlRe.test(href)) continue
    const host = hostOf(href)
    if (IGNORE_HOSTS.has(host)) continue
    anchors.push({ href, host, text: cleanText(match[2]) })
  }

  const pageWatchLinks = dedupeBy(
    anchors.filter((anchor) => isWatchLabel(anchor.text)).map((anchor) => ({
      label: anchor.text || "Watch",
      url: anchor.href,
      host: anchor.host,
    })),
    (item) => `${item.label}|${item.url}`,
  )

  const pageDownloadLinks = dedupeBy(
    anchors.filter((anchor) => isDownloadLabel(anchor.text)).map((anchor) => ({
      label: anchor.text || "Download",
      url: anchor.href,
      host: anchor.host,
    })),
    (item) => `${item.label}|${item.url}`,
  )

  const entries = []
  let entryIndex = 1
  for (const liMatch of html.matchAll(liRe)) {
    const liHtml = liMatch[1]
    const liAnchors = []
    for (const match of liHtml.matchAll(anchorRe)) {
      const href = match[1]
      if (!urlRe.test(href)) continue
      const host = hostOf(href)
      if (IGNORE_HOSTS.has(host)) continue
      liAnchors.push({ href, host, text: cleanText(match[2]) })
    }
    const watchLinks = liAnchors.filter((anchor) => isWatchLabel(anchor.text))
    const downloadLinks = liAnchors.filter((anchor) => isDownloadLabel(anchor.text))
    if (watchLinks.length === 0 && downloadLinks.length === 0) continue

    const spans = [...liHtml.matchAll(spanRe)].map((match) => cleanText(match[1]))
    const label = chooseEntryLabel(spans, entryIndex, title)
    entries.push({
      label,
      watchLinks: dedupeBy(watchLinks.map((anchor) => ({ url: anchor.href, host: anchor.host })), (item) => item.url),
      downloadLinks: dedupeBy(downloadLinks.map((anchor) => ({ url: anchor.href, host: anchor.host })), (item) => item.url),
    })
    entryIndex += 1
  }

  if (entries.length === 0 && (pageWatchLinks.length > 0 || pageDownloadLinks.length > 0)) {
    entries.push({
      label: "Primary",
      watchLinks: pageWatchLinks.map((item) => ({ url: item.url, host: item.host })),
      downloadLinks: pageDownloadLinks.map((item) => ({ url: item.url, host: item.host })),
    })
  }

  return { title, entries, pageWatchLinks, pageDownloadLinks }
}

function classifyContent(title, slug, entries) {
  if (/part[-\s]*\d+/i.test(title) || /part-\d+/i.test(slug)) return "movie_part"
  if (entries.some((entry) => /^episode\s+\d+/i.test(entry.label))) return "episode_batch"
  if (/\b(season\s+\d+|s\d+|ep(?:isode)?\s*\d+)/i.test(title) || /\b(s\d+|ep\d+)\b/i.test(slug)) return "episode_batch"
  return "movie"
}

function posterUrl(path, size = "w500") {
  return path ? `${IMAGE_BASE_URL}/${size}${path}` : null
}

function hasTmdbValue(value) {
  if (value == null) return false
  if (typeof value === "string") return value.trim() !== ""
  if (Array.isArray(value)) return value.length > 0
  return true
}

function tmdbValue(value) {
  return value == null || value === "" ? "NOT_AVAILABLE_FROM_TMDB" : value
}

function optionalValue(value) {
  return value == null || value === "" ? "OPTIONAL_NOT_SET" : value
}

function rowOptionalValue(value, fallback = "OPTIONAL_NOT_SET") {
  return value == null || value === "" ? fallback : value
}

function addFieldIfPresent(lines, label, value, formatter = (next) => next) {
  if (!hasTmdbValue(value)) return
  lines.push(`- ${label}: \`${formatter(value)}\``)
}

function addIndentedFieldIfPresent(lines, label, value, formatter = (next) => next) {
  if (!hasTmdbValue(value)) return
  lines.push(`  - ${label}: \`${formatter(value)}\``)
}

function addListFieldIfPresent(lines, label, values) {
  if (!Array.isArray(values) || values.length === 0) return
  lines.push(`- ${label}: ${formatList(values)}`)
}

function addIndentedListFieldIfPresent(lines, label, values) {
  if (!Array.isArray(values) || values.length === 0) return
  lines.push(`  - ${label}: ${formatList(values)}`)
}

function computeAvailabilityMap(fieldMap) {
  const available = []
  const unavailable = []
  for (const [field, value] of Object.entries(fieldMap)) {
    if (hasTmdbValue(value)) available.push(field)
    else unavailable.push(field)
  }
  return { available, unavailable }
}

function formatAvailabilityCounts(summary) {
  return Object.entries(summary)
    .map(([field, counts]) => `${field} ${counts.available}/${counts.total}`)
    .join(", ")
}

function createAvailabilityTracker(fields) {
  return Object.fromEntries(fields.map((field) => [field, { available: 0, total: 0 }]))
}

function recordAvailability(tracker, fieldMap) {
  for (const [field, counts] of Object.entries(tracker)) {
    counts.total += 1
    if (hasTmdbValue(fieldMap[field])) counts.available += 1
  }
}

async function loadEnvFile(path) {
  try {
    const content = await readFile(path, "utf8")
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim()
      if (!line || line.startsWith("#") || !line.includes("=")) continue
      const index = line.indexOf("=")
      const key = line.slice(0, index).trim()
      let value = line.slice(index + 1).trim()
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      if (!process.env[key]) process.env[key] = value
    }
  } catch {}
}

async function tmdbRequest(path, params = {}) {
  const url = new URL(`${TMDB_BASE_URL}${path}`)
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === "") continue
    url.searchParams.set(key, String(value))
  }
  if (!TMDB_TOKEN && TMDB_API_KEY) {
    url.searchParams.set("api_key", TMDB_API_KEY)
  }
  const cacheKey = url.toString()
  if (tmdbCache.has(cacheKey)) return tmdbCache.get(cacheKey)

  const promise = (async () => {
    const headers = { "Content-Type": "application/json" }
    if (TMDB_TOKEN) headers.Authorization = TMDB_TOKEN
    const response = await fetchWithRetry(url, { headers })
    if (!response.ok) {
      throw new Error(`TMDB request failed ${response.status} for ${url.pathname}`)
    }
    return response.json()
  })()

  tmdbCache.set(cacheKey, promise)
  return promise
}

function scoreCandidate(query, candidate, mediaType) {
  const queryNorm = normalizeForCompare(query)
  const queryCompact = compactCompare(query)
  const queryTokens = tokenSetCompare(query)
  const candidateName = candidate.title || candidate.name || ""
  const candidateOriginal = candidate.original_title || candidate.original_name || ""
  const candidateNorm = normalizeForCompare(candidateName)
  const originalNorm = normalizeForCompare(candidateOriginal)
  const candidateCompact = compactCompare(candidateName)
  const originalCompact = compactCompare(candidateOriginal)
  const candidateTokens = tokenSetCompare(candidateName)
  const originalTokens = tokenSetCompare(candidateOriginal)
  let score = 0
  let status = "needs_review"
  let notes = []

  if (candidateNorm === queryNorm) {
    score += 100
    status = "exact"
    notes.push("Canonical title/name matched normalized query exactly.")
  } else if (candidateCompact === queryCompact) {
    score += 98
    status = "exact"
    notes.push("Canonical title/name matched query after punctuation/spacing normalization.")
  } else if (originalNorm === queryNorm) {
    score += 96
    status = "alias"
    notes.push("Original TMDB title/name matched normalized query exactly.")
  } else if (originalCompact === queryCompact) {
    score += 94
    status = "alias"
    notes.push("Original TMDB title/name matched query after punctuation/spacing normalization.")
  } else if (candidateTokens === queryTokens) {
    score += 90
    status = "best_effort"
    notes.push("Canonical title/name matched query tokens in a different order.")
  } else if (originalTokens === queryTokens) {
    score += 88
    status = "alias"
    notes.push("Original TMDB title/name matched query tokens in a different order.")
  } else if (candidateNorm.includes(queryNorm) || queryNorm.includes(candidateNorm)) {
    score += 84
    status = "best_effort"
    notes.push("Canonical title/name partially matched query.")
  } else if (originalNorm && (originalNorm.includes(queryNorm) || queryNorm.includes(originalNorm))) {
    score += 80
    status = "alias"
    notes.push("Original TMDB title/name partially matched query.")
  }

  score += Math.min(Number(candidate.popularity || 0), 50) / 5
  score += Math.min(Number(candidate.vote_count || 0), 5000) / 1000

  if (mediaType === "movie" && candidate.release_date) score += 1
  if (mediaType === "tv" && candidate.first_air_date) score += 1
  if (candidate.poster_path) score += 1
  if (candidate.backdrop_path) score += 1

  return { score, status, notes: notes.join(" ") || "No strong lexical match; chose best available search result." }
}

async function findTmdbMatch(mediaType, query) {
  const search = await tmdbRequest(`/search/${mediaType}`, { query, language: "en-US", page: 1 })
  const results = search.results || []
  if (results.length === 0) {
    return { match: null, matchStatus: "needs_review", matchNotes: "No TMDB search results found." }
  }

  const scored = results.map((candidate) => ({
    candidate,
    ...scoreCandidate(query, candidate, mediaType),
  }))
  scored.sort((a, b) => b.score - a.score)
  const best = scored[0]
  return {
    match: best.candidate,
    matchStatus: best.status,
    matchNotes: best.notes,
  }
}

async function fetchTrailerUrl(mediaType, tmdbId) {
  const videos = await tmdbRequest(`/${mediaType}/${tmdbId}/videos`, { language: "en-US" })
  const all = videos.results || []
  const preferred = all.find((video) => video.site === "YouTube" && video.type === "Trailer" && video.official)
    || all.find((video) => video.site === "YouTube" && video.type === "Trailer")
    || all.find((video) => video.site === "YouTube" && video.type === "Teaser")
    || all.find((video) => video.site === "YouTube")
  return preferred ? `https://www.youtube.com/watch?v=${preferred.key}` : null
}

function extractTrailerUrlFromVideos(videos) {
  const all = videos?.results || []
  const preferred = all.find((video) => video.site === "YouTube" && video.type === "Trailer" && video.official)
    || all.find((video) => video.site === "YouTube" && video.type === "Trailer")
    || all.find((video) => video.site === "YouTube" && video.type === "Teaser")
    || all.find((video) => video.site === "YouTube")
  return preferred ? `https://www.youtube.com/watch?v=${preferred.key}` : null
}

async function enrichMovie(baseTitle) {
  try {
    const { match, matchStatus, matchNotes } = await findTmdbMatch("movie", baseTitle)
    if (!match) {
      return {
        matchStatus,
        matchNotes,
        details: null,
        trailerUrl: null,
      }
    }

    const details = await tmdbRequest(`/movie/${match.id}`, { language: "en-US", append_to_response: "videos" })
    const trailerUrl = extractTrailerUrlFromVideos(details.videos) ?? await fetchTrailerUrl("movie", match.id)
    return { matchStatus, matchNotes, details, trailerUrl }
  } catch (error) {
    return {
      matchStatus: "needs_review",
      matchNotes: `TMDB lookup failed: ${error.message}`,
      details: null,
      trailerUrl: null,
    }
  }
}

async function enrichTv(showName) {
  try {
    const { match, matchStatus, matchNotes } = await findTmdbMatch("tv", showName)
    if (!match) {
      return {
        matchStatus,
        matchNotes,
        details: null,
        trailerUrl: null,
      }
    }

    const details = await tmdbRequest(`/tv/${match.id}`, { language: "en-US", append_to_response: "videos" })
    const trailerUrl = extractTrailerUrlFromVideos(details.videos) ?? await fetchTrailerUrl("tv", match.id)
    return { matchStatus, matchNotes, details, trailerUrl }
  } catch (error) {
    return {
      matchStatus: "needs_review",
      matchNotes: `TMDB lookup failed: ${error.message}`,
      details: null,
      trailerUrl: null,
    }
  }
}

async function fetchSeasonDetails(tvId, seasonNumber) {
  if (!tvId || !seasonNumber) return null
  try {
    return await tmdbRequest(`/tv/${tvId}/season/${seasonNumber}`, { language: "en-US" })
  } catch {
    return null
  }
}

async function fetchSitemapUrls() {
  const xml = await fetchText(SITEMAP_URL)
  return dedupeBy(
    [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]).filter((url) => url.includes("/watch/")),
    (url) => url,
  )
}

async function fetchText(url) {
  const response = await fetchWithRetry(url, {
    headers: { "User-Agent": "Mozilla/5.0 AG Movies audit generator" },
  })
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`)
  return response.text()
}

async function fetchWithRetry(url, options = {}) {
  let lastError = null
  for (let attempt = 1; attempt <= MAX_FETCH_RETRIES; attempt += 1) {
    try {
      return await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
    } catch (error) {
      lastError = error
      if (attempt === MAX_FETCH_RETRIES) break
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt))
    }
  }
  throw lastError
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length)
  let nextIndex = 0

  async function worker() {
    while (true) {
      const index = nextIndex
      nextIndex += 1
      if (index >= items.length) return
      results[index] = await mapper(items[index], index)
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

async function loadParsedPagesFromSitemap() {
  const urls = await fetchSitemapUrls()
  console.log(`Fetched sitemap with ${urls.length} /watch/ URLs.`)
  let processed = 0

  const results = await mapWithConcurrency(urls, PAGE_FETCH_CONCURRENCY, async (url) => {
    try {
      const html = await fetchText(url)
      const parsed = parsePage(html, url)
      const slug = slugFromUrl(url)
      return {
        page: {
          ...parsed,
          url,
          slug,
          contentType: classifyContent(parsed.title, slug, parsed.entries),
          narratorGuess: guessNarrator(parsed.title),
        },
        failure: null,
      }
    } catch (error) {
      return {
        page: null,
        failure: {
          url,
          error: error?.message ?? String(error),
        },
      }
    } finally {
      processed += 1
      if (processed % PAGE_PROGRESS_INTERVAL === 0 || processed === urls.length) {
        console.log(`Fetched and parsed ${processed}/${urls.length} live watch pages.`)
      }
    }
  })

  return {
    pages: results.map((result) => result.page).filter(Boolean),
    failures: results.map((result) => result.failure).filter(Boolean),
    totalUrls: urls.length,
  }
}

function buildMovieGroups(pages) {
  const groups = new Map()
  for (const page of pages.filter((page) => page.contentType !== "episode_batch")) {
    const baseTitle = normalizeMovieTitle(page.title)
    const partNumber = extractPartNumber(page.title) ?? (page.contentType === "movie_part" ? 1 : 1)
    const key = `${normalizeForCompare(baseTitle)}`
    if (!groups.has(key)) {
      groups.set(key, {
        baseTitle,
        pages: [],
        hasMultipart: false,
      })
    }
    const group = groups.get(key)
    group.pages.push({
      ...page,
      partNumber,
      narratorGuess: guessNarrator(page.title),
      primaryWatch: page.entries[0]?.watchLinks?.[0] ?? null,
      primaryDownload: page.entries[0]?.downloadLinks?.[0] ?? null,
    })
    if (extractPartNumber(page.title) != null || page.contentType === "movie_part") {
      group.hasMultipart = true
    }
  }
  return [...groups.values()]
}

function inferSeasonFromContext(page, tmdbDetails) {
  const explicit = extractSeasonGuess(page.title) ?? extractSeasonGuess(page.slug)
  if (explicit) return { seasonNumber: explicit, note: "Explicit season found in source title/slug." }
  if (tmdbDetails?.number_of_seasons === 1) return { seasonNumber: 1, note: "Inferred season 1 because TMDB show has exactly one season." }
  return { seasonNumber: null, note: "Season not explicit in source and could not be inferred safely." }
}

function buildTvGroups(pages) {
  const initial = new Map()
  for (const page of pages.filter((page) => page.contentType === "episode_batch")) {
    const showNameGuess = guessTvShowName(page.title) || page.title
    const key = normalizeForCompare(showNameGuess)
    if (!initial.has(key)) {
      initial.set(key, {
        showNameGuess,
        pages: [],
      })
    }
    initial.get(key).pages.push(page)
  }
  return [...initial.values()]
}

function formatList(values) {
  return values.length > 0 ? values.map((value) => `\`${value}\``).join(", ") : "`none`"
}

function formatMovieGroupSection(group, enrichment, availabilityTracker) {
  const details = enrichment.details
  const canonicalTitle = details?.title || group.baseTitle
  const realTmdbId = details?.id ?? "LOOKUP_REQUIRED"
  const partPages = group.pages
    .slice()
    .sort((a, b) => (a.partNumber ?? 1) - (b.partNumber ?? 1) || a.title.localeCompare(b.title))
  const movieFieldMap = {
    poster_path: details?.poster_path,
    poster_url: posterUrl(details?.poster_path),
    backdrop_path: details?.backdrop_path,
    backdrop_url: posterUrl(details?.backdrop_path, "original"),
    trailer_url: enrichment.trailerUrl,
    release_date: details?.release_date,
    runtime: details?.runtime,
    vote_average: details?.vote_average,
    vote_count: details?.vote_count,
    genres: (details?.genres || []).map((genre) => genre.name),
    overview: details?.overview,
  }
  const availability = computeAvailabilityMap(movieFieldMap)
  if (availabilityTracker) recordAvailability(availabilityTracker, movieFieldMap)

  const lines = []
  lines.push(`## ${canonicalTitle}`)
  lines.push("")
  lines.push(`- content_type: \`${group.hasMultipart ? "movie_part" : "movie"}\``)
  lines.push("- upload_target_tables: `movies`")
  lines.push(`- tmdb_match_status: \`${enrichment.matchStatus}\``)
  lines.push(`- tmdb_match_notes: \`${enrichment.matchNotes}\``)
  lines.push(`- real_tmdb_id: \`${realTmdbId}\``)
  lines.push(`- canonical_title: \`${canonicalTitle}\``)
  lines.push(`- original_title: \`${details?.original_title ?? canonicalTitle}\``)
  lines.push(`- normalized_title_guess: \`${group.baseTitle}\``)
  lines.push(`- narrators_found: ${formatList(dedupeBy(partPages.map((page) => page.narratorGuess).filter(Boolean), (value) => value))}`)
  lines.push(`- tmdb_available_fields: ${formatList(availability.available)}`)
  lines.push(`- tmdb_unavailable_fields: ${formatList(availability.unavailable)}`)
  addFieldIfPresent(lines, "poster_path", movieFieldMap.poster_path)
  addFieldIfPresent(lines, "poster_url", movieFieldMap.poster_url)
  addFieldIfPresent(lines, "backdrop_path", movieFieldMap.backdrop_path)
  addFieldIfPresent(lines, "backdrop_url", movieFieldMap.backdrop_url)
  addFieldIfPresent(lines, "trailer_url", movieFieldMap.trailer_url)
  addFieldIfPresent(lines, "release_date", movieFieldMap.release_date)
  addFieldIfPresent(lines, "runtime", movieFieldMap.runtime)
  addFieldIfPresent(lines, "vote_average", movieFieldMap.vote_average)
  addFieldIfPresent(lines, "vote_count", movieFieldMap.vote_count)
  addListFieldIfPresent(lines, "genres", movieFieldMap.genres)
  lines.push("- movie_row:")
  lines.push(`  - import_tmdb_id: \`${realTmdbId}\``)
  lines.push(`  - title: \`${canonicalTitle}\``)
  addIndentedFieldIfPresent(lines, "overview", movieFieldMap.overview)
  addIndentedFieldIfPresent(lines, "poster_path", movieFieldMap.poster_path)
  addIndentedFieldIfPresent(lines, "backdrop_path", movieFieldMap.backdrop_path)
  addIndentedFieldIfPresent(lines, "release_date", movieFieldMap.release_date)
  addIndentedFieldIfPresent(lines, "runtime", movieFieldMap.runtime)
  addIndentedFieldIfPresent(lines, "vote_average", movieFieldMap.vote_average)
  addIndentedFieldIfPresent(lines, "vote_count", movieFieldMap.vote_count)
  addIndentedListFieldIfPresent(lines, "genres", movieFieldMap.genres)
  addIndentedFieldIfPresent(lines, "trailer_url", movieFieldMap.trailer_url)
  lines.push(`  - status: \`active\``)
  lines.push(`  - scheduled_release: \`OPTIONAL_NOT_SET\``)
  lines.push("- movie_parts:")
  lines.push("| part_number | source_title | source_page_url | narrator_guess | real_tmdb_id | import_tmdb_id | embed_url | watch_host | download_url | download_host | notes |")
  lines.push("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |")
  for (const page of partPages) {
    const importTmdbId = typeof realTmdbId === "number" && (page.partNumber ?? 1) > 1 ? realTmdbId + (page.partNumber ?? 1) : realTmdbId
    const notes = page.partNumber > 1
      ? "Import tmdb_id follows current app rule: base real_tmdb_id + part_number."
      : group.hasMultipart
        ? "Part 1 / base movie row."
        : ""
    lines.push(`| ${escapeMd(page.partNumber ?? 1)} | ${escapeMd(page.title)} | ${escapeMd(page.url)} | ${escapeMd(page.narratorGuess ?? "UNSPECIFIED")} | ${escapeMd(realTmdbId)} | ${escapeMd(importTmdbId)} | ${escapeMd(page.primaryWatch?.url ?? "MISSING")} | ${escapeMd(page.primaryWatch?.host ?? "MISSING")} | ${escapeMd(rowOptionalValue(page.primaryDownload?.url, "NO_DOWNLOAD_LINK_FOUND"))} | ${escapeMd(rowOptionalValue(page.primaryDownload?.host, "NO_DOWNLOAD_LINK_FOUND"))} | ${escapeMd(notes)} |`)
  }
  lines.push("")
  return lines.join("\n")
}

async function enrichTvGroup(group) {
  const enrichment = await enrichTv(group.showNameGuess)
  const details = enrichment.details
  const resolvedKey = details?.id ? `tmdb:${details.id}` : `guess:${normalizeForCompare(group.showNameGuess)}`
  return { ...group, enrichment, resolvedKey }
}

function mergeTvGroupsByResolvedKey(groups) {
  const merged = new Map()
  for (const group of groups) {
    if (!merged.has(group.resolvedKey)) {
      merged.set(group.resolvedKey, {
        showNameGuess: group.showNameGuess,
        enrichment: group.enrichment,
        pages: [],
      })
    }
    const target = merged.get(group.resolvedKey)
    target.pages.push(...group.pages)
    if ((group.enrichment.details?.popularity ?? 0) > (target.enrichment.details?.popularity ?? 0)) {
      target.showNameGuess = group.showNameGuess
      target.enrichment = group.enrichment
    }
  }
  return [...merged.values()]
}

async function formatTvGroupSection(group, availabilityTrackers) {
  const details = group.enrichment.details
  const canonicalName = details?.name || group.showNameGuess
  const aliases = dedupeBy(group.pages.map((page) => guessTvShowName(page.title) || page.title), (value) => normalizeForCompare(value))
  const narratorSet = dedupeBy(group.pages.map((page) => guessNarrator(page.title)).filter(Boolean), (value) => value)
  const showFieldMap = {
    poster_path: details?.poster_path,
    poster_url: posterUrl(details?.poster_path),
    backdrop_path: details?.backdrop_path,
    backdrop_url: posterUrl(details?.backdrop_path, "original"),
    trailer_url: group.enrichment.trailerUrl,
    first_air_date: details?.first_air_date,
    last_air_date: details?.last_air_date,
    number_of_seasons: details?.number_of_seasons,
    number_of_episodes: details?.number_of_episodes,
    vote_average: details?.vote_average,
    vote_count: details?.vote_count,
    genres: (details?.genres || []).map((genre) => genre.name),
    overview: details?.overview,
  }
  const showAvailability = computeAvailabilityMap(showFieldMap)
  recordAvailability(availabilityTrackers.tvShows, showFieldMap)

  const seasonBuckets = new Map()
  for (const page of group.pages) {
    const inferredSeason = inferSeasonFromContext(page, details)
    const seasonKey = inferredSeason.seasonNumber == null ? "unresolved" : String(inferredSeason.seasonNumber)
    if (!seasonBuckets.has(seasonKey)) {
      seasonBuckets.set(seasonKey, {
        seasonNumber: inferredSeason.seasonNumber,
        inferenceNotes: new Set(),
        pages: [],
      })
    }
    const bucket = seasonBuckets.get(seasonKey)
    bucket.inferenceNotes.add(inferredSeason.note)
    bucket.pages.push(page)
  }

  const seasonEntries = [...seasonBuckets.values()].sort((a, b) => {
    if (a.seasonNumber == null) return 1
    if (b.seasonNumber == null) return -1
    return a.seasonNumber - b.seasonNumber
  })

  const seasonDetailsMap = new Map()
  await Promise.all(seasonEntries.map(async (seasonEntry) => {
    if (details?.id && seasonEntry.seasonNumber != null) {
      seasonDetailsMap.set(seasonEntry.seasonNumber, await fetchSeasonDetails(details.id, seasonEntry.seasonNumber))
    }
  }))

  const lines = []
  lines.push(`## ${canonicalName}`)
  lines.push("")
  lines.push("- content_type: `tv_show`")
  lines.push("- upload_target_tables: `tv_shows`, `seasons`, `episodes`")
  lines.push(`- tmdb_match_status: \`${group.enrichment.matchStatus}\``)
  lines.push(`- tmdb_match_notes: \`${group.enrichment.matchNotes}\``)
  lines.push(`- real_tmdb_id: \`${details?.id ?? "LOOKUP_REQUIRED"}\``)
  lines.push(`- canonical_name: \`${canonicalName}\``)
  lines.push(`- original_name: \`${details?.original_name ?? canonicalName}\``)
  lines.push(`- aliases_found_in_source: ${formatList(aliases)}`)
  lines.push(`- narrators_found: ${formatList(narratorSet)}`)
  lines.push(`- tmdb_available_fields: ${formatList(showAvailability.available)}`)
  lines.push(`- tmdb_unavailable_fields: ${formatList(showAvailability.unavailable)}`)
  addFieldIfPresent(lines, "poster_path", showFieldMap.poster_path)
  addFieldIfPresent(lines, "poster_url", showFieldMap.poster_url)
  addFieldIfPresent(lines, "backdrop_path", showFieldMap.backdrop_path)
  addFieldIfPresent(lines, "backdrop_url", showFieldMap.backdrop_url)
  addFieldIfPresent(lines, "trailer_url", showFieldMap.trailer_url)
  addFieldIfPresent(lines, "first_air_date", showFieldMap.first_air_date)
  addFieldIfPresent(lines, "last_air_date", showFieldMap.last_air_date)
  addFieldIfPresent(lines, "number_of_seasons", showFieldMap.number_of_seasons)
  addFieldIfPresent(lines, "number_of_episodes", showFieldMap.number_of_episodes)
  addFieldIfPresent(lines, "vote_average", showFieldMap.vote_average)
  addFieldIfPresent(lines, "vote_count", showFieldMap.vote_count)
  addListFieldIfPresent(lines, "genres", showFieldMap.genres)
  lines.push("- tv_show_row:")
  lines.push(`  - tmdb_id: \`${details?.id ?? "LOOKUP_REQUIRED"}\``)
  lines.push(`  - name: \`${canonicalName}\``)
  addIndentedFieldIfPresent(lines, "overview", showFieldMap.overview)
  addIndentedFieldIfPresent(lines, "poster_path", showFieldMap.poster_path)
  addIndentedFieldIfPresent(lines, "backdrop_path", showFieldMap.backdrop_path)
  addIndentedFieldIfPresent(lines, "first_air_date", showFieldMap.first_air_date)
  addIndentedFieldIfPresent(lines, "last_air_date", showFieldMap.last_air_date)
  addIndentedFieldIfPresent(lines, "number_of_seasons", showFieldMap.number_of_seasons)
  addIndentedFieldIfPresent(lines, "number_of_episodes", showFieldMap.number_of_episodes)
  addIndentedFieldIfPresent(lines, "vote_average", showFieldMap.vote_average)
  addIndentedFieldIfPresent(lines, "vote_count", showFieldMap.vote_count)
  addIndentedListFieldIfPresent(lines, "genres", showFieldMap.genres)
  addIndentedFieldIfPresent(lines, "trailer_url", showFieldMap.trailer_url)
  lines.push(`  - download_url: \`OPTIONAL_NOT_SET\``)
  lines.push(`  - narrator: ${formatList(narratorSet)}`)
  lines.push(`  - status: \`active\``)
  lines.push(`  - scheduled_release: \`OPTIONAL_NOT_SET\``)

  for (const seasonEntry of seasonEntries) {
    const seasonDetails = seasonEntry.seasonNumber != null ? seasonDetailsMap.get(seasonEntry.seasonNumber) : null
    const seasonFieldMap = {
      tmdb_id: seasonDetails?.id,
      name: seasonDetails?.name,
      overview: seasonDetails?.overview,
      poster_path: seasonDetails?.poster_path,
      poster_url: posterUrl(seasonDetails?.poster_path),
      air_date: seasonDetails?.air_date,
      episode_count: seasonDetails?.episodes?.length,
    }
    const seasonAvailability = computeAvailabilityMap(seasonFieldMap)
    recordAvailability(availabilityTrackers.seasons, seasonFieldMap)
    lines.push("")
    lines.push(`### Season ${seasonEntry.seasonNumber ?? "LOOKUP_REQUIRED"}`)
    lines.push("")
    lines.push(`- tmdb_available_fields: ${formatList(seasonAvailability.available)}`)
    lines.push(`- tmdb_unavailable_fields: ${formatList(seasonAvailability.unavailable)}`)
    lines.push("- season_row:")
    lines.push("  - tv_show_id: `RESOLVED_AFTER_TV_SHOW_INSERT`")
    lines.push(`  - tmdb_id: \`${seasonDetails?.id ?? "LOOKUP_REQUIRED"}\``)
    lines.push(`  - season_number: \`${seasonEntry.seasonNumber ?? "LOOKUP_REQUIRED"}\``)
    lines.push(`  - name: \`${seasonDetails?.name ?? `Season ${seasonEntry.seasonNumber ?? "LOOKUP_REQUIRED"}`}\``)
    addIndentedFieldIfPresent(lines, "overview", seasonFieldMap.overview)
    addIndentedFieldIfPresent(lines, "poster_path", seasonFieldMap.poster_path)
    addIndentedFieldIfPresent(lines, "poster_url", seasonFieldMap.poster_url)
    addIndentedFieldIfPresent(lines, "air_date", seasonFieldMap.air_date)
    lines.push(`  - episode_count: \`${seasonDetails?.episodes?.length ?? seasonEntry.pages.length}\``)
    lines.push(`  - inference_notes: ${formatList([...seasonEntry.inferenceNotes])}`)
    lines.push("- episode_rows:")
    lines.push("| season_number | episode_number | episode_suffix | tmdb_episode_id | canonical_episode_name | source_title | source_page_url | embed_url | watch_host | download_url | download_host | notes |")
    lines.push("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |")

    const tmdbEpisodeMap = new Map((seasonDetails?.episodes || []).map((episode) => [episode.episode_number, episode]))
    const usedKeys = new Set()

    const flattenedRows = []
    for (const page of seasonEntry.pages) {
      const narratorGuess = guessNarrator(page.title)
      for (const entry of page.entries) {
        const guess = extractEpisodeGuess(entry.label) ?? extractEpisodeGuess(page.title) ?? extractEpisodeGuess(page.slug)
        const episodeNumber = guess?.number ?? "LOOKUP_REQUIRED"
        const episodeSuffix = guess?.suffix ?? ""
        const episodeData = typeof episodeNumber === "number" ? tmdbEpisodeMap.get(episodeNumber) : null
        const rowKey = `${page.url}|${entry.label}|${episodeNumber}|${entry.watchLinks[0]?.url ?? ""}`
        if (usedKeys.has(rowKey)) continue
        usedKeys.add(rowKey)
        if (!episodeData?.id) continue
        const notes = []
        if (episodeSuffix) notes.push("Suffix present; verify whether source split maps to one TMDB episode.")
        if (narratorGuess) notes.push(`Narrator guess: ${narratorGuess}.`)
        const episodeFieldMap = {
          tmdb_episode_id: episodeData?.id,
          canonical_episode_name: episodeData?.name,
        }
        recordAvailability(availabilityTrackers.episodes, episodeFieldMap)
        flattenedRows.push({
          seasonNumber: seasonEntry.seasonNumber ?? "LOOKUP_REQUIRED",
          episodeNumber,
          episodeSuffix,
          tmdbEpisodeId: episodeData?.id ?? "LOOKUP_REQUIRED",
          canonicalEpisodeName: episodeData?.name ?? entry.label,
          sourceTitle: page.title,
          sourcePageUrl: page.url,
          embedUrl: entry.watchLinks[0]?.url ?? "MISSING",
          watchHost: entry.watchLinks[0]?.host ?? "MISSING",
          downloadUrl: entry.downloadLinks[0]?.url ?? "NO_DOWNLOAD_LINK_FOUND",
          downloadHost: entry.downloadLinks[0]?.host ?? "NO_DOWNLOAD_LINK_FOUND",
          notes: notes.join(" "),
        })
      }
    }

    if (!seasonDetails?.id || flattenedRows.length === 0) {
      continue
    }

    flattenedRows.sort((a, b) => {
      const aNum = typeof a.episodeNumber === "number" ? a.episodeNumber : Number.MAX_SAFE_INTEGER
      const bNum = typeof b.episodeNumber === "number" ? b.episodeNumber : Number.MAX_SAFE_INTEGER
      if (aNum !== bNum) return aNum - bNum
      return a.sourceTitle.localeCompare(b.sourceTitle)
    })

    for (const row of flattenedRows) {
      lines.push(`| ${escapeMd(row.seasonNumber)} | ${escapeMd(row.episodeNumber)} | ${escapeMd(row.episodeSuffix)} | ${escapeMd(row.tmdbEpisodeId)} | ${escapeMd(row.canonicalEpisodeName)} | ${escapeMd(row.sourceTitle)} | ${escapeMd(row.sourcePageUrl)} | ${escapeMd(row.embedUrl)} | ${escapeMd(row.watchHost)} | ${escapeMd(row.downloadUrl)} | ${escapeMd(row.downloadHost)} | ${escapeMd(row.notes)} |`)
    }
  }

  lines.push("")
  return lines.join("\n")
}

function buildIntro(summary) {
  const lines = []
  lines.push("# OSHAkur Links Audit for AG Movies Bulk Upload")
  lines.push("")
  lines.push(`- Generated from sitemap: \`${SITEMAP_URL}\``)
  lines.push(`- Total sitemap \`/watch/\` URLs found: **${summary.totalSitemapUrls}**`)
  lines.push(`- Successfully parsed live pages: **${summary.totalSourcePages}**`)
  lines.push(`- Failed live page fetches: **${summary.failedPages}**`)
  lines.push(`- TMDB-matched movie entities shown: **${summary.movieGroups}**`)
  lines.push(`- TMDB-matched TV show entities shown: **${summary.tvGroups}**`)
  lines.push(`- Skipped unmatched movie entities: **${summary.skippedMovies}**`)
  lines.push(`- Skipped unmatched TV show entities: **${summary.skippedTvGroups}**`)
  lines.push(`- Pages still missing any download link: **${summary.missingDownloads}**`)
  lines.push(`- Generated on: **${new Date().toISOString()}**`)
  lines.push("")
  lines.push("## TMDB Field Availability Summary")
  lines.push("")
  lines.push(`- movies: ${formatAvailabilityCounts(summary.availability.movies)}`)
  lines.push(`- tv_shows: ${formatAvailabilityCounts(summary.availability.tvShows)}`)
  lines.push(`- seasons: ${formatAvailabilityCounts(summary.availability.seasons)}`)
  lines.push(`- episodes: ${formatAvailabilityCounts(summary.availability.episodes)}`)
  lines.push("")
  if (summary.failures.length > 0) {
    lines.push("## Fetch Failures")
    lines.push("")
    lines.push("| source_page_url | error |")
    lines.push("| --- | --- |")
    for (const failure of summary.failures) {
      lines.push(`| ${escapeMd(failure.url)} | ${escapeMd(failure.error)} |`)
    }
    lines.push("")
  }
  lines.push("## Upload Workflow Notes")
  lines.push("")
  lines.push("- The current AG Movies admin flow is TMDB-first, then manual Supabase insert.")
  lines.push("- This generator now performs TMDB best-effort matching and marks every entity with `tmdb_match_status` and `tmdb_match_notes`.")
  lines.push("- TV content is grouped by resolved show so repeated episode pages collapse into one canonical show section with seasons and episode rows.")
  lines.push("- Multipart movies expose both the real TMDB id and the synthetic `import_tmdb_id` the current app uses for later parts.")
  lines.push("- Trailer, poster, backdrop, overview, release/air dates, vote data, and genres come from TMDB when available.")
  lines.push("- Unmatched top-level entities are skipped from this file; the output now shows only TMDB-backed movie and TV entries.")
  lines.push("")
  lines.push("## Required Fields by Target Table")
  lines.push("")
  lines.push("- `movies`: `tmdb_id`, `title`, TMDB metadata, `embed_url`, optional `download_url`, optional `narrator`, `part_number`, `parent_movie_id`, `status`, optional `scheduled_release`")
  lines.push("- `tv_shows`: `tmdb_id`, `name`, TMDB metadata, optional `download_url`, optional `narrator`, `status`, optional `scheduled_release`")
  lines.push("- `seasons`: `tv_show_id`, `tmdb_id`, `season_number`, `name`, optional overview/poster/air date, `episode_count`")
  lines.push("- `episodes`: `season_id`, `tv_show_id`, `tmdb_id`, `season_number`, `episode_number`, `name`, optional TMDB metadata, `embed_url`, optional `download_url`")
  lines.push("")
  lines.push("## Content Inventory")
  lines.push("")
  return lines.join("\n")
}

export async function main(options = {}) {
  const outputFile = options.outputFile?.trim() || process.env.OSHAKUR_AUDIT_FILE?.trim() || DEFAULT_OUTPUT_FILE
  const { pages: parsedPages, failures, totalUrls } = await loadParsedPagesFromSitemap()
  console.log(`Parsed ${parsedPages.length} live source pages. Failed ${failures.length} pages.`)

  const movieGroups = buildMovieGroups(parsedPages)
  const tvSeedGroups = buildTvGroups(parsedPages)
  console.log(`Grouped into ${movieGroups.length} movie entities and ${tvSeedGroups.length} preliminary TV show entities.`)
  const availability = {
    movies: createAvailabilityTracker(MOVIE_TMBD_FIELDS),
    tvShows: createAvailabilityTracker(TV_SHOW_TMDB_FIELDS),
    seasons: createAvailabilityTracker(SEASON_TMDB_FIELDS),
    episodes: createAvailabilityTracker(EPISODE_TMDB_FIELDS),
  }
  let enrichedMovieCount = 0

  const enrichedMovies = await mapWithConcurrency(movieGroups, TMDB_CONCURRENCY, async (group) => {
    try {
      return {
        group,
        enrichment: await enrichMovie(group.baseTitle),
      }
    } finally {
      enrichedMovieCount += 1
      if (enrichedMovieCount % TMDB_PROGRESS_INTERVAL === 0 || enrichedMovieCount === movieGroups.length) {
        console.log(`Enriched ${enrichedMovieCount}/${movieGroups.length} movie entities from TMDB.`)
      }
    }
  })
  console.log(`Enriched ${enrichedMovies.length} movie entities from TMDB.`)

  let enrichedTvSeedCount = 0
  const enrichedTvSeeds = await mapWithConcurrency(tvSeedGroups, TMDB_CONCURRENCY, async (group) => {
    try {
      return await enrichTvGroup(group)
    } finally {
      enrichedTvSeedCount += 1
      if (enrichedTvSeedCount % TMDB_PROGRESS_INTERVAL === 0 || enrichedTvSeedCount === tvSeedGroups.length) {
        console.log(`Resolved ${enrichedTvSeedCount}/${tvSeedGroups.length} preliminary TV entities through TMDB.`)
      }
    }
  })
  const mergedTvGroups = mergeTvGroupsByResolvedKey(enrichedTvSeeds)
  console.log(`Resolved and merged TV entities into ${mergedTvGroups.length} canonical show groups.`)

  const matchedMovies = enrichedMovies.filter(({ enrichment }) => enrichment.details?.id)
  const matchedTvGroups = mergedTvGroups.filter((group) => group.enrichment.details?.id)
  console.log(`Keeping ${matchedMovies.length}/${enrichedMovies.length} movies and ${matchedTvGroups.length}/${mergedTvGroups.length} TV groups with TMDB ids.`)

  const movieSections = matchedMovies
    .sort((a, b) => (a.enrichment.details?.title || a.group.baseTitle).localeCompare(b.enrichment.details?.title || b.group.baseTitle))
    .map(({ group, enrichment }) => formatMovieGroupSection(group, enrichment, availability.movies))

  const tvSections = await mapWithConcurrency(
    matchedTvGroups.sort((a, b) => (a.enrichment.details?.name || a.showNameGuess).localeCompare(b.enrichment.details?.name || b.showNameGuess)),
    3,
    (group) => formatTvGroupSection(group, availability),
  )
  console.log(`Built ${tvSections.length} TV show sections.`)
  const summary = {
    totalSitemapUrls: totalUrls,
    totalSourcePages: parsedPages.length,
    failedPages: failures.length,
    failures,
    movieGroups: matchedMovies.length,
    tvGroups: matchedTvGroups.length,
    skippedMovies: enrichedMovies.length - matchedMovies.length,
    skippedTvGroups: mergedTvGroups.length - matchedTvGroups.length,
    missingDownloads: parsedPages.filter((page) => page.entries.some((entry) => entry.downloadLinks.length === 0)).length,
    availability,
  }

  const lines = [buildIntro(summary)]
  lines.push(...movieSections)
  lines.push(...tvSections)

  await writeFile(outputFile, lines.join("\n"), "utf8")
  console.log(`Wrote ${outputFile} with ${enrichedMovies.length + mergedTvGroups.length} grouped content entities.`)
}

function isDirectRun() {
  const entry = process.argv[1]
  return Boolean(entry) && import.meta.url === pathToFileURL(entry).href
}

if (isDirectRun()) {
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
