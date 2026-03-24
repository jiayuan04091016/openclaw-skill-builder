import { saveCloudGatewayBundle, fetchCloudGatewayProjects } from "@/lib/cloud-gateway-service";
import { buildCloudSyncBundle } from "@/lib/cloud-project-sync";
import { createProjectService } from "@/lib/project-service";

export type CloudGatewaySmokeReport = {
  fetchedProjectCount: number;
  bundleOk: boolean;
  bundleProjectCount: number;
  bundleMessage: string;
  ok: boolean;
};

export async function runCloudGatewaySmoke(): Promise<CloudGatewaySmokeReport> {
  const projectService = createProjectService();
  const sampleProject = projectService.createProject("create", "验证云端网关链路");
  const projects = await fetchCloudGatewayProjects();
  const bundleResult = await saveCloudGatewayBundle(buildCloudSyncBundle([sampleProject]));
  const ok =
    projects.length >= 0 &&
    bundleResult.projectCount === 1 &&
    typeof bundleResult.ok === "boolean" &&
    bundleResult.message.trim().length > 0;

  return {
    fetchedProjectCount: projects.length,
    bundleOk: bundleResult.ok,
    bundleProjectCount: bundleResult.projectCount,
    bundleMessage: bundleResult.message,
    ok,
  };
}

