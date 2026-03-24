import { buildLocalOcrText } from "@/lib/media-local-enhancement";
import { normalizeRemoteOcrResult } from "@/lib/media-remote-contracts";
import { getProviderConfig } from "@/lib/provider-config";
import { getClientGatewayUrl } from "@/lib/provider-gateway-client";
import { buildRemoteProviderUrl, requestRemoteJson } from "@/lib/remote-provider-client";
import type { OcrResult, ResourceItem } from "@/types/app";

export type OcrProvider = {
  extractText: (resource: ResourceItem) => Promise<OcrResult>;
};

function createLocalOcrProvider(): OcrProvider {
  return {
    extractText: async (resource) => {
      if (resource.type !== "image") {
        return {
          status: "not-configured",
          text: resource.content,
          message: "当前资源不是图片，不需要走 OCR 处理。",
        };
      }

      return {
        status: "completed",
        text: buildLocalOcrText(resource),
        message: "已使用本地 OCR 规则提取文字，可继续接入真实 OCR 服务提升准确率。",
      };
    },
  };
}

function createRemoteOcrProvider(ocrProviderUrl: string): OcrProvider {
  return {
    extractText: async (resource) => {
      const result = normalizeRemoteOcrResult(
        await requestRemoteJson<unknown>(buildRemoteProviderUrl(ocrProviderUrl, "/extract"), {
          method: "POST",
          payload: resource,
        }),
      );

      return (
        result ?? {
          status: "not-configured",
          text: resource.content,
          message: "远端 OCR provider 调用失败。",
        }
      );
    },
  };
}

function createGatewayOcrProvider(gatewayBaseUrl: string): OcrProvider {
  return createRemoteOcrProvider(gatewayBaseUrl);
}

export function createOcrProvider(): OcrProvider {
  const providerConfig = getProviderConfig();

  if (providerConfig.ocrProviderUrl) {
    return createRemoteOcrProvider(providerConfig.ocrProviderUrl);
  }

  const gatewayBaseUrl = getClientGatewayUrl("/api/provider/ocr");

  if (gatewayBaseUrl) {
    return createGatewayOcrProvider(gatewayBaseUrl);
  }

  return createLocalOcrProvider();
}

