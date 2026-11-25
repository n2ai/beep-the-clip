import { apiClient } from "@/lib/api-client"

export const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "video/webm",
]

// Must match MAX_FILE_SIZE_BYTES in the backend (2 GB).
export const MAX_VIDEO_SIZE_BYTES = 2 * 1024 * 1024 * 1024

export interface UploadUrlResponse {
  video_id: string
  upload_url: string
  s3_key: string
}

export interface Video {
  id: string
  workspace_id: string
  filename: string
  s3_key: string
  status: string
  duration_seconds: number | null
  file_size_bytes: number | null
  content_type: string
  created_at: string
  updated_at: string
}

export const videosApi = {
  requestUploadUrl(file: File, workspaceId: string): Promise<UploadUrlResponse> {
    return apiClient.post("/api/v1/videos/upload-url", {
      workspace_id: workspaceId,
      filename: file.name,
      content_type: file.type,
      file_size_bytes: file.size,
    })
  },

  confirm(videoId: string): Promise<Video> {
    return apiClient.patch(`/api/v1/videos/${videoId}/confirm`)
  },
}

/**
 * PUT the file straight to S3 using the presigned URL.
 * XMLHttpRequest is used instead of fetch because fetch has no upload progress events.
 */
export function uploadToS3(
  uploadUrl: string,
  file: File,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("PUT", uploadUrl)
    // Content-Type must match the value the backend signed into the URL.
    xhr.setRequestHeader("Content-Type", file.type)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error(`Upload failed (S3 responded ${xhr.status}).`))
    }
    xhr.onerror = () => reject(new Error("Upload failed. Check your connection and the bucket CORS settings."))
    xhr.onabort = () => reject(new Error("Upload cancelled."))

    xhr.send(file)
  })
}
