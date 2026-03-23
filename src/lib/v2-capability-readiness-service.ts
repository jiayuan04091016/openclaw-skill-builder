import { buildAuthReadinessReport } from "@/lib/auth-readiness-service";
import { buildCloudReadinessReport } from "@/lib/cloud-readiness-service";
import { buildImportReadinessReport } from "@/lib/import-readiness-service";
import { buildOcrReadinessReport } from "@/lib/ocr-readiness-service";
import { buildProviderGatewayReadinessReport } from "@/lib/provider-gateway-readiness-service";
import { buildSyncReadinessReport } from "@/lib/sync-readiness-service";
import { buildVideoReadinessReport } from "@/lib/video-readiness-service";

export type V2CapabilityReadinessItem = {
  key: "auth" | "cloud-storage" | "sync" | "import" | "ocr" | "video";
  label: string;
  ready: boolean;
  nextStep: string;
  issues: string[];
};

export type V2CapabilityReadinessReport = {
  allReadyForUnifiedTesting: boolean;
  nextBlockingCapability: V2CapabilityReadinessItem["key"] | null;
  nextStep: string;
  items: V2CapabilityReadinessItem[];
};

export async function buildV2CapabilityReadinessReport(): Promise<V2CapabilityReadinessReport> {
  const [auth, cloud, sync, skillImport, ocr, video, gatewayReadiness] = await Promise.all([
    buildAuthReadinessReport(),
    buildCloudReadinessReport(),
    buildSyncReadinessReport(),
    Promise.resolve(buildImportReadinessReport()),
    buildOcrReadinessReport(),
    buildVideoReadinessReport(),
    buildProviderGatewayReadinessReport(),
  ]);

  const authGateway = gatewayReadiness.items.find((item) => item.key === "auth");
  const cloudGateway = gatewayReadiness.items.find((item) => item.key === "cloud");
  const mediaGateway = gatewayReadiness.items.find((item) => item.key === "media");

  const items: V2CapabilityReadinessItem[] = [
    {
      key: "auth",
      label: "账号登录",
      ready: auth.readyForIntegration && (authGateway?.ready ?? false),
      nextStep: !auth.readyForIntegration ? auth.nextStep : authGateway?.nextStep ?? "鉴权网关状态未知。",
      issues: [...auth.issues, ...(authGateway?.issues ?? [])],
    },
    {
      key: "cloud-storage",
      label: "云端存储",
      ready: cloud.readyForIntegration && (cloudGateway?.ready ?? false),
      nextStep: !cloud.readyForIntegration ? cloud.nextStep : cloudGateway?.nextStep ?? "云端网关状态未知。",
      issues: [...cloud.issues, ...(cloudGateway?.issues ?? [])],
    },
    {
      key: "sync",
      label: "项目跨设备同步",
      ready: sync.readyForIntegration && (cloudGateway?.ready ?? false),
      nextStep: !sync.readyForIntegration ? sync.nextStep : cloudGateway?.nextStep ?? "云端网关状态未知。",
      issues: [...sync.issues, ...(cloudGateway?.issues ?? [])],
    },
    {
      key: "import",
      label: "真正的旧 Skill 解析",
      ready: skillImport.readyForIntegration,
      nextStep: skillImport.nextStep,
      issues: skillImport.issues,
    },
    {
      key: "ocr",
      label: "OCR",
      ready: ocr.readyForIntegration && (mediaGateway?.ready ?? false),
      nextStep: !ocr.readyForIntegration ? ocr.nextStep : mediaGateway?.nextStep ?? "媒体网关状态未知。",
      issues: [...ocr.issues, ...(mediaGateway?.issues ?? [])],
    },
    {
      key: "video",
      label: "视频增强",
      ready: video.readyForIntegration && (mediaGateway?.ready ?? false),
      nextStep: !video.readyForIntegration ? video.nextStep : mediaGateway?.nextStep ?? "媒体网关状态未知。",
      issues: [...video.issues, ...(mediaGateway?.issues ?? [])],
    },
  ];

  const firstBlockingItem = items.find((item) => !item.ready) ?? null;

  return {
    allReadyForUnifiedTesting: items.every((item) => item.ready),
    nextBlockingCapability: firstBlockingItem?.key ?? null,
    nextStep: firstBlockingItem?.nextStep ?? "1 到 6 项都已具备进入统一测试的条件。",
    items,
  };
}

export function buildV2CapabilityReadinessMarkdown(report: V2CapabilityReadinessReport) {
  const lines = [
    "# 第二版能力 readiness 快照",
    "",
    `整体状态：${report.allReadyForUnifiedTesting ? "已可进入统一测试" : "暂未全部就绪"}`,
    report.nextBlockingCapability
      ? `当前第一阻塞项：${report.nextBlockingCapability}`
      : "当前第一阻塞项：无",
    `下一步：${report.nextStep}`,
    "",
    "## 能力清单",
  ];

  for (const item of report.items) {
    lines.push(`- ${item.label}（${item.ready ? "已就绪" : "未就绪"}）`);

    if (!item.ready) {
      lines.push(`  下一步：${item.nextStep}`);
    }

    if (item.issues.length) {
      lines.push(`  问题：${item.issues.join("；")}`);
    }
  }

  return lines.join("\n");
}

