import { writeProviderIntegrationPlanSnapshot } from "@/lib/provider-integration-plan-service";
import { writeProviderGatewaySnapshot } from "@/lib/provider-gateway-snapshot-service";
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
  const [readinessSnapshot, providerSnapshot, providerGatewaySnapshot] = await Promise.all([
    writeV2CapabilitySnapshot(),
    writeProviderIntegrationPlanSnapshot(),
    writeProviderGatewaySnapshot(),
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
    ],
    readyForUnifiedTesting: readinessSnapshot.reportReady,
    readyForRealIntegration: providerSnapshot.readyForRealIntegration && providerGatewaySnapshot.readyForIntegration,
  };
}
