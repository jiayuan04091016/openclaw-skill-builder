import { buildProviderHealthItems } from "@/lib/provider-health-service";

export type ProviderReadinessKey = "auth" | "cloud-storage" | "ocr" | "video";

export type ProviderReadinessIssue = {
  key: ProviderReadinessKey;
  kind: "missing-config" | "unreachable";
  message: string;
  requiredEnvKeys: string[];
};

export type ProviderReadinessItem = {
  key: ProviderReadinessKey;
  configured: boolean;
  target: string;
  healthUrl: string;
  reachable: boolean | null;
  statusCode: number | null;
  state: "not-configured" | "reachable" | "unreachable";
  requiredEnvKeys: string[];
  recommendation: string;
};

export type ProviderReadinessReport = {
  allConfigured: boolean;
  allReachable: boolean;
  readyForRealIntegration: boolean;
  items: ProviderReadinessItem[];
  missingKeys: ProviderReadinessItem["key"][];
  unreachableKeys: ProviderReadinessItem["key"][];
  nextRequiredKey: ProviderReadinessItem["key"] | null;
  nextIntegrationStep: string;
  issues: ProviderReadinessIssue[];
};

const REQUIRED_ENV_KEYS: Record<ProviderReadinessKey, string[]> = {
  auth: ["AUTH_PROVIDER_URL", "NEXT_PUBLIC_AUTH_PROVIDER_URL"],
  "cloud-storage": ["CLOUD_STORAGE_PROVIDER_URL", "NEXT_PUBLIC_CLOUD_STORAGE_PROVIDER_URL"],
  ocr: ["OCR_PROVIDER_URL", "NEXT_PUBLIC_OCR_PROVIDER_URL"],
  video: ["VIDEO_ENHANCEMENT_PROVIDER_URL", "NEXT_PUBLIC_VIDEO_ENHANCEMENT_PROVIDER_URL"],
};

function buildRecommendation(
  key: ProviderReadinessKey,
  configured: boolean,
  reachable: boolean | null,
): string {
  if (!configured) {
    return `请先配置 ${REQUIRED_ENV_KEYS[key].join(" 或 ")}。`;
  }

  if (reachable === false) {
    return "健康检查不可达，请检查 provider URL、health path 和鉴权 Header。";
  }

  return "状态正常，可进入真实联调。";
}

function buildNextIntegrationStep(items: ProviderReadinessItem[]) {
  const missing = items.find((item) => !item.configured);
  if (missing) {
    return `先补齐 ${missing.key} 的服务配置，然后重新检查。`;
  }

  const unreachable = items.find((item) => item.configured && item.reachable === false);
  if (unreachable) {
    return `先修复 ${unreachable.key} 健康检查不可达问题，再继续联调。`;
  }

  return "四类真实服务均可达，可以开始端到端联调。";
}

function buildIssues(items: ProviderReadinessItem[]): ProviderReadinessIssue[] {
  const issues: ProviderReadinessIssue[] = [];

  for (const item of items) {
    if (!item.configured) {
      issues.push({
        key: item.key,
        kind: "missing-config",
        message: `缺少 ${item.key} 服务地址配置。`,
        requiredEnvKeys: item.requiredEnvKeys,
      });
      continue;
    }

    if (item.reachable === false) {
      issues.push({
        key: item.key,
        kind: "unreachable",
        message: `${item.key} 健康检查不可达（status=${item.statusCode ?? "unknown"}）。`,
        requiredEnvKeys: item.requiredEnvKeys,
      });
    }
  }

  return issues;
}

export async function buildProviderReadinessReport(): Promise<ProviderReadinessReport> {
  const healthItems = await buildProviderHealthItems();
  const items: ProviderReadinessItem[] = healthItems.map((item) => ({
    ...item,
    requiredEnvKeys: REQUIRED_ENV_KEYS[item.key],
    recommendation: buildRecommendation(item.key, item.configured, item.reachable),
  }));

  const allConfigured = items.every((item) => item.configured);
  const allReachable = items.every((item) => item.configured && item.reachable !== false);
  const readyForRealIntegration = allConfigured && allReachable;

  return {
    allConfigured,
    allReachable,
    readyForRealIntegration,
    items,
    missingKeys: items.filter((item) => !item.configured).map((item) => item.key),
    unreachableKeys: items.filter((item) => item.configured && item.reachable === false).map((item) => item.key),
    nextRequiredKey: items.find((item) => !item.configured)?.key ?? null,
    nextIntegrationStep: buildNextIntegrationStep(items),
    issues: buildIssues(items),
  };
}
