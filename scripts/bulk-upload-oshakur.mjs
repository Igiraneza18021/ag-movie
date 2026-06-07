#!/usr/bin/env node

import { readFile } from "node:fs/promises"
import { createClient } from "@supabase/supabase-js"
import { pathToFileURL } from "node:url"

const APPLY_FLAG = "--apply"
const DRY_RUN_FLAG = "--dry-run"
const SUPABASE_PAGE_SIZE = 1000

await loadEnvFile(".env")

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || ""
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || ""
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || ""

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.")
}

let auditFile = process.env.OSHAKUR_AUDIT_FILE?.trim() || "oshakur-links-audit.md"
let dryRunMode = true
let supabase = null
let currentAuditRunId = null
let pendingChangeLogs = []
const MAX_PREVIEW_CHANGES = 12

function parseScalar(raw) {
  if (raw == null) return null
  const value = String(raw).trim()
  if (!value || value === "none" || value === "OPTIONAL_NOT_SET" || value === "NO_DOWNLOAD_LINK_FOUND" || value === "MISSING") return null
  if (value === "LOOKUP_REQUIRED") return null
  return value
}

function parseNumeric(raw) {
  const value = parseScalar(raw)
  if (value == null) return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function parseList(raw) {
  if (!raw) return []
  return [...String(raw).matchAll(/`([^`]*)`/g)].map((match) => match[1]).filter((value) => value && value !== "none")
}

function parseMarkdownTable(block) {
  const lines = block.split(/\r?\n/).filter(Boolean)
  const headerIndex = lines.findIndex((line) => line.startsWith("|"))
  if (headerIndex === -1 || lines.length < headerIndex + 3) return []
  const headers = lines[headerIndex].split("|").slice(1, -1).map((cell) => cell.trim())
  const rows = []
  for (let i = headerIndex + 2; i < lines.length; i += 1) {
    const line = lines[i]
    if (!line.startsWith("|")) break
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim().replace(/\\\|/g, "|"))
    if (cells.length < headers.length) continue
    rows.push(Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""])))
  }
  return rows
}

function parseTopLevelField(block, label) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const match = block.match(new RegExp("^- " + escapedLabel + ": `([^\\n]*)`", "m"))
  return match?.[1] ?? null
}

function parseTopLevelListField(block, label) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const match = block.match(new RegExp("^- " + escapedLabel + ": ([^\\n]+)", "m"))
  return match?.[1] ?? null
}

function parseIndentedField(block, label) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const match = block.match(new RegExp("^  - " + escapedLabel + ": `([^\\n]*)`", "m"))
  return match?.[1] ?? null
}

function parseMoviesSection(title, block) {
  const moviePartsMatch = block.match(/- movie_parts:\n([\s\S]*)$/)
  if (!moviePartsMatch) return null
  const partRows = parseMarkdownTable(moviePartsMatch[1]).map((row) => ({
    partNumber: parseNumeric(row.part_number),
    sourceTitle: parseScalar(row.source_title),
    sourcePageUrl: parseScalar(row.source_page_url),
    narratorGuess: parseScalar(row.narrator_guess) === "UNSPECIFIED" ? null : parseScalar(row.narrator_guess),
    realTmdbId: parseNumeric(row.real_tmdb_id),
    importTmdbId: parseNumeric(row.import_tmdb_id),
    embedUrl: parseScalar(row.embed_url),
    downloadUrl: parseScalar(row.download_url),
  })).filter((row) => row.importTmdbId && row.embedUrl)

  const realTmdbId = parseNumeric(parseTopLevelField(block, "real_tmdb_id"))
  if (!realTmdbId || partRows.length === 0) return null

  return {
    kind: "movie",
    sectionTitle: title,
    contentType: parseScalar(parseTopLevelField(block, "content_type")) || "movie",
    realTmdbId,
    canonicalTitle: parseScalar(parseTopLevelField(block, "canonical_title")) || title,
    movieRow: {
      title: parseScalar(parseIndentedField(block, "title")) || parseScalar(parseTopLevelField(block, "canonical_title")) || title,
      overview: parseScalar(parseIndentedField(block, "overview")),
      poster_path: parseScalar(parseIndentedField(block, "poster_path")),
      backdrop_path: parseScalar(parseIndentedField(block, "backdrop_path")),
      release_date: parseScalar(parseIndentedField(block, "release_date")),
      runtime: parseNumeric(parseIndentedField(block, "runtime")),
      vote_average: parseNumeric(parseIndentedField(block, "vote_average")),
      vote_count: parseNumeric(parseIndentedField(block, "vote_count")),
      genres: parseList(parseTopLevelListField(block, "genres") || ""),
      trailer_url: parseScalar(parseIndentedField(block, "trailer_url")),
      status: parseScalar(parseIndentedField(block, "status")) || "active",
      scheduled_release: parseScalar(parseIndentedField(block, "scheduled_release")),
    },
    parts: partRows,
  }
}

function parseTvSection(title, block) {
  const realTmdbId = parseNumeric(parseTopLevelField(block, "real_tmdb_id"))
  if (!realTmdbId) return null

  const show = {
    kind: "tv_show",
    sectionTitle: title,
    realTmdbId,
    canonicalName: parseScalar(parseTopLevelField(block, "canonical_name")) || title,
    tvShowRow: {
      name: parseScalar(parseIndentedField(block, "name")) || title,
      overview: parseScalar(parseIndentedField(block, "overview")),
      poster_path: parseScalar(parseIndentedField(block, "poster_path")),
      backdrop_path: parseScalar(parseIndentedField(block, "backdrop_path")),
      first_air_date: parseScalar(parseIndentedField(block, "first_air_date")),
      last_air_date: parseScalar(parseIndentedField(block, "last_air_date")),
      number_of_seasons: parseNumeric(parseIndentedField(block, "number_of_seasons")),
      number_of_episodes: parseNumeric(parseIndentedField(block, "number_of_episodes")),
      vote_average: parseNumeric(parseIndentedField(block, "vote_average")),
      vote_count: parseNumeric(parseIndentedField(block, "vote_count")),
      genres: parseList(parseTopLevelListField(block, "genres") || ""),
      trailer_url: parseScalar(parseIndentedField(block, "trailer_url")),
      download_url: parseScalar(parseIndentedField(block, "download_url")),
      narrator: parseList(block.match(/^  - narrator: ([^\n]+)/m)?.[1] ?? "").join(", ") || null,
      status: parseScalar(parseIndentedField(block, "status")) || "active",
      scheduled_release: parseScalar(parseIndentedField(block, "scheduled_release")),
    },
    seasons: [],
  }

  const seasonBlocks = block.split(/\n### /).slice(1)
  for (const seasonBlock of seasonBlocks) {
    const newlineIndex = seasonBlock.indexOf("\n")
    const heading = newlineIndex === -1 ? seasonBlock.trim() : seasonBlock.slice(0, newlineIndex).trim()
    const body = newlineIndex === -1 ? "" : seasonBlock.slice(newlineIndex + 1)
    const seasonTmdbId = parseNumeric(parseIndentedField(body, "tmdb_id"))
    if (!seasonTmdbId) continue

    const episodeTableMatch = body.match(/- episode_rows:\n([\s\S]*)$/)
    const episodeRows = episodeTableMatch ? parseMarkdownTable(episodeTableMatch[1]) : []
    const parsedEpisodes = episodeRows.map((row) => ({
      tmdb_id: parseNumeric(row.tmdb_episode_id),
      episode_number: parseNumeric(row.episode_number),
      season_number: parseNumeric(row.season_number),
      name: parseScalar(row.canonical_episode_name),
      embed_url: parseScalar(row.embed_url),
      download_url: parseScalar(row.download_url),
      source_title: parseScalar(row.source_title),
      source_page_url: parseScalar(row.source_page_url),
    })).filter((episode) => episode.tmdb_id && episode.episode_number && episode.season_number && episode.embed_url)

    if (parsedEpisodes.length === 0) continue

    show.seasons.push({
      heading,
      tmdb_id: seasonTmdbId,
      season_number: parseNumeric(parseIndentedField(body, "season_number")),
      name: parseScalar(parseIndentedField(body, "name")) || heading,
      overview: parseScalar(parseIndentedField(body, "overview")),
      poster_path: parseScalar(parseIndentedField(body, "poster_path")),
      air_date: parseScalar(parseIndentedField(body, "air_date")),
      episode_count: parseNumeric(parseIndentedField(body, "episode_count")) ?? parsedEpisodes.length,
      episodes: parsedEpisodes,
    })
  }

  return show
}

async function parseAuditFile(path) {
  const text = await readFile(path, "utf8")
  const sections = text.split(/\n## /).slice(1)
  const movies = []
  const tvShows = []

  for (const section of sections) {
    const newlineIndex = section.indexOf("\n")
    if (newlineIndex === -1) continue
    const title = section.slice(0, newlineIndex).trim()
    const body = section.slice(newlineIndex + 1)
    if (body.includes("- movie_parts:")) {
      const movie = parseMoviesSection(title, body)
      if (movie) movies.push(movie)
      continue
    }
    if (body.includes("- tv_show_row:")) {
      const show = parseTvSection(title, body)
      if (show) tvShows.push(show)
    }
  }

  return { movies, tvShows }
}

async function loadLiveDb() {
  const [movies, tvShows, seasons, episodes] = await Promise.all([
    fetchAllRows("movies"),
    fetchAllRows("tv_shows"),
    fetchAllRows("seasons"),
    fetchAllRows("episodes"),
  ])

  return {
    movies,
    tvShows,
    seasons,
    episodes,
  }
}

async function fetchAllRows(table) {
  const rows = []
  let from = 0

  while (true) {
    const to = from + SUPABASE_PAGE_SIZE - 1
    const { data, error } = await supabase.from(table).select("*").range(from, to)
    if (error) throw new Error(`${table} select failed: ${error.message}`)
    if (!data || data.length === 0) break
    rows.push(...data)
    if (data.length < SUPABASE_PAGE_SIZE) break
    from += SUPABASE_PAGE_SIZE
  }

  return rows
}

function isBlank(value) {
  if (value == null) return true
  if (typeof value === "string") return value.trim() === ""
  if (Array.isArray(value)) return value.length === 0
  return false
}

function mergeMissingFields(existing, desired, allowedFields) {
  const patch = {}
  for (const field of allowedFields) {
    const nextValue = desired[field]
    if (isBlank(nextValue)) continue
    if (isBlank(existing[field])) patch[field] = nextValue
  }
  return patch
}

function pushPreviewChange(summary, change) {
  if (summary.recentChanges.length < MAX_PREVIEW_CHANGES) {
    summary.recentChanges.push(change)
  }
}

function recordQueuedChange(summary, change) {
  pendingChangeLogs.push(change)
  pushPreviewChange(summary, change)
}

function mergeReplaceableLinkFields(existing, desired, allowedFields, context, summary) {
  const patch = {}

  for (const field of allowedFields) {
    const nextValue = desired[field]
    if (isBlank(nextValue)) continue

    const currentValue = existing[field]
    if (currentValue === nextValue) continue

    patch[field] = nextValue

    if (!isBlank(currentValue)) {
      summary.linkOverwrites += 1
      const change = {
        audit_run_id: currentAuditRunId,
        table_name: context.tableName,
        row_id: context.rowId,
        field_name: field,
        match_key: context.matchKey,
        old_value: String(currentValue),
        new_value: String(nextValue),
        reason: "link_overwritten_from_audit",
        source_page_url: context.sourcePageUrl ?? null,
      }
      recordQueuedChange(summary, change)
    }
  }

  return patch
}

function recordAmbiguousConflict(summary, conflict) {
  summary.ambiguousConflicts += 1
  const change = {
    audit_run_id: currentAuditRunId,
    table_name: conflict.tableName,
    row_id: conflict.rowId,
    field_name: conflict.fieldName,
    match_key: conflict.matchKey,
    old_value: conflict.oldValue ?? null,
    new_value: conflict.newValue ?? null,
    reason: "ambiguous_link_conflict",
    source_page_url: conflict.sourcePageUrl ?? null,
  }
  if (conflict.rowId) {
    pendingChangeLogs.push(change)
  }
  pushPreviewChange(summary, change)
}

async function flushChangeLogs(summary) {
  if (dryRunMode || !currentAuditRunId || pendingChangeLogs.length === 0) return
  const { error } = await supabase.from("audit_change_log").insert(pendingChangeLogs)
  if (error) {
    recordError(summary, "audit_change_log", error)
  }
}

function dedupeNonBlank(values) {
  return [...new Set(values.filter((value) => !isBlank(value)))]
}

function buildEpisodeCandidateGroups(episodes) {
  const groups = new Map()
  for (const episode of episodes) {
    const key = `${episode.season_number}:${episode.episode_number}`
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key).push(episode)
  }
  return [...groups.entries()].map(([key, rows]) => ({ key, rows }))
}

function makeMoviePayload(entity, part) {
  const partNumber = part.partNumber ?? 1
  return {
    tmdb_id: part.importTmdbId,
    title: partNumber > 1 ? `${entity.movieRow.title} - Part ${partNumber}` : entity.movieRow.title,
    overview: entity.movieRow.overview,
    poster_path: entity.movieRow.poster_path,
    backdrop_path: entity.movieRow.backdrop_path,
    release_date: entity.movieRow.release_date,
    runtime: entity.movieRow.runtime,
    vote_average: entity.movieRow.vote_average,
    vote_count: entity.movieRow.vote_count,
    genres: entity.movieRow.genres,
    trailer_url: entity.movieRow.trailer_url,
    download_url: part.downloadUrl,
    narrator: part.narratorGuess,
    embed_url: part.embedUrl,
    part_number: partNumber,
    status: entity.movieRow.status,
    scheduled_release: entity.movieRow.scheduled_release,
  }
}

function makeTvShowPayload(entity) {
  return {
    tmdb_id: entity.realTmdbId,
    name: entity.tvShowRow.name,
    overview: entity.tvShowRow.overview,
    poster_path: entity.tvShowRow.poster_path,
    backdrop_path: entity.tvShowRow.backdrop_path,
    first_air_date: entity.tvShowRow.first_air_date,
    last_air_date: entity.tvShowRow.last_air_date,
    number_of_seasons: entity.tvShowRow.number_of_seasons,
    number_of_episodes: entity.tvShowRow.number_of_episodes,
    vote_average: entity.tvShowRow.vote_average,
    vote_count: entity.tvShowRow.vote_count,
    genres: entity.tvShowRow.genres,
    trailer_url: entity.tvShowRow.trailer_url,
    download_url: entity.tvShowRow.download_url,
    narrator: entity.tvShowRow.narrator,
    status: entity.tvShowRow.status,
    scheduled_release: entity.tvShowRow.scheduled_release,
  }
}

function makeSeasonPayload(showId, season) {
  return {
    tv_show_id: showId,
    tmdb_id: season.tmdb_id,
    season_number: season.season_number,
    name: season.name,
    overview: season.overview,
    poster_path: season.poster_path,
    air_date: season.air_date,
    episode_count: season.episode_count,
  }
}

function makeEpisodePayload(showId, seasonId, episode) {
  return {
    season_id: seasonId,
    tv_show_id: showId,
    tmdb_id: episode.tmdb_id,
    episode_number: episode.episode_number,
    season_number: episode.season_number,
    name: episode.name,
    embed_url: episode.embed_url,
    download_url: episode.download_url,
  }
}

function createSummary() {
  return {
    newMovies: 0,
    newMovieParts: 0,
    patchedMovies: 0,
    newTvShows: 0,
    patchedTvShows: 0,
    newSeasons: 0,
    patchedSeasons: 0,
    newEpisodes: 0,
    patchedEpisodes: 0,
    reconnectedEpisodes: 0,
    linkOverwrites: 0,
    ambiguousConflicts: 0,
    skippedRows: 0,
    recentChanges: [],
    errors: [],
  }
}

function recordError(summary, context, error) {
  const message = error?.message ?? String(error)
  summary.errors.push(`${context}: ${message}`)
}

async function insertRow(table, payload) {
  const { data, error } = await supabase.from(table).insert(payload).select().single()
  if (error) throw new Error(`${table} insert failed: ${error.message}`)
  return data
}

async function updateRow(table, id, patch) {
  const { data, error } = await supabase.from(table).update(patch).eq("id", id).select().single()
  if (error) throw new Error(`${table} update failed: ${error.message}`)
  return data
}

async function reconcileMovies(auditMovies, liveDb, summary) {
  const moviesByTmdb = new Map(liveDb.movies.map((movie) => [movie.tmdb_id, movie]))

  for (const entity of auditMovies) {
    try {
      const parentPart = entity.parts.find((part) => part.partNumber === 1) || entity.parts[0]
      if (!parentPart?.importTmdbId) {
        summary.skippedRows += 1
        continue
      }

      let parentMovie = moviesByTmdb.get(entity.realTmdbId) || null
      const parentPayload = makeMoviePayload(entity, { ...parentPart, importTmdbId: entity.realTmdbId, partNumber: 1 })
      parentPayload.parent_movie_id = null

      if (!parentMovie) {
        if (dryRunMode) {
          summary.newMovies += 1
          parentMovie = { id: `planned-movie-${entity.realTmdbId}`, ...parentPayload }
        } else {
          parentMovie = await insertRow("movies", parentPayload)
          moviesByTmdb.set(parentMovie.tmdb_id, parentMovie)
          liveDb.movies.push(parentMovie)
          summary.newMovies += 1
        }
      } else {
        const patch = {
          ...mergeMissingFields(parentMovie, parentPayload, [
          "overview", "poster_path", "backdrop_path", "release_date", "runtime",
          "vote_average", "vote_count", "genres", "trailer_url",
          "narrator", "status", "scheduled_release",
          ]),
          ...mergeReplaceableLinkFields(parentMovie, parentPayload, [
            "download_url", "embed_url",
          ], {
            tableName: "movies",
            rowId: parentMovie.id,
            matchKey: `movie:${entity.realTmdbId}:part:1`,
            sourcePageUrl: parentPart.sourcePageUrl,
          }, summary),
        }
        if (Object.keys(patch).length > 0) {
          if (!dryRunMode) {
            parentMovie = await updateRow("movies", parentMovie.id, patch)
          } else {
            parentMovie = { ...parentMovie, ...patch }
          }
          moviesByTmdb.set(parentMovie.tmdb_id, parentMovie)
          summary.patchedMovies += 1
        }
      }

      for (const part of entity.parts.filter((row) => (row.partNumber ?? 1) > 1)) {
        const partPayload = makeMoviePayload(entity, part)
        partPayload.parent_movie_id = parentMovie.id
        const existingPart = liveDb.movies.find((movie) =>
          movie.parent_movie_id === parentMovie.id && Number(movie.part_number || 1) === part.partNumber
        ) || moviesByTmdb.get(part.importTmdbId) || null

        if (!existingPart) {
          if (dryRunMode) {
            summary.newMovieParts += 1
          } else {
            const inserted = await insertRow("movies", partPayload)
            liveDb.movies.push(inserted)
            moviesByTmdb.set(inserted.tmdb_id, inserted)
            summary.newMovieParts += 1
          }
          continue
        }

        const patch = {
          ...mergeMissingFields(existingPart, partPayload, [
          "overview", "poster_path", "backdrop_path", "release_date", "runtime",
          "vote_average", "vote_count", "genres", "trailer_url",
          "narrator", "status", "scheduled_release", "parent_movie_id",
          ]),
          ...mergeReplaceableLinkFields(existingPart, partPayload, [
            "download_url", "embed_url",
          ], {
            tableName: "movies",
            rowId: existingPart.id,
            matchKey: `movie:${entity.realTmdbId}:part:${part.partNumber}`,
            sourcePageUrl: part.sourcePageUrl,
          }, summary),
        }
        if (Object.keys(patch).length > 0) {
          if (!dryRunMode) {
            const updated = await updateRow("movies", existingPart.id, patch)
            moviesByTmdb.set(updated.tmdb_id, updated)
          }
          summary.patchedMovies += 1
        }
      }
    } catch (error) {
      recordError(summary, `movie ${entity.sectionTitle}`, error)
    }
  }
}

async function reconcileTvShows(auditShows, liveDb, summary) {
  const showsByTmdb = new Map(liveDb.tvShows.map((show) => [show.tmdb_id, show]))

  for (const entity of auditShows) {
    try {
      let show = showsByTmdb.get(entity.realTmdbId) || null
      const showPayload = makeTvShowPayload(entity)

      if (!show) {
        if (dryRunMode) {
          summary.newTvShows += 1
          show = { id: `planned-show-${entity.realTmdbId}`, ...showPayload }
        } else {
          show = await insertRow("tv_shows", showPayload)
          liveDb.tvShows.push(show)
          showsByTmdb.set(show.tmdb_id, show)
          summary.newTvShows += 1
        }
      } else {
        const firstEpisodeSourcePageUrl = entity.seasons.flatMap((season) => season.episodes).find((episode) => episode.source_page_url)?.source_page_url ?? null
        const patch = {
          ...mergeMissingFields(show, showPayload, [
          "overview", "poster_path", "backdrop_path", "first_air_date", "last_air_date",
          "number_of_seasons", "number_of_episodes", "vote_average", "vote_count",
          "genres", "trailer_url", "narrator", "status", "scheduled_release",
          ]),
          ...mergeReplaceableLinkFields(show, showPayload, [
            "download_url",
          ], {
            tableName: "tv_shows",
            rowId: show.id,
            matchKey: `tv_show:${entity.realTmdbId}`,
            sourcePageUrl: firstEpisodeSourcePageUrl,
          }, summary),
        }
        if (Object.keys(patch).length > 0) {
          if (!dryRunMode) {
            show = await updateRow("tv_shows", show.id, patch)
          } else {
            show = { ...show, ...patch }
          }
          showsByTmdb.set(show.tmdb_id, show)
          summary.patchedTvShows += 1
        }
      }

      for (const season of entity.seasons) {
        let existingSeason = liveDb.seasons.find((row) =>
          row.tv_show_id === show.id && Number(row.season_number) === season.season_number
        ) || null
        const seasonPayload = makeSeasonPayload(show.id, season)

        if (!existingSeason) {
          if (dryRunMode) {
            summary.newSeasons += 1
            existingSeason = { id: `planned-season-${show.id}-${season.season_number}`, ...seasonPayload }
          } else {
            existingSeason = await insertRow("seasons", seasonPayload)
            liveDb.seasons.push(existingSeason)
            summary.newSeasons += 1
          }
        } else {
          const seasonPatch = mergeMissingFields(existingSeason, seasonPayload, [
            "tmdb_id", "name", "overview", "poster_path", "air_date", "episode_count",
          ])
          if (Object.keys(seasonPatch).length > 0) {
            if (!dryRunMode) {
              existingSeason = await updateRow("seasons", existingSeason.id, seasonPatch)
            } else {
              existingSeason = { ...existingSeason, ...seasonPatch }
            }
            summary.patchedSeasons += 1
          }
        }

        for (const candidateGroup of buildEpisodeCandidateGroups(season.episodes)) {
          const representative = candidateGroup.rows[0]
          let existingEpisode = liveDb.episodes.find((row) =>
            row.tv_show_id === show.id
            && Number(row.season_number) === representative.season_number
            && Number(row.episode_number) === representative.episode_number
          ) || null
          const uniqueEmbedUrls = dedupeNonBlank(candidateGroup.rows.map((row) => row.embed_url))
          const uniqueDownloadUrls = dedupeNonBlank(candidateGroup.rows.map((row) => row.download_url))

          if (uniqueEmbedUrls.length > 1 || uniqueDownloadUrls.length > 1) {
            const matchKey = `episode:${entity.realTmdbId}:season:${representative.season_number}:episode:${representative.episode_number}`
            if (uniqueEmbedUrls.length > 1) {
              recordAmbiguousConflict(summary, {
                tableName: "episodes",
                rowId: existingEpisode?.id ?? null,
                fieldName: "embed_url",
                matchKey,
                oldValue: existingEpisode?.embed_url ?? null,
                newValue: uniqueEmbedUrls.join(" | "),
                sourcePageUrl: representative.source_page_url,
              })
            }
            if (uniqueDownloadUrls.length > 1) {
              recordAmbiguousConflict(summary, {
                tableName: "episodes",
                rowId: existingEpisode?.id ?? null,
                fieldName: "download_url",
                matchKey,
                oldValue: existingEpisode?.download_url ?? null,
                newValue: uniqueDownloadUrls.join(" | "),
                sourcePageUrl: representative.source_page_url,
              })
            }
            summary.skippedRows += 1
            continue
          }

          const episode = {
            ...representative,
            embed_url: uniqueEmbedUrls[0] ?? representative.embed_url,
            download_url: uniqueDownloadUrls[0] ?? representative.download_url,
          }
          const episodePayload = makeEpisodePayload(show.id, existingSeason.id, episode)

          if (!existingEpisode) {
            if (dryRunMode) {
              summary.newEpisodes += 1
            } else {
              const insertedEpisode = await insertRow("episodes", episodePayload)
              liveDb.episodes.push(insertedEpisode)
              summary.newEpisodes += 1
            }
            continue
          }

          const episodePatch = {
            ...mergeMissingFields(existingEpisode, episodePayload, [
              "tmdb_id", "name", "season_id",
            ]),
            ...mergeReplaceableLinkFields(existingEpisode, episodePayload, [
              "embed_url", "download_url",
            ], {
              tableName: "episodes",
              rowId: existingEpisode.id,
              matchKey: `episode:${entity.realTmdbId}:season:${episode.season_number}:episode:${episode.episode_number}`,
              sourcePageUrl: episode.source_page_url,
            }, summary),
          }
          if (Object.keys(episodePatch).length > 0) {
            if (!dryRunMode) {
              existingEpisode = await updateRow("episodes", existingEpisode.id, episodePatch)
            }
            if ("season_id" in episodePatch) summary.reconnectedEpisodes += 1
            summary.patchedEpisodes += 1
          }
        }
      }
    } catch (error) {
      recordError(summary, `tv show ${entity.sectionTitle}`, error)
    }
  }
}

function printSummary(summary) {
  console.log("")
  console.log(dryRunMode ? "Dry-run reconciliation summary:" : "Apply reconciliation summary:")
  console.log(`- new movies: ${summary.newMovies}`)
  console.log(`- new movie parts: ${summary.newMovieParts}`)
  console.log(`- existing movies with missing fields to fill: ${summary.patchedMovies}`)
  console.log(`- new TV shows: ${summary.newTvShows}`)
  console.log(`- existing TV shows with missing fields to fill: ${summary.patchedTvShows}`)
  console.log(`- seasons to create: ${summary.newSeasons}`)
  console.log(`- existing seasons with missing fields to fill: ${summary.patchedSeasons}`)
  console.log(`- episodes to create: ${summary.newEpisodes}`)
  console.log(`- existing episodes with missing fields to fill: ${summary.patchedEpisodes}`)
  console.log(`- existing episodes reconnected to seasons: ${summary.reconnectedEpisodes}`)
  console.log(`- link overwrites: ${summary.linkOverwrites}`)
  console.log(`- ambiguous conflicts skipped: ${summary.ambiguousConflicts}`)
  console.log(`- skipped rows: ${summary.skippedRows}`)
  console.log(`- item-level errors: ${summary.errors.length}`)
  if (summary.errors.length > 0) {
    console.log("")
    for (const error of summary.errors) {
      console.log(`  * ${error}`)
    }
  }
}

export async function main(options = {}) {
  const args = new Set(process.argv.slice(2))
  const applyMode = typeof options.applyMode === "boolean" ? options.applyMode : args.has(APPLY_FLAG)
  dryRunMode = applyMode ? false : true
  auditFile = options.auditFile?.trim() || process.env.OSHAKUR_AUDIT_FILE?.trim() || "oshakur-links-audit.md"
  currentAuditRunId = options.auditRunId ?? null
  pendingChangeLogs = []

  if (applyMode && !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for --apply. Use --dry-run to compare without writing.")
  }

  supabase = options.supabaseClient || createClient(
    SUPABASE_URL,
    applyMode ? SUPABASE_SERVICE_ROLE_KEY : SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )

  console.log(`Reading audit from ${auditFile}...`)
  const audit = await parseAuditFile(auditFile)
  console.log(`Parsed ${audit.movies.length} movie entities and ${audit.tvShows.length} TV show entities from the audit.`)

  console.log("Loading live AG Movies database state...")
  const liveDb = await loadLiveDb()
  console.log(`Live DB counts: ${liveDb.movies.length} movies, ${liveDb.tvShows.length} tv_shows, ${liveDb.seasons.length} seasons, ${liveDb.episodes.length} episodes.`)

  const summary = createSummary()
  await reconcileMovies(audit.movies, liveDb, summary)
  await reconcileTvShows(audit.tvShows, liveDb, summary)
  await flushChangeLogs(summary)

  printSummary(summary)

  if (summary.errors.length > 0) {
    const error = new Error(`Bulk reconciliation finished with ${summary.errors.length} item-level error(s).`)
    error.summary = summary
    throw error
  }

  return summary
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
