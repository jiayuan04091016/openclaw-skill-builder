import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { runAuthCloudBridgeSmoke } from "@/lib/auth-cloud-bridge-smoke-service";
import { buildSyncReadinessReport } from "@/lib/sync-readiness-service";
import { runSyncRoundtripSmoke } from "@/lib/sync-roundtrip-smoke-service";

function buildSyncPipelineMarkdown(
  readiness: Awaited<ReturnType<typeof buildSyncReadinessReport>>,
  authBridge: Awaited<ReturnType<typeof runAuthCloudBridgeSmoke>>,
  roundtrip: Awaited<ReturnType<typeof runSyncRoundtripSmoke>>,
) {
  const lines = [
    "# Sync Pipeline Snapshot",
    "",
    `整体状态：${readiness.readyForIntegration ? "已就绪" : "未就绪"}`,
    `下一步：${readiness.nextStep}`,
    "",
    "## Readiness",
    `- cloudGatewayReady: ${readiness.cloudGatewayReady}`,
    `- authCloudBridgeReady: ${readiness.authCloudBridgeReady}`,
    `- syncSmokeReady: ${readiness.syncSmokeReady}`,
    `- syncRoundtripReady: ${readiness.syncRoundtripReady}`,
    "",
    "## Auth Cloud Bridge Smoke",
    `- ok: ${authBridge.ok}`,
    `- signInOk: ${authBridge.signInOk}`,
    `- hasSessionToken: ${authBridge.hasSessionToken}`,
    `- cloudBundleOk: ${authBridge.cloudBundleOk}`,
    `- signOutOk: ${authBridge.signOutOk}`,
    "",
    "## Sync Roundtrip Smoke",
    `- ok: ${roundtrip.ok}`,
    `- signInOk: ${roundtrip.signInOk}`,
    `- hasSessionToken: ${roundtrip.hasSessionToken}`,
    `- pushedProjectCount: ${roundtrip.pushedProjectCount}`,
    `- fetchedProjectCount: ${roundtrip.fetchedProjectCount}`,
    `- mergedProjectCount: ${roundtrip.mergedProjectCount}`,
    `- signOutOk: ${roundtrip.signOutOk}`,
  ];

  if (readiness.issues.length > 0) {
    lines.push("", "## Issues");
    for (const issue of readiness.issues) {
      lines.push(`- ${issue}`);
    }
  }

  return lines.join("\n");
}

export async function writeSyncPipelineSnapshot() {
  const [readiness, authBridge, roundtrip] = await Promise.all([
    buildSyncReadinessReport(),
    runAuthCloudBridgeSmoke(),
    runSyncRoundtripSmoke(),
  ]);

  const markdown = buildSyncPipelineMarkdown(readiness, authBridge, roundtrip);
  const docsDir = path.join(process.cwd(), "docs");
  const fileName = "sync-pipeline-snapshot.md";
  const filePath = path.join(docsDir, fileName);

  await mkdir(docsDir, { recursive: true });
  await writeFile(filePath, markdown, "utf8");

  return {
    filePath,
    fileName,
    readyForIntegration: readiness.readyForIntegration && authBridge.ok && roundtrip.ok,
  };
}

