import {
  normalizeRemoteOcrResult,
  normalizeRemoteVideoEnhancementResult,
} from "@/lib/media-remote-contracts";
import { buildRemoteProviderUrl, requestRemoteJsonWithRetry } from "@/lib/remote-provider-client";
import { buildServerProviderHeaders, getServerProviderConfig } from "@/lib/server-provider-config";
import type { OcrResult, ResourceItem, VideoEnhancementResult } from "@/types/app";

function buildGatewayHeaders(baseHeaders: HeadersInit | undefined, sessionToken: string) {
  const token = sessionToken.trim();
  if (!token) {
    return baseHeaders;
  }

  return {
    ...(baseHeaders ?? {}),
    Authorization: `Bearer ${token}`,
  };
}

export async function runOcrGateway(resource: ResourceItem, sessionToken = ""): Promise<OcrResult> {
  const config = getServerProviderConfig();
  const retryAttempts = 3;

  if (!config.ocr.url) {
    return {
      status: "not-configured",
      text: resource.content,
      message: "当前还没有接入真实 OCR 服务。",
    };
  }

  const result = normalizeRemoteOcrResult(
    await requestRemoteJsonWithRetry<unknown>(
      buildRemoteProviderUrl(config.ocr.url, "/extract"),
      {
        method: "POST",
        payload: resource,
        headers: buildGatewayHeaders(buildServerProviderHeaders(config.ocr), sessionToken),
      },
      {
        attempts: retryAttempts,
        initialDelayMs: 250,
        backoffFactor: 2,
      },
    ),
  );

  return (
    result ?? {
      status: "not-configured",
      text: resource.content,
      message: "OCR 网关调用远端 extract 失败。",
    }
  );
}

export async function runVideoGateway(
  resource: ResourceItem,
  sessionToken = "",
): Promise<VideoEnhancementResult> {
  const config = getServerProviderConfig();
  const retryAttempts = 3;

  if (!config.video.url) {
    return {
      status: "not-configured",
      summary: resource.content,
      message: "当前还没有接入真实视频增强服务。",
    };
  }

  const result = normalizeRemoteVideoEnhancementResult(
    await requestRemoteJsonWithRetry<unknown>(
      buildRemoteProviderUrl(config.video.url, "/summarize"),
      {
        method: "POST",
        payload: resource,
        headers: buildGatewayHeaders(buildServerProviderHeaders(config.video), sessionToken),
      },
      {
        attempts: retryAttempts,
        initialDelayMs: 250,
        backoffFactor: 2,
      },
    ),
  );

  return (
    result ?? {
      status: "not-configured",
      summary: resource.content,
      message: "视频网关调用远端 summarize 失败。",
    }
  );
}
