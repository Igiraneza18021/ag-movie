import { NextRequest, NextResponse } from "next/server"
import { spawn } from "node:child_process"
import { stat } from "node:fs/promises"
import path from "node:path"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type AuditCommandKey = "generate_audit" | "upload_dry_run" | "upload_apply"
type JobStatus = "running" | "completed" | "failed"

interface AuditJob {
  id: string
  commandKey: AuditCommandKey
  label: string
  status: JobStatus
  startedAt: string
  endedAt: string | null
  exitCode: number | null
  logs: string[]
}

interface AuditJobStore {
  jobs: AuditJob[]
}

const MAX_JOBS = 12
const MAX_LOG_LINES = 1200

const COMMANDS: Record<
  AuditCommandKey,
  { label: string; args: string[]; requiresServiceRole?: boolean; description: string }
> = {
  generate_audit: {
    label: "Generate live audit",
    args: ["scripts/generate-oshakur-links-audit.mjs"],
    description: "Crawl the live sitemap, enrich with TMDB, and rebuild oshakur-links-audit.md.",
  },
  upload_dry_run: {
    label: "Dry-run DB reconciliation",
    args: ["scripts/bulk-upload-oshakur.mjs", "--dry-run"],
    description: "Compare the audit to the live DB without writing any rows.",
  },
  upload_apply: {
    label: "Apply DB reconciliation",
    args: ["scripts/bulk-upload-oshakur.mjs", "--apply"],
    requiresServiceRole: true,
    description: "Insert missing rows and backfill empty fields in the live DB.",
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
    ...job,
    logCount: job.logs.length,
  }
}

async function getAuditFileInfo() {
  const auditPath = path.join(process.cwd(), "oshakur-links-audit.md")
  try {
    const info = await stat(auditPath)
    return {
      exists: true,
      path: auditPath,
      updatedAt: info.mtime.toISOString(),
      sizeBytes: info.size,
    }
  } catch {
    return {
      exists: false,
      path: auditPath,
      updatedAt: null,
      sizeBytes: 0,
    }
  }
}

function getActiveJob(store: AuditJobStore) {
  return store.jobs.find((job) => job.status === "running") ?? null
}

function startJob(commandKey: AuditCommandKey) {
  const command = COMMANDS[commandKey]
  const store = getStore()

  const job: AuditJob = {
    id: crypto.randomUUID(),
    commandKey,
    label: command.label,
    status: "running",
    startedAt: new Date().toISOString(),
    endedAt: null,
    exitCode: null,
    logs: [],
  }

  store.jobs.unshift(job)
  if (store.jobs.length > MAX_JOBS) {
    store.jobs.splice(MAX_JOBS)
  }

  appendLog(job, `Starting ${command.label}`)
  appendLog(job, `Command: ${process.execPath} ${command.args.join(" ")}`)
  appendLog(job, `Working directory: ${process.cwd()}`)

  const child = spawn(process.execPath, command.args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  })

  child.stdout.on("data", (data) => appendLog(job, String(data)))
  child.stderr.on("data", (data) => appendLog(job, String(data)))

  child.on("error", (error) => {
    appendLog(job, `Process error: ${error.message}`)
    job.status = "failed"
    job.exitCode = -1
    job.endedAt = new Date().toISOString()
  })

  child.on("close", (code) => {
    job.exitCode = code
    job.status = code === 0 ? "completed" : "failed"
    job.endedAt = new Date().toISOString()
    appendLog(job, `Process finished with exit code ${code ?? -1}`)
  })

  return job
}

export async function GET() {
  const store = getStore()
  const auditFile = await getAuditFileInfo()
  const activeJob = getActiveJob(store)

  return NextResponse.json({
    jobs: store.jobs.map(serializeJob),
    activeJobId: activeJob?.id ?? null,
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

  const job = startJob(commandKey)

  return NextResponse.json({
    success: true,
    job: serializeJob(job),
  })
}
