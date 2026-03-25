import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { buildProviderHealthItems } from "@/lib/provider-health-service";
import { getProviderConfig } from "@/lib/provider-config";
import { getServerProviderConfig } from "@/lib/server-provider-config";

type ProviderKey = "auth" | "cloud-storage" | "ocr" | "video";
type ProviderMode = "local" | "mock" | "remote";

export type RealIntegrationReadinessItem = {
  key: ProviderKey;
  label: string;
  mode: ProviderMode;
  configured: boolean;
  reachable: boolean | null;
  statusCode: number | null;
  publicTarget: string;
  serverTarget: string;
  effectiveTarget: string;
  healthUrl: string;
  urlMismatch: boolean;
  authHeaderConfigured: boolean;
  nextStep: string;
};

export type RealIntegrationReadinessReport = {
  generatedAt: string;
  retryPolicy: {
    attempts: number;
    initialDelayMs: number;
    backoffFactor: number;
  };
  allConfigured: boolean;
  allReachable: boolean;
  allUsingRemoteTarget: boolean;
  readyForRealIntegration: boolean;
  nextStep: string;
  items: RealIntegrationReadinessItem[];
};

const providerLabels: Record<ProviderKey, string> = {
  auth: "账号登录",
  "cloud-storage": "云端存储",
  ocr: "OCR",
  video: "视频增强",
};

const providerMockUrlSigns: Record<ProviderKey, string> = {
  auth: "/api/mock-providers/auth",
  "cloud-storage": "/api/mock-providers/cloud",
  ocr: "/api/mock-providers/ocr",
  video: "/api/mock-providers/video",
};

function detectProviderMode(target: string, key: ProviderKey): ProviderMode {
  if (!target.trim()) {
    return "local";
  }

  if (target.includes(providerMockUrlSigns[key])) {
    return "mock";
  }

  return "remote";
}

function buildItemNextStep(item: Omit<RealIntegrationReadinessItem, "nextStep">) {
  if (!item.configured) {
    return `补充 ${item.label} 的 provider 地址。`;
  }

  if (item.urlMismatch) {
    return `统一 ${item.label} 的 server/public provider 地址，避免联调偏差。`;
  }

  if (item.mode !== "remote") {
    return `将 ${item.label} 从本地或 mock 地址切到真实远端 provider。`;
  }

  if (item.reachable === false) {
    return `修复 ${item.label} 的健康检查可达性。`;
  }

  if (!item.authHeaderConfigured) {
    return `${item.label} 已可达；如远端要求鉴权，请补充服务端鉴权 Header。`;
  }

  return `${item.label} 已具备真实联调条件。`;
}

function buildReportNextStep(items: RealIntegrationReadinessItem[]) {
  const firstBlocking =
    items.find((item) => !item.configured) ??
    items.find((item) => item.urlMismatch) ??
    items.find((item) => item.mode !== "remote") ??
    items.find((item) => item.reachable === false);

  if (!firstBlocking) {
    return "四类能力都已达到真实联调基线。";
  }

  return firstBlocking.nextStep;
}

export async function buildRealIntegrationReadinessReport(): Promise<RealIntegrationReadinessReport> {
  const [healthItems] = await Promise.all([buildProviderHealthItems()]);
  const publicConfig = getProviderConfig();
  const serverConfig = getServerProviderConfig();

  const itemByKey = new Map(healthItems.map((item) => [item.key, item]));

  const items: RealIntegrationReadinessItem[] = (["auth", "cloud-storage", "ocr", "video"] as const).map((key) => {
    const health = itemByKey.get(key);
    const publicTarget =
      key === "auth"
        ? publicConfig.authProviderUrl
        : key === "cloud-storage"
          ? publicConfig.cloudStorageProviderUrl
          : key === "ocr"
            ? publicConfig.ocrProviderUrl
            : publicConfig.videoEnhancementProviderUrl;
    const serverTarget =
      key === "auth"
        ? serverConfig.auth.url
        : key === "cloud-storage"
          ? serverConfig.cloudStorage.url
          : key === "ocr"
            ? serverConfig.ocr.url
            : serverConfig.video.url;
    const authHeaderConfigured =
      key === "auth"
        ? Boolean(serverConfig.auth.authHeaderValue.trim())
        : key === "cloud-storage"
          ? Boolean(serverConfig.cloudStorage.authHeaderValue.trim())
          : key === "ocr"
            ? Boolean(serverConfig.ocr.authHeaderValue.trim())
            : Boolean(serverConfig.video.authHeaderValue.trim());

    const effectiveTarget = serverTarget || publicTarget;
    const itemWithoutNextStep = {
      key,
      label: providerLabels[key],
      mode: detectProviderMode(effectiveTarget, key),
      configured: Boolean(effectiveTarget),
      reachable: health?.reachable ?? null,
      statusCode: health?.statusCode ?? null,
      publicTarget,
      serverTarget,
      effectiveTarget,
      healthUrl: health?.healthUrl ?? "",
      urlMismatch: Boolean(publicTarget && serverTarget && publicTarget !== serverTarget),
      authHeaderConfigured,
    };

    return {
      ...itemWithoutNextStep,
      nextStep: buildItemNextStep(itemWithoutNextStep),
    };
  });

  const allConfigured = items.every((item) => item.configured);
  const allReachable = items.every((item) => item.configured && item.reachable === true);
  const allUsingRemoteTarget = items.every((item) => item.mode === "remote");
  const readyForRealIntegration = allConfigured && allReachable && allUsingRemoteTarget && !items.some((i) => i.urlMismatch);

  return {
    generatedAt: new Date().toISOString(),
    retryPolicy: {
      attempts: serverConfig.providerRequestRetryAttempts || publicConfig.providerRequestRetryAttempts,
      initialDelayMs:
        serverConfig.providerRequestRetryInitialDelayMs || publicConfig.providerRequestRetryInitialDelayMs,
      backoffFactor:
        serverConfig.providerRequestRetryBackoffFactor || publicConfig.providerRequestRetryBackoffFactor,
    },
    allConfigured,
    allReachable,
    allUsingRemoteTarget,
    readyForRealIntegration,
    nextStep: buildReportNextStep(items),
    items,
  };
}

export function buildRealIntegrationReadinessMarkdown(report: RealIntegrationReadinessReport) {
  const lines = [
    "# Real Integration Readiness",
    "",
    `- generatedAt: ${report.generatedAt}`,
    `- allConfigured: ${report.allConfigured}`,
    `- allReachable: ${report.allReachable}`,
    `- allUsingRemoteTarget: ${report.allUsingRemoteTarget}`,
    `- readyForRealIntegration: ${report.readyForRealIntegration}`,
    `- retryPolicy: attempts=${report.retryPolicy.attempts}, initialDelayMs=${report.retryPolicy.initialDelayMs}, backoffFactor=${report.retryPolicy.backoffFactor}`,
    `- nextStep: ${report.nextStep}`,
    "",
    "## Items",
  ];

  for (const item of report.items) {
    lines.push(`- ${item.label}（${item.mode}）`);
    lines.push(`  configured: ${item.configured}, reachable: ${item.reachable}, urlMismatch: ${item.urlMismatch}`);
    lines.push(`  publicTarget: ${item.publicTarget || "(empty)"}`);
    lines.push(`  serverTarget: ${item.serverTarget || "(empty)"}`);
    lines.push(`  healthUrl: ${item.healthUrl || "(empty)"}`);
    lines.push(`  authHeaderConfigured: ${item.authHeaderConfigured}`);
    lines.push(`  nextStep: ${item.nextStep}`);
  }

  return lines.join("\n");
}

export async function writeRealIntegrationReadinessSnapshot() {
  const report = await buildRealIntegrationReadinessReport();
  const markdown = buildRealIntegrationReadinessMarkdown(report);
  const docsDir = path.join(process.cwd(), "docs");
  const fileName = "real-integration-readiness.md";
  const filePath = path.join(docsDir, fileName);

  await mkdir(docsDir, { recursive: true });
  await writeFile(filePath, markdown, "utf8");

  return {
    fileName,
    filePath,
    readyForRealIntegration: report.readyForRealIntegration,
  };
}
