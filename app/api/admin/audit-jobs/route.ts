import { NextRequest, NextResponse } from "next/server"
import { spawn } from "node:child_process"
import { mkdir, stat } from "node:fs/promises"
import os from "node:os"
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
const TEMP_DIR = path.join(os.tmpdir(), "ag-movie-audit")

const COMMANDS: Record<
  AuditCommandKey,
  {
    label: string
    description: string
    requiresServiceRole?: boolean
    shouldGenerateBeforeUpload?: boolean
  }
> = {
  generate_audit: {
    label: "Generate live audit",
    description: "Crawl the live sitemap, enrich with TMDB, and rebuild the runtime audit artifact.",
  },
  upload_dry_run: {
    label: "Dry-run DB reconciliation",
    description: "Generate a fresh audit, then compare it to the live DB without writing any rows.",
    shouldGenerateBeforeUpload: true,
  },
  upload_apply: {
    label: "Apply DB reconciliation",
    description: "Generate a fresh audit, then insert missing rows and backfill empty fields in the live DB.",
    requiresServiceRole: true,
    shouldGenerateBeforeUpload: true,
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

function getScriptPath(relativePath: string) {
  return path.join(process.cwd(), relativePath)
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
  const auditPath = getRuntimeAuditPath()
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

async function runNodeScript(job: AuditJob, scriptRelativePath: string, scriptArgs: string[] = []) {
  await mkdir(TEMP_DIR, { recursive: true })

  const scriptPath = getScriptPath(scriptRelativePath)
  appendLog(job, `Command: ${process.execPath} ${scriptPath} ${scriptArgs.join(" ")}`.trim())
  appendLog(job, `Working directory: ${TEMP_DIR}`)

  await new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, ...scriptArgs], {
      cwd: TEMP_DIR,
      env: {
        ...process.env,
        OSHAKUR_AUDIT_FILE: getRuntimeAuditPath(),
      },
      stdio: ["ignore", "pipe", "pipe"],
    })

    child.stdout.on("data", (data) => appendLog(job, String(data)))
    child.stderr.on("data", (data) => appendLog(job, String(data)))
    child.on("error", reject)
    child.on("close", (code) => {
      if (code === 0) {
        resolve()
        return
      }
      reject(new Error(`Process finished with exit code ${code ?? -1}`))
    })
  })
}

async function runJob(job: AuditJob) {
  const command = COMMANDS[job.commandKey]

  appendLog(job, `Starting ${command.label}`)
  appendLog(job, `Runtime audit path: ${getRuntimeAuditPath()}`)

  try {
    if (job.commandKey === "generate_audit") {
      await runNodeScript(job, "scripts/generate-oshakur-links-audit.mjs")
    } else {
      if (command.shouldGenerateBeforeUpload) {
        appendLog(job, "Preparing a fresh runtime audit before reconciliation.")
        await runNodeScript(job, "scripts/generate-oshakur-links-audit.mjs")
      }

      const uploadArgs = job.commandKey === "upload_apply" ? ["--apply"] : ["--dry-run"]
      await runNodeScript(job, "scripts/bulk-upload-oshakur.mjs", uploadArgs)
    }

    job.status = "completed"
    job.exitCode = 0
    appendLog(job, "Process finished with exit code 0")
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    appendLog(job, message)
    job.status = "failed"
    job.exitCode = 1
  } finally {
    job.endedAt = new Date().toISOString()
  }
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

  void runJob(job)
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
