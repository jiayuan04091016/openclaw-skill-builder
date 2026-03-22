import { buildAuthReadinessReport } from "@/lib/auth-readiness-service";
import { buildCloudReadinessReport } from "@/lib/cloud-readiness-service";
import { buildImportReadinessReport } from "@/lib/import-readiness-service";
import { buildOcrReadinessReport } from "@/lib/ocr-readiness-service";
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
  const [auth, cloud, sync, skillImport, ocr, video] = await Promise.all([
    buildAuthReadinessReport(),
    buildCloudReadinessReport(),
    buildSyncReadinessReport(),
    Promise.resolve(buildImportReadinessReport()),
    buildOcrReadinessReport(),
    buildVideoReadinessReport(),
  ]);

  const items: V2CapabilityReadinessItem[] = [
    {
      key: "auth",
      label: "账号登录",
      ready: auth.readyForIntegration,
      nextStep: auth.nextStep,
      issues: auth.issues,
    },
    {
      key: "cloud-storage",
      label: "云端存储",
      ready: cloud.readyForIntegration,
      nextStep: cloud.nextStep,
      issues: cloud.issues,
    },
    {
      key: "sync",
      label: "项目跨设备同步",
      ready: sync.readyForIntegration,
      nextStep: sync.nextStep,
      issues: sync.issues,
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
      ready: ocr.readyForIntegration,
      nextStep: ocr.nextStep,
      issues: ocr.issues,
    },
    {
      key: "video",
      label: "视频增强",
      ready: video.readyForIntegration,
      nextStep: video.nextStep,
      issues: video.issues,
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
