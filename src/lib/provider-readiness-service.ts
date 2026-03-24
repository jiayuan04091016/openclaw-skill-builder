import { buildProviderHealthItems } from "@/lib/provider-health-service";

export type ProviderReadinessItem = {
  key: "auth" | "cloud-storage" | "ocr" | "video";
  configured: boolean;
  target: string;
  healthUrl: string;
  reachable: boolean | null;
  statusCode: number | null;
  state: "not-configured" | "reachable" | "unreachable";
};

export type ProviderReadinessReport = {
  allConfigured: boolean;
  allReachable: boolean;
  items: ProviderReadinessItem[];
  missingKeys: ProviderReadinessItem["key"][];
  unreachableKeys: ProviderReadinessItem["key"][];
  nextRequiredKey: ProviderReadinessItem["key"] | null;
  nextIntegrationStep: string;
};

function buildNextIntegrationStep(items: ProviderReadinessItem[]) {
  const missing = items.find((item) => !item.configured);

  if (missing) {
    return `先补 ${missing.key} 的真实服务地址。`;
  }

  const unreachable = items.find((item) => item.configured && item.reachable === false);

  if (unreachable) {
    return `先检查 ${unreachable.key} 的健康检查地址是否可达。`;
  }

  return "四类真实服务都已可达，可以进入联调。";
}

export async function buildProviderReadinessReport(): Promise<ProviderReadinessReport> {
  const items = await buildProviderHealthItems();

  return {
    allConfigured: items.every((item) => item.configured),
    allReachable: items.every((item) => item.configured && item.reachable !== false),
    items,
    missingKeys: items.filter((item) => !item.configured).map((item) => item.key),
    unreachableKeys: items.filter((item) => item.configured && item.reachable === false).map((item) => item.key),
    nextRequiredKey: items.find((item) => !item.configured)?.key ?? null,
    nextIntegrationStep: buildNextIntegrationStep(items),
  };
}

