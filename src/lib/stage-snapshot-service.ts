import { writeProviderIntegrationPlanSnapshot } from "@/lib/provider-integration-plan-service";
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
  const [readinessSnapshot, providerSnapshot] = await Promise.all([
    writeV2CapabilitySnapshot(),
    writeProviderIntegrationPlanSnapshot(),
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
    ],
    readyForUnifiedTesting: readinessSnapshot.reportReady,
    readyForRealIntegration: providerSnapshot.readyForRealIntegration,
  };
}
