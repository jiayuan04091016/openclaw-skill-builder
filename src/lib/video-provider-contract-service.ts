import { getProviderConfig } from "@/lib/provider-config";
import { buildRemoteProviderUrl, requestRemoteJson } from "@/lib/remote-provider-client";
import type { VideoEnhancementResult } from "@/types/app";

export type VideoProviderContractReport = {
  configured: boolean;
  summarizeShapeValid: boolean;
  allValid: boolean;
  issues: string[];
};

function isValidVideoEnhancementResult(value: unknown): value is VideoEnhancementResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    (candidate.status === "not-configured" || candidate.status === "completed") &&
    typeof candidate.summary === "string" &&
    typeof candidate.message === "string"
  );
}

export async function buildVideoProviderContractReport(): Promise<VideoProviderContractReport> {
  const providerConfig = getProviderConfig();

  if (!providerConfig.videoEnhancementProviderUrl) {
    return {
      configured: false,
      summarizeShapeValid: false,
      allValid: false,
      issues: ["未配置 video provider 地址。"],
    };
  }

  const issues: string[] = [];
  const summarizeResult = await requestRemoteJson<unknown>(
    buildRemoteProviderUrl(providerConfig.videoEnhancementProviderUrl, "/summarize"),
    {
      method: "POST",
      payload: {
        id: "sample-video-resource",
        type: "video",
        name: "sample.mp4",
        content: "示例视频内容",
        createdAt: new Date().toISOString(),
      },
    },
  );

  const summarizeShapeValid = isValidVideoEnhancementResult(summarizeResult);

  if (!summarizeShapeValid) {
    issues.push("POST /summarize 返回结构不符合当前前端约定。");
  }

  return {
    configured: true,
    summarizeShapeValid,
    allValid: summarizeShapeValid,
    issues,
  };
}
