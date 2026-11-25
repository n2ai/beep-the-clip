import { ArrowLeft, CheckCircle, Loader, Upload } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { workspacesApi, type Workspace } from "@/lib/api/workspaces"
import {
  ALLOWED_VIDEO_TYPES,
  MAX_VIDEO_SIZE_BYTES,
  uploadToS3,
  videosApi,
  type Video,
} from "@/lib/api/videos"
import { cn } from "@/lib/utils"

type UploadState =
  | { phase: "idle" }
  | { phase: "uploading"; filename: string; percent: number }
  | { phase: "confirming"; filename: string }
  | { phase: "done"; video: Video }
  | { phase: "error"; message: string }

function formatSize(bytes: number | null) {
  if (bytes === null) return ""
  const mb = bytes / (1024 * 1024)
  return mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(1)} MB`
}

function PanelShell({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col overflow-hidden", className)}>
      <div className="flex h-10 shrink-0 items-center border-b border-border px-4">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="flex flex-1 items-center justify-center bg-black/5 p-6 dark:bg-black/20">
        {children}
      </div>
    </div>
  )
}

function OriginalPanel({
  state,
  onPickFile,
}: {
  state: UploadState
  onPickFile: (file: File) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <PanelShell label="Original" className="flex-1">
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_VIDEO_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onPickFile(file)
          e.target.value = ""
        }}
      />

      {(state.phase === "idle" || state.phase === "error") && (
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="rounded-full bg-muted p-4">
            <Upload className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            MP4, MOV, AVI or WebM, up to 2 GB
          </p>
          {state.phase === "error" && (
            <p className="max-w-xs text-sm text-destructive" role="alert">
              {state.message}
            </p>
          )}
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="size-3.5" />
            Choose video
          </Button>
        </div>
      )}

      {state.phase === "uploading" && (
        <div className="w-full max-w-sm space-y-2">
          <div className="flex justify-between text-sm">
            <span className="truncate">{state.filename}</span>
            <span className="text-muted-foreground">{state.percent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${state.percent}%` }}
            />
          </div>
        </div>
      )}

      {state.phase === "confirming" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader className="size-4 animate-spin" />
          Finishing {state.filename}…
        </div>
      )}

      {state.phase === "done" && (
        <div className="flex flex-col items-center gap-2 text-center">
          <CheckCircle className="size-8 text-emerald-600 dark:text-emerald-400" />
          <p className="text-sm font-medium">{state.video.filename}</p>
          <p className="text-xs text-muted-foreground">
            Uploaded · {formatSize(state.video.file_size_bytes)}
          </p>
        </div>
      )}
    </PanelShell>
  )
}

export default function WorkspacePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [upload, setUpload] = useState<UploadState>({ phase: "idle" })

  useEffect(() => {
    if (!id) return
    workspacesApi
      .get(id)
      .then(setWorkspace)
      .catch((err) =>
        setLoadError(err instanceof Error ? err.message : "Failed to load workspace."),
      )
  }, [id])

  async function handlePickFile(file: File) {
    if (!id) return

    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      setUpload({ phase: "error", message: "Unsupported file type. Use MP4, MOV, AVI or WebM." })
      return
    }
    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      setUpload({ phase: "error", message: "File is larger than 2 GB." })
      return
    }

    try {
      setUpload({ phase: "uploading", filename: file.name, percent: 0 })
      const { video_id, upload_url } = await videosApi.requestUploadUrl(file, id)

      await uploadToS3(upload_url, file, (percent) =>
        setUpload({ phase: "uploading", filename: file.name, percent }),
      )

      setUpload({ phase: "confirming", filename: file.name })
      const video = await videosApi.confirm(video_id)
      setUpload({ phase: "done", video })
      setWorkspace((ws) => (ws ? { ...ws, status: "active" } : ws))
    } catch (err) {
      setUpload({
        phase: "error",
        message: err instanceof Error ? err.message : "Upload failed.",
      })
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Back to dashboard"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="size-4" />
        </Button>

        <Separator orientation="vertical" className="h-5" />

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-medium">
            {workspace?.title ?? (loadError ? "Workspace unavailable" : "Loading…")}
          </h1>
          {loadError && <p className="text-xs text-destructive">{loadError}</p>}
        </div>
      </header>

      <div className="flex flex-1 divide-x divide-border overflow-hidden">
        <OriginalPanel state={upload} onPickFile={handlePickFile} />
        <PanelShell label="Edited" className="flex-1">
          <p className="text-sm text-muted-foreground">
            The edited version appears after analysis finishes.
          </p>
        </PanelShell>
      </div>
    </div>
  )
}
