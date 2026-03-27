import { runAuthCloudBridgeSmoke } from "@/lib/auth-cloud-bridge-smoke-service";
import { buildAuthReadinessReport } from "@/lib/auth-readiness-service";
import { buildCloudReadinessReport } from "@/lib/cloud-readiness-service";
import { buildImportReadinessReport } from "@/lib/import-readiness-service";
import { buildMediaProviderContractSummary } from "@/lib/media-provider-contract-summary-service";
import { runMockCloudIsolationSmoke } from "@/lib/mock-cloud-isolation-smoke-service";
import { buildOcrReadinessReport } from "@/lib/ocr-readiness-service";
import { evaluateProviderTelemetryGate } from "@/lib/provider-telemetry-gate-service";
import { buildProviderRequestTelemetryReport } from "@/lib/provider-request-telemetry-service";
import { buildRealIntegrationReadinessReport } from "@/lib/real-integration-readiness-service";
import { buildSyncReadinessReport } from "@/lib/sync-readiness-service";
import { runSyncRoundtripSmoke } from "@/lib/sync-roundtrip-smoke-service";
import { buildVideoReadinessReport } from "@/lib/video-readiness-service";

type AcceptanceCheck = {
  key:
    | "auth"
    | "cloud"
    | "sync"
    | "import"
    | "ocr"
    | "video"
    | "auth-cloud-bridge-smoke"
    | "sync-roundtrip-smoke"
    | "media-provider-contract"
    | "mock-cloud-isolation"
    | "provider-telemetry";
  label: string;
  ok: boolean;
  nextStep: string;
};

export type V2AcceptanceReport = {
  generatedAt: string;
  scorePercent: number;
  passedCount: number;
  totalCount: number;
  allPassed: boolean;
  nextStep: string;
  checks: AcceptanceCheck[];
};

function calcScorePercent(passedCount: number, totalCount: number) {
  if (totalCount <= 0) {
    return 0;
  }

  return Math.round((passedCount / totalCount) * 100);
}

export async function runV2AcceptanceChecks(): Promise<V2AcceptanceReport> {
  const [
    auth,
    cloud,
    sync,
    skillImport,
    ocr,
    video,
    authCloudBridge,
    syncRoundtrip,
    mediaContract,
    isolation,
    telemetry,
    realIntegration,
  ] =
    await Promise.all([
      buildAuthReadinessReport(),
      buildCloudReadinessReport(),
      buildSyncReadinessReport(),
      buildImportReadinessReport(),
      buildOcrReadinessReport(),
      buildVideoReadinessReport(),
      runAuthCloudBridgeSmoke(),
      runSyncRoundtripSmoke(),
      buildMediaProviderContractSummary(),
      runMockCloudIsolationSmoke(),
      Promise.resolve(buildProviderRequestTelemetryReport()),
      buildRealIntegrationReadinessReport(),
    ]);
  const telemetryGate = evaluateProviderTelemetryGate(telemetry, realIntegration);

  const checks: AcceptanceCheck[] = [
    { key: "auth", label: "账号登录 readiness", ok: auth.readyForIntegration, nextStep: auth.nextStep },
    { key: "cloud", label: "云端存储 readiness", ok: cloud.readyForIntegration, nextStep: cloud.nextStep },
    { key: "sync", label: "跨设备同步 readiness", ok: sync.readyForIntegration, nextStep: sync.nextStep },
    { key: "import", label: "旧 Skill 解析 readiness", ok: skillImport.readyForIntegration, nextStep: skillImport.nextStep },
    { key: "ocr", label: "OCR readiness", ok: ocr.readyForIntegration, nextStep: ocr.nextStep },
    { key: "video", label: "视频增强 readiness", ok: video.readyForIntegration, nextStep: video.nextStep },
    {
      key: "auth-cloud-bridge-smoke",
      label: "登录到云端桥接 smoke",
      ok: authCloudBridge.ok,
      nextStep: authCloudBridge.ok ? "桥接链路已通过。" : "先修复登录到云端桥接链路。",
    },
    {
      key: "sync-roundtrip-smoke",
      label: "同步往返 smoke",
      ok: syncRoundtrip.ok,
      nextStep: syncRoundtrip.ok ? "同步往返链路已通过。" : "先修复同步往返 push/pull/merge 链路。",
    },
    {
      key: "media-provider-contract",
      label: "媒体 provider 合约",
      ok: mediaContract.allValid,
      nextStep: mediaContract.nextStep,
    },
    {
      key: "mock-cloud-isolation",
      label: "mock 云端隔离",
      ok: isolation.ok,
      nextStep: isolation.ok ? "mock 云端隔离已通过。" : "先修复 mock 云端按 token 隔离逻辑。",
    },
    {
      key: "provider-telemetry",
      label: "provider 请求遥测",
      ok: telemetryGate.healthy,
      nextStep: telemetryGate.nextStep,
    },
  ];

  const passedCount = checks.filter((check) => check.ok).length;
  const totalCount = checks.length;
  const allPassed = passedCount === totalCount;
  const firstBlocking = checks.find((check) => !check.ok);

  return {
    generatedAt: new Date().toISOString(),
    scorePercent: calcScorePercent(passedCount, totalCount),
    passedCount,
    totalCount,
    allPassed,
    nextStep: firstBlocking?.nextStep ?? "所有验收检查已通过。",
    checks,
  };
}

export function buildV2AcceptanceMarkdown(report: V2AcceptanceReport) {
  const lines = [
    "# V2 Acceptance Report",
    "",
    `- generatedAt: ${report.generatedAt}`,
    `- scorePercent: ${report.scorePercent}%`,
    `- passed: ${report.passedCount}/${report.totalCount}`,
    `- allPassed: ${report.allPassed}`,
    `- nextStep: ${report.nextStep}`,
    "",
    "## Checks",
  ];

  for (const check of report.checks) {
    lines.push(`- ${check.label}（${check.ok ? "通过" : "未通过"}）`);
    if (!check.ok) {
      lines.push(`  下一步：${check.nextStep}`);
    }
  }

  return lines.join("\n");
}
