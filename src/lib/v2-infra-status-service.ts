import { buildAuthReadinessReport } from "@/lib/auth-readiness-service";
import { buildCloudReadinessReport } from "@/lib/cloud-readiness-service";
import { buildImportReadinessReport } from "@/lib/import-readiness-service";
import { buildOcrReadinessReport } from "@/lib/ocr-readiness-service";
import { buildProviderReadinessReport } from "@/lib/provider-readiness-service";
import { buildSyncReadinessReport } from "@/lib/sync-readiness-service";
import { buildVideoReadinessReport } from "@/lib/video-readiness-service";

type InfraKey =
  | "provider-connectivity"
  | "auth"
  | "cloud"
  | "sync"
  | "import"
  | "ocr"
  | "video";

export type V2InfraStatusItem = {
  key: InfraKey;
  label: string;
  ready: boolean;
  nextStep: string;
  blockingIssues?: string[];
};

export type V2InfraStatusReport = {
  generatedAt: string;
  progressPercent: number;
  passedCount: number;
  totalCount: number;
  readyForUnifiedTesting: boolean;
  readyForRealIntegration: boolean;
  nextBlockingKey: InfraKey | null;
  nextStep: string;
  items: V2InfraStatusItem[];
};

function toPercent(passedCount: number, totalCount: number) {
  if (totalCount <= 0) {
    return 0;
  }
  return Math.round((passedCount / totalCount) * 100);
}

export async function buildV2InfraStatusReport(): Promise<V2InfraStatusReport> {
  const [provider, auth, cloud, sync, imported, ocr, video] = await Promise.all([
    buildProviderReadinessReport(),
    buildAuthReadinessReport(),
    buildCloudReadinessReport(),
    buildSyncReadinessReport(),
    Promise.resolve(buildImportReadinessReport()),
    buildOcrReadinessReport(),
    buildVideoReadinessReport(),
  ]);

  const items: V2InfraStatusItem[] = [
    {
      key: "provider-connectivity",
      label: "真实服务连通性",
      ready: provider.readyForRealIntegration,
      nextStep: provider.nextIntegrationStep,
      blockingIssues: provider.issues.map((issue) => issue.message),
    },
    { key: "auth", label: "账号登录", ready: auth.readyForIntegration, nextStep: auth.nextStep },
    { key: "cloud", label: "云端存储", ready: cloud.readyForIntegration, nextStep: cloud.nextStep },
    { key: "sync", label: "跨设备同步", ready: sync.readyForIntegration, nextStep: sync.nextStep },
    { key: "import", label: "旧 Skill 解析", ready: imported.readyForIntegration, nextStep: imported.nextStep },
    { key: "ocr", label: "OCR", ready: ocr.readyForIntegration, nextStep: ocr.nextStep },
    { key: "video", label: "视频增强", ready: video.readyForIntegration, nextStep: video.nextStep },
  ];

  const passedCount = items.filter((item) => item.ready).length;
  const nextBlocking = items.find((item) => !item.ready) ?? null;

  return {
    generatedAt: new Date().toISOString(),
    progressPercent: toPercent(passedCount, items.length),
    passedCount,
    totalCount: items.length,
    readyForUnifiedTesting: passedCount === items.length,
    readyForRealIntegration: provider.readyForRealIntegration,
    nextBlockingKey: nextBlocking?.key ?? null,
    nextStep: nextBlocking?.nextStep ?? "All core modules are ready for unified testing.",
    items,
  };
}

export function buildV2InfraStatusMarkdown(report: V2InfraStatusReport) {
  const lines = [
    "# V2 Infra Status",
    "",
    `- generatedAt: ${report.generatedAt}`,
    `- progressPercent: ${report.progressPercent}%`,
    `- passed: ${report.passedCount}/${report.totalCount}`,
    `- readyForUnifiedTesting: ${report.readyForUnifiedTesting}`,
    `- readyForRealIntegration: ${report.readyForRealIntegration}`,
    `- nextBlockingKey: ${report.nextBlockingKey ?? "none"}`,
    `- nextStep: ${report.nextStep}`,
    "",
    "## Items",
  ];

  for (const item of report.items) {
    lines.push(`- ${item.label}: ${item.ready ? "ready" : "not-ready"}`);
    lines.push(`  nextStep: ${item.nextStep}`);

    if (item.blockingIssues?.length) {
      lines.push(`  blockingIssues: ${item.blockingIssues.join(" | ")}`);
    }
  }

  return lines.join("\n");
}
