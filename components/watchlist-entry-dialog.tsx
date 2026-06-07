"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { Heart, Save, Trash2, XCircle } from "lucide-react"
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

const STATUS_OPTIONS: Array<{ value: WatchStatus; label: string }> = [
  { value: "not_set", label: "Not Set" },
  { value: "watching", label: "Watching" },
  { value: "planning", label: "Planning" },
  { value: "completed", label: "Completed" },
  { value: "re_watching", label: "Re-Watching" },
  { value: "paused", label: "Paused" },
  { value: "dropped", label: "Dropped" },
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
        className="max-w-[calc(100vw-2rem)] overflow-hidden rounded-[2rem] border-white/10 bg-[#101010] p-0 text-white shadow-[0_30px_100px_rgba(0,0,0,0.65)] sm:max-w-6xl"
      >
        <div className="grid gap-0 md:grid-cols-[460px_1fr]">
          <div className="relative hidden min-h-[660px] md:block">
            <Image src={posterUrl} alt={item.title} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#101010]" />
          </div>

          <div className="p-6 md:p-8">
            <DialogHeader className="items-start text-left">
              <div className="flex w-full items-start justify-between gap-4">
                <DialogTitle className="max-w-3xl text-3xl font-black tracking-tight text-white md:text-5xl">
                  {heading}
                </DialogTitle>
                <button
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, liked: !current.liked }))}
                  className={cn(
                    "flex h-16 w-16 items-center justify-center rounded-3xl border transition-colors",
                    form.liked
                      ? "border-red-500/40 bg-red-500/20 text-red-400"
                      : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10",
                  )}
                  aria-label={form.liked ? "Unlike" : "Like"}
                >
                  <Heart className={cn("h-8 w-8", form.liked && "fill-current")} />
                </button>
              </div>
            </DialogHeader>

            <div className="mt-8 grid gap-5 md:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-lg font-bold text-zinc-400">Status</Label>
                <Select
                  value={form.watch_status}
                  onValueChange={(value) => setForm((current) => ({ ...current, watch_status: value as WatchStatus }))}
                >
                  <SelectTrigger className="h-20 w-full rounded-3xl border-white/10 bg-white/5 px-6 text-2xl font-black text-lime-300">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#151515] text-white">
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-lg font-bold text-zinc-400">{progressLabel}</Label>
                <Input
                  type="number"
                  min={0}
                  max={progressHint}
                  value={form.progress}
                  onChange={(event) => setForm((current) => ({ ...current, progress: event.target.value }))}
                  className="h-20 rounded-3xl border-white/10 bg-white/5 px-6 text-2xl font-black text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-lg font-bold text-zinc-400">Score (0-10)</Label>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  value={form.score}
                  onChange={(event) => setForm((current) => ({ ...current, score: event.target.value }))}
                  className="h-20 rounded-3xl border-white/10 bg-white/5 px-6 text-2xl font-black text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-lg font-bold text-zinc-400">Start Date</Label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(event) => setForm((current) => ({ ...current, start_date: event.target.value }))}
                  className="h-20 rounded-3xl border-white/10 bg-white/5 px-6 text-2xl font-black text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-lg font-bold text-zinc-400">End Date</Label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={(event) => setForm((current) => ({ ...current, end_date: event.target.value }))}
                  className="h-20 rounded-3xl border-white/10 bg-white/5 px-6 text-2xl font-black text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-lg font-bold text-zinc-400">Total Rewatches</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.total_rewatched}
                  onChange={(event) => setForm((current) => ({ ...current, total_rewatched: event.target.value }))}
                  className="h-20 rounded-3xl border-white/10 bg-white/5 px-6 text-2xl font-black text-white"
                />
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <Label className="text-lg font-bold text-zinc-400">Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                className="min-h-32 rounded-3xl border-white/10 bg-white/5 px-6 py-5 text-lg text-white"
              />
            </div>

            {error ? <p className="mt-4 text-sm font-bold text-red-400">{error}</p> : null}

            <DialogFooter className="mt-6 flex-col items-stretch justify-between gap-4 border-t border-white/5 pt-6 sm:flex-row sm:items-center">
              <div>
                {entry?.id ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleDelete}
                    disabled={isSaving}
                    className="h-16 rounded-3xl border border-white/10 bg-white/5 px-6 text-red-500 hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="mr-2 h-5 w-5" />
                    Delete
                  </Button>
                ) : null}
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="h-16 rounded-3xl border border-white/10 bg-white/5 px-8 text-white hover:bg-white/10"
                >
                  <XCircle className="mr-2 h-5 w-5" />
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="h-16 rounded-3xl bg-white/10 px-8 text-white hover:bg-white/20"
                >
                  <Save className="mr-2 h-5 w-5" />
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
