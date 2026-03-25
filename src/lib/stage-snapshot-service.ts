import { writeMediaProviderContractSnapshot } from "@/lib/media-provider-contract-snapshot-service";
import { writeImportReadinessSnapshot } from "@/lib/import-readiness-snapshot-service";
import { writeRealIntegrationReadinessSnapshot } from "@/lib/real-integration-readiness-service";
import { writeProviderIntegrationPlanSnapshot } from "@/lib/provider-integration-plan-service";
import { writeProviderGatewaySnapshot } from "@/lib/provider-gateway-snapshot-service";
import { writeSyncPipelineSnapshot } from "@/lib/sync-pipeline-snapshot-service";
import { writeSyncReadinessSnapshot } from "@/lib/sync-readiness-snapshot-service";
import { writeV2CapabilitySnapshot } from "@/lib/v2-capability-snapshot-service";

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
    ],
    readyForUnifiedTesting: readinessSnapshot.reportReady,
    readyForRealIntegration:
      providerSnapshot.readyForRealIntegration &&
      providerGatewaySnapshot.readyForIntegration &&
      syncReadinessSnapshot.readyForIntegration &&
      importSnapshot.readiness.readyForIntegration &&
      importSnapshot.contract.valid &&
      mediaProviderContractSnapshot.readyForIntegration &&
      syncPipelineSnapshot.readyForIntegration &&
      realIntegrationReadinessSnapshot.readyForRealIntegration,
  };
}
