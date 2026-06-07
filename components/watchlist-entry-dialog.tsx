"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import {
  Ban,
  CheckCircle2,
  CircleHelp,
  Clock3,
  Heart,
  PauseCircle,
  PlayCircle,
  RotateCcw,
  Save,
  Trash2,
  XCircle,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { getTMDBImageUrl } from "@/lib/tmdb"
import type { WatchStatus, WatchlistEntry, WatchlistMediaSummary, WatchlistSaveInput } from "@/lib/types"
import { cn } from "@/lib/utils"

const STATUS_OPTIONS: Array<{
  value: WatchStatus
  label: string
  icon: typeof CircleHelp
  iconClassName: string
}> = [
  { value: "not_set", label: "Not Set", icon: CircleHelp, iconClassName: "text-zinc-400" },
  { value: "watching", label: "Watching", icon: PlayCircle, iconClassName: "text-sky-400" },
  { value: "planning", label: "Planning", icon: Clock3, iconClassName: "text-amber-400" },
  { value: "completed", label: "Completed", icon: CheckCircle2, iconClassName: "text-emerald-400" },
  { value: "re_watching", label: "Re-Watching", icon: RotateCcw, iconClassName: "text-fuchsia-400" },
  { value: "paused", label: "Paused", icon: PauseCircle, iconClassName: "text-orange-400" },
  { value: "dropped", label: "Dropped", icon: Ban, iconClassName: "text-rose-400" },
]

interface WatchlistEntryDialogProps {
  item: WatchlistMediaSummary
  entry: WatchlistEntry | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (input: WatchlistSaveInput) => Promise<{ ok: boolean; reason?: string }>
  onDelete?: (entryId: string) => Promise<{ ok: boolean; reason?: string }>
}

interface FormState {
  watch_status: WatchStatus
  progress: string
  score: string
  start_date: string
  end_date: string
  total_rewatched: string
  notes: string
  liked: boolean
}

function buildInitialState(item: WatchlistMediaSummary, entry: WatchlistEntry | null): FormState {
  return {
    watch_status: entry?.watch_status ?? "not_set",
    progress: String(entry?.progress ?? 0),
    score: entry?.score != null ? String(entry.score) : "",
    start_date: entry?.start_date ?? "",
    end_date: entry?.end_date ?? "",
    total_rewatched: String(entry?.total_rewatched ?? 0),
    notes: entry?.notes ?? "",
    liked: entry?.liked ?? false,
  }
}

export function WatchlistEntryDialog({
  item,
  entry,
  open,
  onOpenChange,
  onSave,
  onDelete,
}: WatchlistEntryDialogProps) {
  const [form, setForm] = useState<FormState>(() => buildInitialState(item, entry))
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) return
    setForm(buildInitialState(item, entry))
    setError("")
  }, [entry, item, open])

  const progressHint = item.type === "tv" ? item.number_of_episodes ?? undefined : 1
  const posterUrl = item.poster_path ? getTMDBImageUrl(item.poster_path, "w500") : "/placeholder.svg"
  const hasExistingEntry = Boolean(entry)
  const heading = hasExistingEntry ? item.title : `Add ${item.title}`

  const progressLabel = useMemo(() => {
    if (!progressHint) return "Progress"
    return item.type === "tv" ? `Progress / ${progressHint}` : "Progress / 1"
  }, [item.type, progressHint])

  const selectedStatusOption = useMemo(
    () => STATUS_OPTIONS.find((option) => option.value === form.watch_status) ?? STATUS_OPTIONS[0],
    [form.watch_status],
  )

  const handleSave = async () => {
    setIsSaving(true)
    setError("")

    const progress = Math.max(0, Number(form.progress || 0))
    const score = form.score === "" ? null : Math.max(0, Math.min(10, Number(form.score)))
    const totalRewatched = Math.max(0, Number(form.total_rewatched || 0))

    const result = await onSave({
      entryId: entry?.id,
      item,
      watch_status: form.watch_status,
      progress,
      score: Number.isNaN(score as number) ? null : score,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      total_rewatched: totalRewatched,
      notes: form.notes,
      liked: form.liked,
    })

    setIsSaving(false)

    if (!result.ok) {
      setError(result.reason ?? "Unable to save watchlist entry.")
      return
    }

    onOpenChange(false)
  }

  const handleDelete = async () => {
    if (!entry?.id || !onDelete) return

    setIsSaving(true)
    setError("")
    const result = await onDelete(entry.id)
    setIsSaving(false)

    if (!result.ok) {
      setError(result.reason ?? "Unable to delete watchlist entry.")
      return
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-[1.5rem] border-white/10 bg-[#101010] p-0 text-white shadow-[0_24px_80px_rgba(0,0,0,0.6)] sm:max-w-4xl"
      >
        <div className="grid gap-0 md:grid-cols-[280px_1fr]">
          <div className="relative hidden min-h-[520px] md:block">
            <Image src={posterUrl} alt={item.title} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#101010]" />
          </div>

          <div className="p-4 sm:p-5 md:p-6">
            <DialogHeader className="items-start text-left">
              <div className="flex w-full items-start justify-between gap-4">
                <DialogTitle className="max-w-2xl text-2xl font-black tracking-tight text-white md:text-3xl">
                  {heading}
                </DialogTitle>
                <button
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, liked: !current.liked }))}
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-2xl border transition-colors",
                    form.liked
                      ? "border-red-500/40 bg-red-500/20 text-red-400"
                      : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10",
                  )}
                  aria-label={form.liked ? "Unlike" : "Like"}
                >
                  <Heart className={cn("h-5 w-5", form.liked && "fill-current")} />
                </button>
              </div>
            </DialogHeader>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-400">Status</Label>
                <Select
                  value={form.watch_status}
                  onValueChange={(value) => setForm((current) => ({ ...current, watch_status: value as WatchStatus }))}
                >
                  <SelectTrigger className="h-12 w-full rounded-2xl border-white/10 bg-white/5 px-4 text-sm font-semibold text-white">
                    <div className="flex items-center gap-2">
                      <selectedStatusOption.icon className={cn("h-4 w-4", selectedStatusOption.iconClassName)} />
                      <span>{selectedStatusOption.label}</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#151515] text-white">
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <option.icon className={cn("h-4 w-4", option.iconClassName)} />
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-400">{progressLabel}</Label>
                <Input
                  type="number"
                  min={0}
                  max={progressHint}
                  value={form.progress}
                  onChange={(event) => setForm((current) => ({ ...current, progress: event.target.value }))}
                  className="h-12 rounded-2xl border-white/10 bg-white/5 px-4 text-sm font-semibold text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-400">Score (0-10)</Label>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  value={form.score}
                  onChange={(event) => setForm((current) => ({ ...current, score: event.target.value }))}
                  className="h-12 rounded-2xl border-white/10 bg-white/5 px-4 text-sm font-semibold text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-400">Start Date</Label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(event) => setForm((current) => ({ ...current, start_date: event.target.value }))}
                  className="h-12 rounded-2xl border-white/10 bg-white/5 px-4 text-sm font-semibold text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-400">End Date</Label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={(event) => setForm((current) => ({ ...current, end_date: event.target.value }))}
                  className="h-12 rounded-2xl border-white/10 bg-white/5 px-4 text-sm font-semibold text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-400">Total Rewatches</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.total_rewatched}
                  onChange={(event) => setForm((current) => ({ ...current, total_rewatched: event.target.value }))}
                  className="h-12 rounded-2xl border-white/10 bg-white/5 px-4 text-sm font-semibold text-white"
                />
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Label className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-400">Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                className="min-h-24 rounded-2xl border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
              />
            </div>

            {error ? <p className="mt-4 text-sm font-bold text-red-400">{error}</p> : null}

            <DialogFooter className="mt-4 flex-col items-stretch justify-between gap-3 border-t border-white/5 pt-4 sm:flex-row sm:items-center">
              <div>
                {entry?.id ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleDelete}
                    disabled={isSaving}
                    className="h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-red-500 hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                ) : null}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="h-11 rounded-2xl border border-white/10 bg-white/5 px-5 text-white hover:bg-white/10"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="h-11 rounded-2xl bg-white/10 px-5 text-white hover:bg-white/20"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
