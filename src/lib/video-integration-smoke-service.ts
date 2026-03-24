import { createMediaProcessingService } from "@/lib/media-processing-service";
import { createProjectService } from "@/lib/project-service";

export type VideoIntegrationSmokeReport = {
  processedKind: "ocr" | "video" | "unsupported";
  completed: boolean;
  ok: boolean;
};

export async function runVideoIntegrationSmoke(): Promise<VideoIntegrationSmokeReport> {
  const mediaProcessingService = createMediaProcessingService();
  const projectService = createProjectService();
  const resource = projectService.createResource("video", "video-smoke.mp4", "测试视频内容");
  const result = await mediaProcessingService.processResource(resource);

  return {
    processedKind: result.kind,
    completed: result.kind === "video" && result.result.status === "completed",
    ok: result.kind === "video",
  };
}

