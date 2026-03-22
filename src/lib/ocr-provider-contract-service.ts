import { isNormalizedOcrResult } from "@/lib/media-remote-contracts";
import { buildRemoteProviderUrl, requestRemoteJson } from "@/lib/remote-provider-client";
import { buildServerProviderHeaders, getServerProviderConfig } from "@/lib/server-provider-config";

export type OcrProviderContractReport = {
  configured: boolean;
  extractShapeValid: boolean;
  allValid: boolean;
  issues: string[];
};

export async function buildOcrProviderContractReport(): Promise<OcrProviderContractReport> {
  const providerConfig = getServerProviderConfig();
  const headers = buildServerProviderHeaders(providerConfig.ocr);

  if (!providerConfig.ocr.url) {
    return {
      configured: false,
      extractShapeValid: false,
      allValid: false,
      issues: ["未配置 OCR provider 地址。"],
    };
  }

  const issues: string[] = [];
  const extractResult = await requestRemoteJson<unknown>(buildRemoteProviderUrl(providerConfig.ocr.url, "/extract"), {
    method: "POST",
    headers,
    payload: {
      id: "sample-ocr-resource",
      type: "image",
      name: "sample.png",
      content: "示例 OCR 内容",
      createdAt: new Date().toISOString(),
    },
  });

  const extractShapeValid = isNormalizedOcrResult(extractResult);

  if (!extractShapeValid) {
    issues.push("POST /extract 返回结构不符合当前前端约定。");
  }

  return {
    configured: true,
    extractShapeValid,
    allValid: extractShapeValid,
    issues,
  };
}
