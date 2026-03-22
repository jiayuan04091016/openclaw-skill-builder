import { createCloudProjectGateway } from "@/lib/cloud-project-gateway";
import { createCloudSyncEngine } from "@/lib/cloud-sync-engine";
import type { CloudProjectRecord, CloudSyncBundle, CloudSyncPlan, CloudSyncResult, ProjectRecord } from "@/types/app";

export type CloudSyncClient = {
  buildPlan: (projects: ProjectRecord[]) => CloudSyncPlan;
  buildBundle: (projects: ProjectRecord[]) => CloudSyncBundle;
  pushBundle: (projects: ProjectRecord[]) => Promise<CloudSyncResult>;
  restoreBundle: (payload: CloudSyncBundle | CloudProjectRecord[]) => ProjectRecord[];
  pullAndMerge: (localProjects: ProjectRecord[]) => Promise<ProjectRecord[]>;
};

export function createCloudSyncClient(): CloudSyncClient {
  const gateway = createCloudProjectGateway();
  const engine = createCloudSyncEngine(gateway);

  return {
    buildPlan: (projects) => engine.buildPlan(projects),
    buildBundle: (projects) => engine.buildBundle(projects),
    pushBundle: (projects) => engine.pushProjects(projects),
    restoreBundle: (payload) => gateway.restoreProjects(payload),
    pullAndMerge: (localProjects) => engine.pullAndMerge(localProjects),
  };
}
