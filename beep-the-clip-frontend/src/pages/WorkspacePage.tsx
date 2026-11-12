import { ArrowLeft, Upload } from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

// Placeholder workspace data — replace with API call later
const MOCK_WORKSPACE = {
  id: "ws-1",
  title: "Product demo v2.mp4",
  status: "ready" as const,
}

function VideoPanel({
  label,
  hasVideo,
  className,
}: {
  label: string
  hasVideo: boolean
  className?: string
}) {
  return (
    <div className={cn("flex flex-col overflow-hidden", className)}>
      {/* Panel header */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-4">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
      </div>

      {/* Video area */}
      <div className="flex flex-1 items-center justify-center bg-black/5 dark:bg-black/20">
        {hasVideo ? (
          // Placeholder for actual video player
          <div className="aspect-video w-full max-w-2xl rounded-lg bg-black flex items-center justify-center">
            <span className="text-xs text-white/40">Video player</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="rounded-full bg-muted p-4">
              <Upload className="size-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No video uploaded yet</p>
            <Button size="sm" variant="outline" className="gap-1.5">
              <Upload className="size-3.5" />
              Upload video
            </Button>
          </div>
        )}
      </div>

      {/* Timeline placeholder */}
      <div className="h-16 shrink-0 border-t border-border bg-muted/30 px-4 flex items-center">
        <div className="h-2 w-full rounded-full bg-border">
          <div className="h-full w-1/3 rounded-full bg-primary/50" />
        </div>
      </div>
    </div>
  )
}

export default function WorkspacePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === "new"
  const workspace = isNew ? null : MOCK_WORKSPACE

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Top bar */}
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
            {isNew ? "New workspace" : workspace?.title ?? "Workspace"}
          </h1>
          {!isNew && (
            <p className="text-xs text-muted-foreground">
              {workspace?.status === "ready" ? "Ready to review" : "Processing…"}
            </p>
          )}
        </div>

        {isNew && (
          <Button size="sm" className="gap-1.5 shrink-0">
            <Upload className="size-3.5" />
            Upload video
          </Button>
        )}
      </header>

      {/* Split view */}
      <div className="flex flex-1 overflow-hidden divide-x divide-border">
        <VideoPanel
          label="Original"
          hasVideo={!isNew}
          className="flex-1"
        />
        <VideoPanel
          label="Edited"
          hasVideo={false}
          className="flex-1"
        />
      </div>
    </div>
  )
}
