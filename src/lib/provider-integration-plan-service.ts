import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { buildAuthProviderContractReport } from "@/lib/auth-provider-contract-service";
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
      contractIssues?: string[];
    }
  >;
};

const PROVIDER_PLAN_SPECS: ProviderPlanSpec[] = [
  {
    key: "auth",
    envKeys: [
      "NEXT_PUBLIC_AUTH_PROVIDER_URL",
      "NEXT_PUBLIC_AUTH_PROVIDER_HEALTH_PATH",
      "AUTH_PROVIDER_URL",
      "AUTH_PROVIDER_HEALTH_PATH",
    ],
    requiredEndpoints: ["GET /health", "GET /profile", "POST /sign-in", "POST /sign-out"],
    note: "先接账号登录，后续云端项目才能稳定归属到用户。",
  },
  {
    key: "cloud-storage",
    envKeys: [
      "NEXT_PUBLIC_CLOUD_STORAGE_PROVIDER_URL",
      "NEXT_PUBLIC_CLOUD_STORAGE_PROVIDER_HEALTH_PATH",
      "CLOUD_STORAGE_PROVIDER_URL",
      "CLOUD_STORAGE_PROVIDER_HEALTH_PATH",
    ],
    requiredEndpoints: ["GET /health", "GET /projects", "POST /bundle"],
    note: "接完账号后，优先接项目存储和跨设备同步。",
  },
  {
    key: "ocr",
    envKeys: [
      "NEXT_PUBLIC_OCR_PROVIDER_URL",
      "NEXT_PUBLIC_OCR_PROVIDER_HEALTH_PATH",
      "OCR_PROVIDER_URL",
      "OCR_PROVIDER_HEALTH_PATH",
    ],
    requiredEndpoints: ["GET /health", "POST /extract"],
    note: "OCR 会直接提升图片资料进入 Skill 生成链路的质量。",
  },
  {
    key: "video",
    envKeys: [
      "NEXT_PUBLIC_VIDEO_ENHANCEMENT_PROVIDER_URL",
      "NEXT_PUBLIC_VIDEO_ENHANCEMENT_PROVIDER_HEALTH_PATH",
      "VIDEO_ENHANCEMENT_PROVIDER_URL",
      "VIDEO_ENHANCEMENT_PROVIDER_HEALTH_PATH",
    ],
    requiredEndpoints: ["GET /health", "POST /summarize"],
    note: "视频增强放在最后接，避免一开始就引入高成本链路。",
  },
];

function buildItemPlan(item: ProviderReadinessItem, contractIssues?: string[]) {
  const spec = PROVIDER_PLAN_SPECS.find((candidate) => candidate.key === item.key);

  return {
    ...item,
    envKeys: spec?.envKeys ?? [],
    requiredEndpoints: spec?.requiredEndpoints ?? [],
    note: spec?.note ?? "",
    contractIssues,
  };
}

export async function buildProviderIntegrationPlan(): Promise<ProviderIntegrationPlan> {
  const readiness = await buildProviderReadinessReport();
  const authContract = await buildAuthProviderContractReport();

  const items = readiness.items.map((item) =>
    buildItemPlan(item, item.key === "auth" && authContract.configured ? authContract.issues : undefined),
  );

  const authNeedsContractFix =
    authContract.configured && readiness.items.find((item) => item.key === "auth")?.reachable && !authContract.allValid;

  return {
    readyForRealIntegration: readiness.allConfigured && readiness.allReachable && authContract.allValid,
    nextProvider: readiness.nextRequiredKey ?? readiness.unreachableKeys[0] ?? (authNeedsContractFix ? "auth" : null),
    nextStep: authNeedsContractFix
      ? "先修正 auth provider 的返回结构，再继续联调。"
      : readiness.nextIntegrationStep,
    items,
  };
}

export function buildProviderIntegrationPlanMarkdown(plan: ProviderIntegrationPlan) {
  const lines = [
    "# 真实服务接入计划快照",
    "",
    `当前是否已可进入真实联调：${plan.readyForRealIntegration ? "可以" : "还不可以"}`,
    `下一优先 provider：${plan.nextProvider ?? "无"}`,
    `下一步：${plan.nextStep}`,
    "",
    "## 接入顺序",
  ];

  for (const item of plan.items) {
    lines.push(`- ${item.key}（${item.configured ? "已配置" : "未配置"}）`);
    lines.push(`  说明：${item.note}`);

    if (item.envKeys.length) {
      lines.push(`  环境变量：${item.envKeys.join("、")}`);
    }

    if (item.requiredEndpoints.length) {
      lines.push(`  最小接口：${item.requiredEndpoints.join("、")}`);
    }

    if (item.contractIssues?.length) {
      lines.push(`  合约问题：${item.contractIssues.join("；")}`);
    }
  }

  return lines.join("\n");
}

export async function writeProviderIntegrationPlanSnapshot() {
  const plan = await buildProviderIntegrationPlan();
  const markdown = buildProviderIntegrationPlanMarkdown(plan);
  const docsDir = path.join(process.cwd(), "docs");
  const fileName = "provider-integration-plan.md";
  const filePath = path.join(docsDir, fileName);

  await mkdir(docsDir, { recursive: true });
  await writeFile(filePath, markdown, "utf8");

  return {
    filePath,
    fileName,
    readyForRealIntegration: plan.readyForRealIntegration,
    nextProvider: plan.nextProvider,
  };
}

