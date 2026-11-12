import { Plus, Clock, CheckCircle, AlertCircle, Loader } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

type WorkspaceStatus = "processing" | "ready" | "flagged" | "uploading"

interface Workspace {
  id: string
  title: string
  status: WorkspaceStatus
  createdAt: string
  duration: string
  thumbnail?: string
}

// Placeholder data — replace with API call later
const MOCK_WORKSPACES: Workspace[] = [
  {
    id: "ws-1",
    title: "Product demo v2.mp4",
    status: "ready",
    createdAt: "2026-11-08",
    duration: "4:32",
  },
  {
    id: "ws-2",
    title: "Interview clip — Nov 7.mp4",
    status: "flagged",
    createdAt: "2026-11-07",
    duration: "12:10",
  },
  {
    id: "ws-3",
    title: "Intro animation.mp4",
    status: "processing",
    createdAt: "2026-11-10",
    duration: "0:45",
  },
  {
    id: "ws-4",
    title: "Keynote recording.mp4",
    status: "uploading",
    createdAt: "2026-11-10",
    duration: "—",
  },
]

const statusConfig: Record<
  WorkspaceStatus,
  { label: string; icon: React.ReactNode; className: string }
> = {
  ready: {
    label: "Ready",
    icon: <CheckCircle className="size-3.5" />,
    className: "text-emerald-600 dark:text-emerald-400",
  },
  flagged: {
    label: "Flagged",
    icon: <AlertCircle className="size-3.5" />,
    className: "text-amber-600 dark:text-amber-400",
  },
  processing: {
    label: "Processing",
    icon: <Loader className="size-3.5 animate-spin" />,
    className: "text-blue-600 dark:text-blue-400",
  },
  uploading: {
    label: "Uploading",
    icon: <Clock className="size-3.5" />,
    className: "text-muted-foreground",
  },
}

function WorkspaceCard({ workspace }: { workspace: Workspace }) {
  const navigate = useNavigate()
  const { label, icon, className: statusClass } = statusConfig[workspace.status]

  return (
    <Card
      className="cursor-pointer transition-shadow hover:ring-foreground/20"
      onClick={() => navigate(`/workspace/${workspace.id}`)}
    >
      {/* Thumbnail placeholder */}
      <div className="aspect-video w-full bg-muted flex items-center justify-center rounded-t-xl">
        <span className="text-xs text-muted-foreground">No preview</span>
      </div>

      <CardHeader>
        <CardTitle className="truncate">{workspace.title}</CardTitle>
        <CardDescription>{workspace.createdAt}</CardDescription>
      </CardHeader>

      <CardFooter className="flex items-center justify-between text-xs text-muted-foreground">
        <span className={cn("flex items-center gap-1 font-medium", statusClass)}>
          {icon}
          {label}
        </span>
        <span>{workspace.duration}</span>
      </CardFooter>
    </Card>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">My workspaces</h1>
          <p className="text-sm text-muted-foreground">
            {MOCK_WORKSPACES.length} workspace{MOCK_WORKSPACES.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => navigate("/workspace/new")}
        >
          <Plus className="size-4" />
          New upload
        </Button>
      </div>

      {/* Grid */}
      {MOCK_WORKSPACES.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <p className="text-sm text-muted-foreground">No workspaces yet.</p>
          <Button
            size="sm"
            variant="outline"
            className="mt-4 gap-1.5"
            onClick={() => navigate("/workspace/new")}
          >
            <Plus className="size-4" />
            Upload your first video
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {MOCK_WORKSPACES.map((ws) => (
            <WorkspaceCard key={ws.id} workspace={ws} />
          ))}
        </div>
      )}
    </div>
  )
}
