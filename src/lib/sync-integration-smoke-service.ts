import { createCloudSyncClient } from "@/lib/cloud-sync-client";
import { createProjectService } from "@/lib/project-service";

export type SyncIntegrationSmokeReport = {
  builtBundle: boolean;
  restoredProjectCount: number;
  mergedProjectCount: number;
  ok: boolean;
};

export async function runSyncIntegrationSmoke(): Promise<SyncIntegrationSmokeReport> {
  const cloudSyncClient = createCloudSyncClient();
  const projectService = createProjectService();
  const project = projectService.createProject("create", "同步烟雾测试目标");
  const bundle = cloudSyncClient.buildBundle([project]);
  const restoredProjects = cloudSyncClient.restoreBundle(bundle);
  const mergedProjects = await cloudSyncClient.pullAndMerge(restoredProjects);
  const builtBundle = bundle.projectCount === 1 && bundle.projects.length === 1;
  const restoredProjectCount = restoredProjects.length;
  const mergedProjectCount = mergedProjects.length;

  return {
    builtBundle,
    restoredProjectCount,
    mergedProjectCount,
    ok: builtBundle && restoredProjectCount >= 1 && mergedProjectCount >= 1,
  };
}
