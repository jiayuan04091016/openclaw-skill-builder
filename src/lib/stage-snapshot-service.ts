import { writeMediaProviderContractSnapshot } from "@/lib/media-provider-contract-snapshot-service";
import { writeImportReadinessSnapshot } from "@/lib/import-readiness-snapshot-service";
import { writeRealIntegrationReadinessSnapshot } from "@/lib/real-integration-readiness-service";
import { writeReleaseReadinessSnapshot } from "@/lib/release-readiness-snapshot-service";
import { writeProviderIntegrationPlanSnapshot } from "@/lib/provider-integration-plan-service";
import { writeProviderGatewaySnapshot } from "@/lib/provider-gateway-snapshot-service";
import { writeSyncPipelineSnapshot } from "@/lib/sync-pipeline-snapshot-service";
import { writeSyncReadinessSnapshot } from "@/lib/sync-readiness-snapshot-service";
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

export async function writeStageSnapshot(): Promise<StageSnapshotResult> {
  const [
    readinessSnapshot,
    providerSnapshot,
    providerGatewaySnapshot,
    syncReadinessSnapshot,
    syncPipelineSnapshot,
    mediaProviderContractSnapshot,
    importSnapshot,
    realIntegrationReadinessSnapshot,
    v2InfraStatusSnapshot,
    releaseReadinessSnapshot,
  ] =
    await Promise.all([
      writeV2CapabilitySnapshot(),
      writeProviderIntegrationPlanSnapshot(),
      writeProviderGatewaySnapshot(),
      writeSyncReadinessSnapshot(),
      writeSyncPipelineSnapshot(),
      writeMediaProviderContractSnapshot(),
      writeImportReadinessSnapshot(),
      writeRealIntegrationReadinessSnapshot(),
      writeV2InfraStatusSnapshot(),
      writeReleaseReadinessSnapshot(),
    ]);

  return {
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
      releaseReadinessSnapshot.readyForBetaRelease,
  };
}
