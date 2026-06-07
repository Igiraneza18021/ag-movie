import { NextRequest, NextResponse } from "next/server"
import { mkdir, stat } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { main as generateAuditMain } from "../../../../scripts/generate-oshakur-links-audit.mjs"
import { main as bulkUploadMain } from "../../../../scripts/bulk-upload-oshakur.mjs"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type AuditCommandKey = "generate_audit" | "upload_dry_run" | "upload_apply"
type JobStatus = "running" | "completed" | "failed"

interface AuditJob {
  id: string
  auditRunId: string
  commandKey: AuditCommandKey
  label: string
  status: JobStatus
  startedAt: string
  endedAt: string | null
  exitCode: number | null
  logs: string[]
  summaryJson: Record<string, unknown> | null
  artifactMarkdown: string | null
}

interface AuditJobStore {
  jobs: AuditJob[]
}

const MAX_JOBS = 12
const MAX_LOG_LINES = 1200
const TEMP_DIR = path.join(os.tmpdir(), "ag-movie-audit")

const COMMANDS: Record<
  AuditCommandKey,
  {
    label: string
    description: string
    requiresServiceRole?: boolean
    applyMode?: boolean
  }
> = {
  generate_audit: {
    label: "Generate live audit",
    description: "Crawl the live sitemap, enrich with TMDB, and save the durable audit artifact.",
  },
  upload_dry_run: {
    label: "Preview inserts, backfills, and link replacements",
    description: "Generate a fresh audit, then preview missing inserts, metadata backfills, and link replacements.",
    applyMode: false,
  },
  upload_apply: {
    label: "Apply inserts, backfills, and link replacements",
    description: "Generate a fresh audit, then apply missing inserts, metadata backfills, and link replacements.",
    requiresServiceRole: true,
    applyMode: true,
  },
}

declare global {
  var __agMovieAuditJobStore: AuditJobStore | undefined
}

function getStore(): AuditJobStore {
  if (!globalThis.__agMovieAuditJobStore) {
    globalThis.__agMovieAuditJobStore = { jobs: [] }
  }
  return globalThis.__agMovieAuditJobStore
}

function getRuntimeAuditPath() {
  return path.join(TEMP_DIR, "oshakur-links-audit.md")
}

function appendLog(job: AuditJob, chunk: string) {
  for (const rawLine of chunk.split(/\r?\n/)) {
    const line = rawLine.trimEnd()
    if (!line) continue
    job.logs.push(`[${new Date().toISOString()}] ${line}`)
  }
  if (job.logs.length > MAX_LOG_LINES) {
    job.logs.splice(0, job.logs.length - MAX_LOG_LINES)
  }
}

function serializeJob(job: AuditJob) {
  return {
    id: job.id,
    auditRunId: job.auditRunId,
    commandKey: job.commandKey,
    label: job.label,
    status: job.status,
    startedAt: job.startedAt,
    endedAt: job.endedAt,
    exitCode: job.exitCode,
    logs: job.logs,
    logCount: job.logs.length,
    summaryJson: job.summaryJson,
    artifactMarkdown: job.artifactMarkdown,
  }
}

function getActiveJob(store: AuditJobStore) {
  return store.jobs.find((job) => job.status === "running") ?? null
}

async function getRuntimeAuditInfo() {
  const auditPath = getRuntimeAuditPath()
  try {
    const info = await stat(auditPath)
    return {
      exists: true,
      path: auditPath,
      updatedAt: info.mtime.toISOString(),
      sizeBytes: info.size,
      source: "runtime",
    }
  } catch {
    return null
  }
}

async function getPersistedJobs() {
  try {
    const supabase = createAdminSupabaseClient()
    const { data, error } = await supabase
      .from("audit_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(MAX_JOBS)

    if (error) throw error
    return data || []
  } catch {
    return []
  }
}

async function getAuditFileInfo() {
  const runtimeInfo = await getRuntimeAuditInfo()
  if (runtimeInfo) return runtimeInfo

  const persistedJobs = await getPersistedJobs()
  const latestWithArtifact = persistedJobs.find((job) => typeof job.artifact_markdown === "string" && job.artifact_markdown.length > 0)
  if (!latestWithArtifact) {
    return {
      exists: false,
      path: "Supabase audit_runs.artifact_markdown",
      updatedAt: null,
      sizeBytes: 0,
      source: "database",
    }
  }

  return {
    exists: true,
    path: "Supabase audit_runs.artifact_markdown",
    updatedAt: latestWithArtifact.finished_at || latestWithArtifact.created_at,
    sizeBytes: latestWithArtifact.artifact_markdown.length,
    source: "database",
  }
}

function mergePersistedJobs(persistedRows, inMemoryJobs) {
  const byAuditRunId = new Map()

  for (const row of persistedRows) {
    byAuditRunId.set(row.id, {
      id: row.id,
      auditRunId: row.id,
      commandKey: row.command_key,
      label: COMMANDS[row.command_key as AuditCommandKey]?.label || row.command_key,
      status: row.status,
      startedAt: row.started_at || row.created_at,
      endedAt: row.finished_at,
      exitCode: row.status === "completed" ? 0 : row.status === "failed" ? 1 : null,
      logs: Array.isArray(row.log_lines) ? row.log_lines : [],
      summaryJson: row.summary_json || null,
      artifactMarkdown: row.artifact_markdown || null,
    })
  }

  for (const job of inMemoryJobs) {
    byAuditRunId.set(job.auditRunId, serializeJob(job))
  }

  return [...byAuditRunId.values()].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()).slice(0, MAX_JOBS)
}

async function withCapturedConsole(job: AuditJob, run: () => Promise<void>) {
  const originalLog = console.log
  const originalError = console.error
  const originalWarn = console.warn

  console.log = (...args) => appendLog(job, args.map((arg) => String(arg)).join(" "))
  console.error = (...args) => appendLog(job, args.map((arg) => String(arg)).join(" "))
  console.warn = (...args) => appendLog(job, args.map((arg) => String(arg)).join(" "))

  try {
    await run()
  } finally {
    console.log = originalLog
    console.error = originalError
    console.warn = originalWarn
  }
}

async function updateAuditRun(job: AuditJob) {
  const supabase = createAdminSupabaseClient({ requireServiceRole: true })
  const payload = {
    status: job.status,
    artifact_markdown: job.artifactMarkdown,
    summary_json: job.summaryJson || {},
    log_lines: job.logs,
    finished_at: job.endedAt,
  }

  const { error } = await supabase.from("audit_runs").update(payload).eq("id", job.auditRunId)
  if (error) {
    appendLog(job, `Failed to persist audit run update: ${error.message}`)
  }
}

function buildCombinedSummary(commandKey: AuditCommandKey, generatedAudit, uploadSummary = null) {
  return {
    commandKey,
    artifact: generatedAudit ? {
      outputFile: generatedAudit.outputFile,
      totalSitemapUrls: generatedAudit.summary?.totalSitemapUrls ?? null,
      totalSourcePages: generatedAudit.summary?.totalSourcePages ?? null,
      movieGroups: generatedAudit.summary?.movieGroups ?? null,
      tvGroups: generatedAudit.summary?.tvGroups ?? null,
      failedPages: generatedAudit.summary?.failedPages ?? null,
      missingDownloads: generatedAudit.summary?.missingDownloads ?? null,
    } : null,
    upload: uploadSummary,
  }
}

async function runJob(job: AuditJob) {
  const command = COMMANDS[job.commandKey]
  let generatedAudit = null
  let uploadSummary = null

  await mkdir(TEMP_DIR, { recursive: true })
  appendLog(job, `Starting ${command.label}`)
  appendLog(job, `Runtime audit path: ${getRuntimeAuditPath()}`)
  appendLog(job, `Working directory: ${TEMP_DIR}`)

  try {
    await withCapturedConsole(job, async () => {
      generatedAudit = await generateAuditMain({ outputFile: getRuntimeAuditPath() })
      job.artifactMarkdown = generatedAudit.markdown

      if (job.commandKey === "generate_audit") {
        job.summaryJson = buildCombinedSummary(job.commandKey, generatedAudit)
        return
      }

      appendLog(job, "Preparing reconciliation from the freshly generated audit artifact.")
      uploadSummary = await bulkUploadMain({
        auditFile: getRuntimeAuditPath(),
        applyMode: Boolean(command.applyMode),
        auditRunId: job.auditRunId,
        supabaseClient: createAdminSupabaseClient({ requireServiceRole: Boolean(command.applyMode) }),
      })
      job.summaryJson = buildCombinedSummary(job.commandKey, generatedAudit, uploadSummary)
    })

    job.status = "completed"
    job.exitCode = 0
    appendLog(job, "Process finished with exit code 0")
  } catch (error) {
    const message = error instanceof Error ? error.stack || error.message : String(error)
    uploadSummary = error?.summary || uploadSummary
    appendLog(job, message)
    job.status = "failed"
    job.exitCode = 1
    job.summaryJson = buildCombinedSummary(job.commandKey, generatedAudit, uploadSummary)
    appendLog(job, "Process finished with exit code 1")
  } finally {
    job.endedAt = new Date().toISOString()
    await updateAuditRun(job)
  }
}

async function createPersistedRun(commandKey: AuditCommandKey) {
  const supabase = createAdminSupabaseClient({ requireServiceRole: true })
  const payload = {
    command_key: commandKey,
    status: "running",
    started_at: new Date().toISOString(),
    finished_at: null,
    summary_json: {},
    log_lines: [],
  }
  const { data, error } = await supabase.from("audit_runs").insert(payload).select("id, started_at").single()
  if (error) throw error
  return data
}

async function startJob(commandKey: AuditCommandKey) {
  const command = COMMANDS[commandKey]
  const store = getStore()
  const persistedRun = await createPersistedRun(commandKey)

  const job: AuditJob = {
    id: persistedRun.id,
    auditRunId: persistedRun.id,
    commandKey,
    label: command.label,
    status: "running",
    startedAt: persistedRun.started_at || new Date().toISOString(),
    endedAt: null,
    exitCode: null,
    logs: [],
    summaryJson: null,
    artifactMarkdown: null,
  }

  store.jobs.unshift(job)
  if (store.jobs.length > MAX_JOBS) {
    store.jobs.splice(MAX_JOBS)
  }

  void runJob(job)
  return job
}

export async function GET() {
  const store = getStore()
  const activeJob = getActiveJob(store)
  const [persistedRows, auditFile] = await Promise.all([getPersistedJobs(), getAuditFileInfo()])

  return NextResponse.json({
    jobs: mergePersistedJobs(persistedRows, store.jobs),
    activeJobId: activeJob?.auditRunId ?? null,
    capabilities: {
      serviceRoleConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
      auditFile,
      commands: Object.entries(COMMANDS).map(([key, value]) => ({
        key,
        label: value.label,
        description: value.description,
        requiresServiceRole: Boolean(value.requiresServiceRole),
      })),
    },
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const commandKey = body?.commandKey as AuditCommandKey | undefined

  if (!commandKey || !(commandKey in COMMANDS)) {
    return NextResponse.json({ error: "Invalid commandKey" }, { status: 400 })
  }

  const command = COMMANDS[commandKey]
  if (command.requiresServiceRole && !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not configured on the server for apply mode." },
      { status: 400 },
    )
  }

  const store = getStore()
  const activeJob = getActiveJob(store)
  if (activeJob) {
    return NextResponse.json(
      { error: "Another audit job is already running.", activeJob: serializeJob(activeJob) },
      { status: 409 },
    )
  }

  try {
    const job = await startJob(commandKey)
    return NextResponse.json({
      success: true,
      job: serializeJob(job),
      auditRunId: job.auditRunId,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start audit job." },
      { status: 500 },
    )
  }
}
