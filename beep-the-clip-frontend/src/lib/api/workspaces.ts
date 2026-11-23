import { apiClient } from "@/lib/api-client"

export interface Workspace {
  id: string
  title: string
  status: "hidden" | "active" | "archived"
  created_at: string
  updated_at: string
}

export const workspacesApi = {
  list(): Promise<Workspace[]> {
    return apiClient.get("/api/v1/workspaces")
  },

  get(id: string): Promise<Workspace> {
    return apiClient.get(`/api/v1/workspaces/${id}`)
  },

  create(title: string): Promise<Workspace> {
    return apiClient.post("/api/v1/workspaces", { title })
  },

  archive(id: string): Promise<void> {
    return apiClient.delete(`/api/v1/workspaces/${id}`)
  },
}
