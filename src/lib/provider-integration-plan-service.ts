import { buildProviderReadinessReport, type ProviderReadinessItem } from "@/lib/provider-readiness-service";

type ProviderPlanSpec = {
  key: ProviderReadinessItem["key"];
  envKeys: string[];
  requiredEndpoints: string[];
  note: string;
};

export type ProviderIntegrationPlan = {
  readyForRealIntegration: boolean;
  nextProvider: ProviderReadinessItem["key"] | null;
  nextStep: string;
  items: Array<
    ProviderReadinessItem & {
      envKeys: string[];
      requiredEndpoints: string[];
      note: string;
    }
  >;
};

const PROVIDER_PLAN_SPECS: ProviderPlanSpec[] = [
  {
    key: "auth",
    envKeys: ["NEXT_PUBLIC_AUTH_PROVIDER_URL", "NEXT_PUBLIC_AUTH_PROVIDER_HEALTH_PATH"],
    requiredEndpoints: ["GET /health", "GET /profile", "POST /sign-in", "POST /sign-out"],
    note: "先接账号登录，后续云端项目才能稳定归属到用户。",
  },
  {
    key: "cloud-storage",
    envKeys: ["NEXT_PUBLIC_CLOUD_STORAGE_PROVIDER_URL", "NEXT_PUBLIC_CLOUD_STORAGE_PROVIDER_HEALTH_PATH"],
    requiredEndpoints: ["GET /health", "GET /projects", "POST /bundle"],
    note: "接完账号后，优先接项目存储和跨设备同步。",
  },
  {
    key: "ocr",
    envKeys: ["NEXT_PUBLIC_OCR_PROVIDER_URL", "NEXT_PUBLIC_OCR_PROVIDER_HEALTH_PATH"],
    requiredEndpoints: ["GET /health", "POST /extract"],
    note: "OCR 会直接提升图片资料进入 Skill 生成链路的质量。",
  },
  {
    key: "video",
    envKeys: [
      "NEXT_PUBLIC_VIDEO_ENHANCEMENT_PROVIDER_URL",
      "NEXT_PUBLIC_VIDEO_ENHANCEMENT_PROVIDER_HEALTH_PATH",
    ],
    requiredEndpoints: ["GET /health", "POST /summarize"],
    note: "视频增强放在最后接，避免一开始就引入高成本链路。",
  },
];

function buildItemPlan(item: ProviderReadinessItem) {
  const spec = PROVIDER_PLAN_SPECS.find((candidate) => candidate.key === item.key);

  return {
    ...item,
    envKeys: spec?.envKeys ?? [],
    requiredEndpoints: spec?.requiredEndpoints ?? [],
    note: spec?.note ?? "",
  };
}

export async function buildProviderIntegrationPlan(): Promise<ProviderIntegrationPlan> {
  const readiness = await buildProviderReadinessReport();
  const items = readiness.items.map(buildItemPlan);

  return {
    readyForRealIntegration: readiness.allConfigured && readiness.allReachable,
    nextProvider: readiness.nextRequiredKey ?? readiness.unreachableKeys[0] ?? null,
    nextStep: readiness.nextIntegrationStep,
    items,
  };
}
