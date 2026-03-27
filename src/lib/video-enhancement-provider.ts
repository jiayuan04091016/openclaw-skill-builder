import { buildLocalVideoSummary } from "@/lib/media-local-enhancement";
import { normalizeRemoteVideoEnhancementResult } from "@/lib/media-remote-contracts";
import { getProviderConfig } from "@/lib/provider-config";
import { getClientGatewayUrl } from "@/lib/provider-gateway-client";
import { buildRemoteProviderUrl, requestRemoteJsonWithRetry } from "@/lib/remote-provider-client";
import type { ResourceItem, VideoEnhancementResult } from "@/types/app";

export type VideoEnhancementProvider = {
  summarize: (resource: ResourceItem) => Promise<VideoEnhancementResult>;
};

function createLocalVideoEnhancementProvider(): VideoEnhancementProvider {
  return {
    summarize: async (resource) => {
      if (resource.type !== "video") {
        return {
          status: "not-configured",
          summary: resource.content,
          message: "当前资源不是视频，不需要走视频增强流程。",
        };
      }

      return {
        status: "completed",
        summary: buildLocalVideoSummary(resource),
        message: "已使用本地视频摘要规则生成要点，可继续接入真实视频理解服务提升质量。",
      };
    },
  };
}

function createRemoteVideoEnhancementProvider(videoEnhancementProviderUrl: string): VideoEnhancementProvider {
  const providerConfig = getProviderConfig();
  const retryOptions = {
    attempts: providerConfig.providerRequestRetryAttempts,
    initialDelayMs: providerConfig.providerRequestRetryInitialDelayMs,
    backoffFactor: providerConfig.providerRequestRetryBackoffFactor,
  };

  return {
    summarize: async (resource) => {
      const result = normalizeRemoteVideoEnhancementResult(
        await requestRemoteJsonWithRetry<unknown>(
          buildRemoteProviderUrl(videoEnhancementProviderUrl, "/summarize"),
          {
            method: "POST",
            payload: resource,
            telemetryKey: "video",
          },
          retryOptions,
        ),
      );

      return (
        result ?? {
          status: "not-configured",
          summary: resource.content,
          message: "远端视频增强 provider 调用失败。",
        }
      );
    },
  };
}

function createGatewayVideoEnhancementProvider(gatewayBaseUrl: string): VideoEnhancementProvider {
  return createRemoteVideoEnhancementProvider(gatewayBaseUrl);
}

export function createVideoEnhancementProvider(): VideoEnhancementProvider {
  const providerConfig = getProviderConfig();

  if (providerConfig.videoEnhancementProviderUrl) {
    return createRemoteVideoEnhancementProvider(providerConfig.videoEnhancementProviderUrl);
  }

  const gatewayBaseUrl = getClientGatewayUrl("/api/provider/video");

  if (gatewayBaseUrl) {
    return createGatewayVideoEnhancementProvider(gatewayBaseUrl);
  }

  return createLocalVideoEnhancementProvider();
}
