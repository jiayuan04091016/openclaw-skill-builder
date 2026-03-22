import { createCloudProjectGateway } from "@/lib/cloud-project-gateway";
import { createCloudSyncEngine } from "@/lib/cloud-sync-engine";
import { createProjectService } from "@/lib/project-service";

export type CloudIntegrationSmokeReport = {
  bundlePushOk: boolean;
  bundleProjectCount: number;
  gatewayEnabled: boolean;
  ok: boolean;
};

function createSampleProject() {
  const projectService = createProjectService();
  return projectService.createProject("create", "验证云端存储链路");
}

export async function runCloudIntegrationSmoke(): Promise<CloudIntegrationSmokeReport> {
  const gateway = createCloudProjectGateway();
  const syncEngine = createCloudSyncEngine(gateway);
  const sampleProject = createSampleProject();
  const result = await syncEngine.pushProjects([sampleProject]);

  return {
    bundlePushOk: result.status !== "not-configured",
    bundleProjectCount: result.projectCount,
    gatewayEnabled: gateway.isEnabled(),
    ok: gateway.isEnabled() ? result.projectCount === 1 : true,
  };
}
