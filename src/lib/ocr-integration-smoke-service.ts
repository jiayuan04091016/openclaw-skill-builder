import { createMediaProcessingService } from "@/lib/media-processing-service";
import { createProjectService } from "@/lib/project-service";

export type OcrIntegrationSmokeReport = {
  processedKind: "ocr" | "video" | "unsupported";
  completed: boolean;
  ok: boolean;
};

export async function runOcrIntegrationSmoke(): Promise<OcrIntegrationSmokeReport> {
  const mediaProcessingService = createMediaProcessingService();
  const projectService = createProjectService();
  const resource = projectService.createResource("image", "ocr-smoke.png", "测试 OCR 内容");
  const result = await mediaProcessingService.processResource(resource);

  return {
    processedKind: result.kind,
    completed: result.kind === "ocr" && result.result.status === "completed",
    ok: result.kind === "ocr",
  };
}
