"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { RefreshCw, FileScan, DatabaseZap, Upload, TerminalSquare } from "lucide-react"
import { toast } from "@/hooks/use-toast"

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
  logCount: number
  summaryJson?: {
    artifact?: {
      totalSitemapUrls?: number | null
      totalSourcePages?: number | null
      movieGroups?: number | null
      tvGroups?: number | null
      failedPages?: number | null
      missingDownloads?: number | null
    } | null
    upload?: {
      newMovies?: number
      newMovieParts?: number
      patchedMovies?: number
      newTvShows?: number
      patchedTvShows?: number
      newSeasons?: number
      patchedSeasons?: number
      newEpisodes?: number
      patchedEpisodes?: number
      reconnectedEpisodes?: number
      linkOverwrites?: number
      ambiguousConflicts?: number
      skippedRows?: number
      errors?: string[]
      recentChanges?: Array<{
        table_name?: string
        field_name?: string
        old_value?: string | null
        new_value?: string | null
        reason?: string
        source_page_url?: string | null
      }>
    } | null
  } | null
  artifactMarkdown?: string | null
}

interface AuditStatusResponse {
  jobs: AuditJob[]
  activeJobId: string | null
  capabilities: {
    serviceRoleConfigured: boolean
    auditFile: {
      exists: boolean
      path: string
      updatedAt: string | null
      sizeBytes: number
      source: string
    }
    commands: {
      key: AuditCommandKey
      label: string
      description: string
      requiresServiceRole: boolean
    }[]
  }
}

const COMMAND_ICONS = {
  generate_audit: FileScan,
  upload_dry_run: DatabaseZap,
  upload_apply: Upload,
} satisfies Record<AuditCommandKey, typeof FileScan>

export function AuditToolsManager() {
  const [data, setData] = useState<AuditStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [startingCommand, setStartingCommand] = useState<AuditCommandKey | null>(null)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)

  const fetchStatus = async (showLoading = false) => {
    if (showLoading) setLoading(true)
    try {
      const response = await fetch("/api/admin/audit-jobs", { cache: "no-store" })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || "Failed to load audit jobs")
      }
      setData(result)
      setSelectedJobId((current) => {
        if (current && result.jobs.some((job: AuditJob) => job.id === current)) return current
        return result.activeJobId || result.jobs[0]?.id || null
      })
    } catch (error) {
      toast({
        title: "Could not load audit tools",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus(true)
  }, [])

  useEffect(() => {
    const hasRunningJob = data?.jobs.some((job) => job.status === "running")
    if (!hasRunningJob) return

    const interval = window.setInterval(() => {
      fetchStatus(false)
    }, 2000)

    return () => window.clearInterval(interval)
  }, [data?.jobs])

  const selectedJob = useMemo(
    () => data?.jobs.find((job) => job.id === selectedJobId) ?? data?.jobs[0] ?? null,
    [data?.jobs, selectedJobId],
  )

  const activeJobId = data?.activeJobId ?? null

  const runCommand = async (commandKey: AuditCommandKey) => {
    setStartingCommand(commandKey)
    try {
      const response = await fetch("/api/admin/audit-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commandKey }),
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || "Failed to start audit job")
      }
      toast({
        title: "Audit job started",
        description: result.job.label,
      })
      await fetchStatus(false)
      setSelectedJobId(result.job.id)
    } catch (error) {
      toast({
        title: "Could not start audit job",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setStartingCommand(null)
    }
  }

  const renderStatusBadge = (status: JobStatus) => {
    if (status === "running") return <Badge>Running</Badge>
    if (status === "completed") return <Badge variant="secondary">Completed</Badge>
    return <Badge variant="destructive">Failed</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TerminalSquare className="h-5 w-5" />
              Audit Controls
            </CardTitle>
            <CardDescription>Run the live sitemap audit and the Supabase reconciliation scripts from the admin UI.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Service role key</p>
                <p className="text-xs text-muted-foreground">Needed for the real DB upload action.</p>
              </div>
              <Badge variant={data?.capabilities.serviceRoleConfigured ? "secondary" : "destructive"}>
                {data?.capabilities.serviceRoleConfigured ? "Configured" : "Missing"}
              </Badge>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">Runtime audit artifact</p>
                <p className="truncate text-xs text-muted-foreground">{data?.capabilities.auditFile.path || "/tmp/ag-movie-audit/oshakur-links-audit.md"}</p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>{data?.capabilities.auditFile.exists ? "Ready" : "Missing"}</p>
                <p className="uppercase">{data?.capabilities.auditFile.source || "runtime"}</p>
                <p>{data?.capabilities.auditFile.updatedAt ? new Date(data.capabilities.auditFile.updatedAt).toLocaleString() : "Not generated yet"}</p>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
              {data?.capabilities.commands.map((command) => {
                const Icon = COMMAND_ICONS[command.key]
                const disabled =
                  startingCommand !== null ||
                  activeJobId !== null ||
                  (command.requiresServiceRole && !data.capabilities.serviceRoleConfigured)

                return (
                  <div key={command.key} className="rounded-xl border p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="rounded-full bg-primary/10 p-2 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{command.label}</p>
                        {command.requiresServiceRole && (
                          <p className="text-[11px] text-muted-foreground">Requires write credentials</p>
                        )}
                      </div>
                    </div>
                    <p className="min-h-16 text-sm text-muted-foreground">{command.description}</p>
                    <Button
                      className="mt-3 w-full"
                      disabled={disabled}
                      onClick={() => runCommand(command.key)}
                      variant={command.key === "upload_apply" ? "default" : "outline"}
                    >
                      {startingCommand === command.key ? "Starting..." : command.label}
                    </Button>
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end">
              <Button variant="outline" size="sm" disabled={loading} onClick={() => fetchStatus(true)}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Recent Jobs</CardTitle>
            <CardDescription>Newest runs appear first. Running jobs refresh automatically.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data?.jobs.length ? (
              data.jobs.map((job) => (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => setSelectedJobId(job.id)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    selectedJob?.id === job.id ? "border-primary bg-primary/5" : "hover:bg-accent"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{job.label}</p>
                    {renderStatusBadge(job.status)}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(job.startedAt).toLocaleString()}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {job.logCount} log line{job.logCount === 1 ? "" : "s"}
                    {job.exitCode !== null ? ` • exit ${job.exitCode}` : ""}
                  </p>
                  {job.summaryJson?.upload && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {job.summaryJson.upload.linkOverwrites || 0} link replacements
                      {` • ${job.summaryJson.upload.ambiguousConflicts || 0} conflicts`}
                    </p>
                  )}
                </button>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No audit jobs have been started yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>{selectedJob?.label || "Job Logs"}</CardTitle>
                <CardDescription>
                  {selectedJob
                    ? `Started ${new Date(selectedJob.startedAt).toLocaleString()}`
                    : "Pick a job to inspect its logs."}
                </CardDescription>
              </div>
              {selectedJob && renderStatusBadge(selectedJob.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedJob ? (
              <>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Command</p>
                    <p className="text-sm font-medium">{selectedJob.commandKey}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Exit code</p>
                    <p className="text-sm font-medium">{selectedJob.exitCode ?? "Still running"}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Finished</p>
                    <p className="text-sm font-medium">
                      {selectedJob.endedAt ? new Date(selectedJob.endedAt).toLocaleString() : "In progress"}
                    </p>
                  </div>
                </div>

                {(selectedJob.summaryJson?.artifact || selectedJob.summaryJson?.upload) && (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {selectedJob.summaryJson?.artifact && (
                      <>
                        <div className="rounded-lg border p-3">
                          <p className="text-xs text-muted-foreground">Watch URLs</p>
                          <p className="text-sm font-medium">{selectedJob.summaryJson.artifact.totalSitemapUrls ?? 0}</p>
                        </div>
                        <div className="rounded-lg border p-3">
                          <p className="text-xs text-muted-foreground">Matched movies</p>
                          <p className="text-sm font-medium">{selectedJob.summaryJson.artifact.movieGroups ?? 0}</p>
                        </div>
                        <div className="rounded-lg border p-3">
                          <p className="text-xs text-muted-foreground">Matched TV shows</p>
                          <p className="text-sm font-medium">{selectedJob.summaryJson.artifact.tvGroups ?? 0}</p>
                        </div>
                        <div className="rounded-lg border p-3">
                          <p className="text-xs text-muted-foreground">Fetch failures</p>
                          <p className="text-sm font-medium">{selectedJob.summaryJson.artifact.failedPages ?? 0}</p>
                        </div>
                      </>
                    )}
                    {selectedJob.summaryJson?.upload && (
                      <>
                        <div className="rounded-lg border p-3">
                          <p className="text-xs text-muted-foreground">Link replacements</p>
                          <p className="text-sm font-medium">{selectedJob.summaryJson.upload.linkOverwrites ?? 0}</p>
                        </div>
                        <div className="rounded-lg border p-3">
                          <p className="text-xs text-muted-foreground">Ambiguous conflicts</p>
                          <p className="text-sm font-medium">{selectedJob.summaryJson.upload.ambiguousConflicts ?? 0}</p>
                        </div>
                        <div className="rounded-lg border p-3">
                          <p className="text-xs text-muted-foreground">Inserted rows</p>
                          <p className="text-sm font-medium">
                            {(selectedJob.summaryJson.upload.newMovies ?? 0)
                              + (selectedJob.summaryJson.upload.newMovieParts ?? 0)
                              + (selectedJob.summaryJson.upload.newTvShows ?? 0)
                              + (selectedJob.summaryJson.upload.newSeasons ?? 0)
                              + (selectedJob.summaryJson.upload.newEpisodes ?? 0)}
                          </p>
                        </div>
                        <div className="rounded-lg border p-3">
                          <p className="text-xs text-muted-foreground">Patched rows</p>
                          <p className="text-sm font-medium">
                            {(selectedJob.summaryJson.upload.patchedMovies ?? 0)
                              + (selectedJob.summaryJson.upload.patchedTvShows ?? 0)
                              + (selectedJob.summaryJson.upload.patchedSeasons ?? 0)
                              + (selectedJob.summaryJson.upload.patchedEpisodes ?? 0)}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <Separator />

                {selectedJob.summaryJson?.upload?.recentChanges?.length ? (
                  <div className="rounded-lg border p-4">
                    <p className="mb-3 text-sm font-semibold">Recent Link Changes</p>
                    <div className="space-y-2">
                      {selectedJob.summaryJson.upload.recentChanges.slice(0, 6).map((change, index) => (
                        <div key={`${change.table_name}-${change.field_name}-${index}`} className="rounded-md bg-muted/50 p-3 text-xs">
                          <p className="font-medium">{change.table_name}.{change.field_name}</p>
                          <p className="text-muted-foreground">{change.reason}</p>
                          <p className="truncate">Old: {change.old_value || "empty"}</p>
                          <p className="truncate">New: {change.new_value || "empty"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {selectedJob.artifactMarkdown ? (
                  <div className="rounded-lg border p-4">
                    <p className="mb-3 text-sm font-semibold">Saved Audit Artifact Preview</p>
                    <ScrollArea className="h-48 rounded-md border bg-muted/40 p-3">
                      <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-5">
                        {selectedJob.artifactMarkdown.slice(0, 4000)}
                      </pre>
                    </ScrollArea>
                  </div>
                ) : null}

                <ScrollArea className="h-[520px] rounded-lg border bg-muted/40 p-4">
                  <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-5">
                    {selectedJob.logs.length > 0 ? selectedJob.logs.join("\n") : "No logs yet."}
                  </pre>
                </ScrollArea>
              </>
            ) : (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                Start a script or pick a previous run to view logs here.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
