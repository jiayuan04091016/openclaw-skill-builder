import { getProviderConfig } from "@/lib/provider-config";
import { buildRemoteProviderUrl, requestRemoteJson } from "@/lib/remote-provider-client";
import { normalizeRemoteVideoEnhancementResult } from "@/lib/media-remote-contracts";
import type { ResourceItem, VideoEnhancementResult } from "@/types/app";

export type VideoEnhancementProvider = {
  summarize: (resource: ResourceItem) => Promise<VideoEnhancementResult>;
};

function createLocalVideoEnhancementProvider(): VideoEnhancementProvider {
  return {
    summarize: async (resource) => ({
      status: "not-configured",
      summary: resource.content,
      message:
        resource.type === "video"
          ? "视频增强 provider 已预留，后续可以直接接真实摘要或转写服务。"
          : "当前资源不是视频，暂时不需要走视频增强流程。",
    }),
  };
}

function createRemoteVideoEnhancementProvider(videoEnhancementProviderUrl: string): VideoEnhancementProvider {
  return {
    summarize: async (resource) => {
      const result = normalizeRemoteVideoEnhancementResult(
        await requestRemoteJson<unknown>(buildRemoteProviderUrl(videoEnhancementProviderUrl, "/summarize"), {
          method: "POST",
          payload: resource,
        }),
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

export function createVideoEnhancementProvider(): VideoEnhancementProvider {
  const providerConfig = getProviderConfig();

  if (providerConfig.videoEnhancementProviderUrl) {
    return createRemoteVideoEnhancementProvider(providerConfig.videoEnhancementProviderUrl);
  }

  return createLocalVideoEnhancementProvider();
}
