import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { writeMediaProviderContractSnapshot } from "@/lib/media-provider-contract-snapshot-service";
import { writeImportReadinessSnapshot } from "@/lib/import-readiness-snapshot-service";
import { writeRealIntegrationReadinessSnapshot } from "@/lib/real-integration-readiness-service";
import { writeReleaseReadinessSnapshot } from "@/lib/release-readiness-snapshot-service";
import { writeProviderIntegrationPlanSnapshot } from "@/lib/provider-integration-plan-service";
import { writeProviderRequestTelemetrySnapshot } from "@/lib/provider-request-telemetry-service";
import { writeProviderTelemetryGateSnapshot } from "@/lib/provider-telemetry-gate-snapshot-service";
import { writeProviderGatewaySnapshot } from "@/lib/provider-gateway-snapshot-service";
import { writeSyncPipelineSnapshot } from "@/lib/sync-pipeline-snapshot-service";
import { writeSyncReadinessSnapshot } from "@/lib/sync-readiness-snapshot-service";
import { writeStageArtifactsSnapshot } from "@/lib/stage-artifacts-snapshot-service";
import { writeStageDeliveryStatusSnapshot } from "@/lib/stage-delivery-status-snapshot-service";
import { writeStageGatesSnapshot } from "@/lib/stage-gates-snapshot-service";
import { writeStageReportSnapshot } from "@/lib/stage-report-snapshot-service";
import { writeStageRunHistorySnapshot } from "@/lib/stage-run-history-snapshot-service";
import { writeV2CapabilitySnapshot } from "@/lib/v2-capability-snapshot-service";
import { writeV2InfraStatusSnapshot } from "@/lib/v2-infra-status-snapshot-service";

export type StageSnapshotResult = {
  generatedAt: string;
  files: Array<{
    fileName: string;
    filePath: string;
  }>;
  readyForUnifiedTesting: boolean;
  readyForRealIntegration: boolean;
};

function buildStageSnapshotManifestMarkdown(result: StageSnapshotResult) {
  const lines = [
    "# Stage Snapshot Manifest",
    "",
    `- generatedAt: ${result.generatedAt}`,
    `- readyForUnifiedTesting: ${result.readyForUnifiedTesting}`,
    `- readyForRealIntegration: ${result.readyForRealIntegration}`,
    "",
    "## Files",
  ];

  for (const file of result.files) {
    lines.push(`- ${file.fileName}: ${file.filePath}`);
  }

  return lines.join("\n");
}

async function writeStageSnapshotManifest(result: StageSnapshotResult) {
  const docsDir = path.join(process.cwd(), "docs");
  const fileName = "stage-snapshot-manifest.md";
  const filePath = path.join(docsDir, fileName);
  const markdown = buildStageSnapshotManifestMarkdown(result);

  await mkdir(docsDir, { recursive: true });
  await writeFile(filePath, markdown, "utf8");

  return {
    fileName,
    filePath,
  };
}

export async function writeStageSnapshot(): Promise<StageSnapshotResult> {
  const [
    readinessSnapshot,
    providerSnapshot,
    providerGatewaySnapshot,
    providerRequestTelemetrySnapshot,
    providerTelemetryGateSnapshot,
    syncReadinessSnapshot,
    syncPipelineSnapshot,
    mediaProviderContractSnapshot,
    importSnapshot,
    realIntegrationReadinessSnapshot,
    v2InfraStatusSnapshot,
    releaseReadinessSnapshot,
    stageReportSnapshot,
    stageDeliveryStatusSnapshot,
    stageArtifactsSnapshot,
    stageGatesSnapshot,
    stageRunHistorySnapshot,
  ] =
    await Promise.all([
      writeV2CapabilitySnapshot(),
      writeProviderIntegrationPlanSnapshot(),
      writeProviderGatewaySnapshot(),
      writeProviderRequestTelemetrySnapshot(),
      writeProviderTelemetryGateSnapshot(),
      writeSyncReadinessSnapshot(),
      writeSyncPipelineSnapshot(),
      writeMediaProviderContractSnapshot(),
      writeImportReadinessSnapshot(),
      writeRealIntegrationReadinessSnapshot(),
      writeV2InfraStatusSnapshot(),
      writeReleaseReadinessSnapshot(),
      writeStageReportSnapshot(),
      writeStageDeliveryStatusSnapshot(),
      writeStageArtifactsSnapshot(),
      writeStageGatesSnapshot(),
      writeStageRunHistorySnapshot(),
    ]);

  const result: StageSnapshotResult = {
    generatedAt: new Date().toISOString(),
    files: [
      {
        fileName: readinessSnapshot.fileName,
        filePath: readinessSnapshot.filePath,
      },
      {
        fileName: providerSnapshot.fileName,
        filePath: providerSnapshot.filePath,
      },
      {
        fileName: providerGatewaySnapshot.fileName,
        filePath: providerGatewaySnapshot.filePath,
      },
      {
        fileName: providerRequestTelemetrySnapshot.fileName,
        filePath: providerRequestTelemetrySnapshot.filePath,
      },
      {
        fileName: providerTelemetryGateSnapshot.fileName,
        filePath: providerTelemetryGateSnapshot.filePath,
      },
      {
        fileName: syncReadinessSnapshot.fileName,
        filePath: syncReadinessSnapshot.filePath,
      },
      {
        fileName: syncPipelineSnapshot.fileName,
        filePath: syncPipelineSnapshot.filePath,
      },
      {
        fileName: mediaProviderContractSnapshot.fileName,
        filePath: mediaProviderContractSnapshot.filePath,
      },
      {
        fileName: importSnapshot.readiness.fileName,
        filePath: importSnapshot.readiness.filePath,
      },
      {
        fileName: importSnapshot.contract.fileName,
        filePath: importSnapshot.contract.filePath,
      },
      {
        fileName: realIntegrationReadinessSnapshot.fileName,
        filePath: realIntegrationReadinessSnapshot.filePath,
      },
      {
        fileName: v2InfraStatusSnapshot.fileName,
        filePath: v2InfraStatusSnapshot.filePath,
      },
      {
        fileName: releaseReadinessSnapshot.fileName,
        filePath: releaseReadinessSnapshot.filePath,
      },
      {
        fileName: stageReportSnapshot.fileName,
        filePath: stageReportSnapshot.filePath,
      },
      {
        fileName: stageDeliveryStatusSnapshot.fileName,
        filePath: stageDeliveryStatusSnapshot.filePath,
      },
      {
        fileName: stageArtifactsSnapshot.fileName,
        filePath: stageArtifactsSnapshot.filePath,
      },
      {
        fileName: stageGatesSnapshot.fileName,
        filePath: stageGatesSnapshot.filePath,
      },
      {
        fileName: stageRunHistorySnapshot.fileName,
        filePath: stageRunHistorySnapshot.filePath,
      },
    ],
    readyForUnifiedTesting: readinessSnapshot.reportReady && v2InfraStatusSnapshot.readyForUnifiedTesting,
    readyForRealIntegration:
      providerSnapshot.readyForRealIntegration &&
      providerGatewaySnapshot.readyForIntegration &&
      syncReadinessSnapshot.readyForIntegration &&
      importSnapshot.readiness.readyForIntegration &&
      importSnapshot.contract.valid &&
      mediaProviderContractSnapshot.readyForIntegration &&
      syncPipelineSnapshot.readyForIntegration &&
      realIntegrationReadinessSnapshot.readyForRealIntegration &&
      releaseReadinessSnapshot.readyForBetaRelease &&
      stageReportSnapshot.readyForBetaRelease,
  };

  const manifest = await writeStageSnapshotManifest(result);
  return {
    ...result,
    files: [...result.files, manifest],
  };
}
