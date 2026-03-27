import { isNormalizedVideoEnhancementResult } from "@/lib/media-remote-contracts";
import { buildRemoteProviderUrl, requestRemoteJsonWithRetry } from "@/lib/remote-provider-client";
import { buildServerProviderHeaders, getServerProviderConfig } from "@/lib/server-provider-config";

export type VideoProviderContractReport = {
  configured: boolean;
  summarizeShapeValid: boolean;
  allValid: boolean;
  issues: string[];
};

export async function buildVideoProviderContractReport(): Promise<VideoProviderContractReport> {
  const providerConfig = getServerProviderConfig();
  const headers = buildServerProviderHeaders(providerConfig.video);

  if (!providerConfig.video.url) {
    return {
      configured: false,
      summarizeShapeValid: false,
      allValid: false,
      issues: ["未配置 video provider 地址。"],
    };
  }

  const issues: string[] = [];
  const retryOptions = {
    attempts: providerConfig.providerRequestRetryAttempts,
    initialDelayMs: providerConfig.providerRequestRetryInitialDelayMs,
    backoffFactor: providerConfig.providerRequestRetryBackoffFactor,
  };
  const summarizeResult = await requestRemoteJsonWithRetry<unknown>(
    buildRemoteProviderUrl(providerConfig.video.url, "/summarize"),
    {
      method: "POST",
      headers,
      telemetryKey: "video",
      payload: {
        id: "sample-video-resource",
        type: "video",
        name: "sample.mp4",
        content: "示例视频内容",
        createdAt: new Date().toISOString(),
      },
    },
    retryOptions,
  );

  const summarizeShapeValid = isNormalizedVideoEnhancementResult(summarizeResult);

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
