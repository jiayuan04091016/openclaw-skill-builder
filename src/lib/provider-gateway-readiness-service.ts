import { runAuthGatewaySmoke } from "@/lib/auth-gateway-smoke-service";
import { runCloudGatewaySmoke } from "@/lib/cloud-gateway-smoke-service";
import { runMediaGatewaySmoke } from "@/lib/media-gateway-smoke-service";

export type ProviderGatewayReadinessKey = "auth" | "cloud" | "media";

export type ProviderGatewayReadinessItem = {
  key: ProviderGatewayReadinessKey;
  label: string;
  ready: boolean;
  nextStep: string;
  issues: string[];
};

export type ProviderGatewayReadinessReport = {
  allReadyForIntegration: boolean;
  nextBlockingGateway: ProviderGatewayReadinessKey | null;
  nextStep: string;
  items: ProviderGatewayReadinessItem[];
};

export async function buildProviderGatewayReadinessReport(): Promise<ProviderGatewayReadinessReport> {
  const [auth, cloud, media] = await Promise.all([runAuthGatewaySmoke(), runCloudGatewaySmoke(), runMediaGatewaySmoke()]);

  const authIssues: string[] = [];
  if (!auth.profileDisplayName.trim()) {
    authIssues.push("鉴权网关 profile 缺少 displayName。");
  }
  if (!auth.signInMessage.trim()) {
    authIssues.push("鉴权网关 sign-in 缺少 message。");
  }
  if (!auth.signOutOk) {
    authIssues.push(`鉴权网关 sign-out 未通过：${auth.signOutMessage}`);
  }

  const cloudIssues: string[] = [];
  if (!cloud.ok) {
    cloudIssues.push(`云端网关链路未通过：${cloud.bundleMessage}`);
  }

  const mediaIssues: string[] = [];
  if (!media.ok) {
    mediaIssues.push(`OCR 网关状态异常：${media.ocrStatus}（${media.ocrMessage}）`);
    mediaIssues.push(`视频网关状态异常：${media.videoStatus}（${media.videoMessage}）`);
  }

  const items: ProviderGatewayReadinessItem[] = [
    {
      key: "auth",
      label: "鉴权网关",
      ready: auth.ok,
      nextStep: auth.ok ? "鉴权网关链路可用。" : "先修正鉴权网关 profile/sign-in/sign-out 的返回行为。",
      issues: authIssues,
    },
    {
      key: "cloud",
      label: "云端网关",
      ready: cloud.ok,
      nextStep: cloud.ok ? "云端网关链路可用。" : "先修正云端网关 projects/bundle 的链路行为。",
      issues: cloudIssues,
    },
    {
      key: "media",
      label: "媒体网关（OCR/视频）",
      ready: media.ok,
      nextStep: media.ok ? "媒体网关链路可用。" : "先修正 OCR/视频网关的返回状态与消息。",
      issues: mediaIssues,
    },
  ];

  const firstBlockingItem = items.find((item) => !item.ready) ?? null;

  return {
    allReadyForIntegration: items.every((item) => item.ready),
    nextBlockingGateway: firstBlockingItem?.key ?? null,
    nextStep: firstBlockingItem?.nextStep ?? "网关层已具备进入统一联调的条件。",
    items,
  };
}

