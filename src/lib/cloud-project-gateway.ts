import { restoreProjectsFromCloud, serializeProjectForCloud } from "@/lib/cloud-project-sync";
import { getRuntimeCapabilities } from "@/lib/runtime-capabilities";
import type { CloudProjectRecord, CloudSyncBundle, ProjectRecord } from "@/types/app";

export type CloudProjectGateway = {
  isEnabled: () => boolean;
  pullProjects: () => Promise<CloudProjectRecord[]>;
  pushBundle: (bundle: CloudSyncBundle) => Promise<{ ok: boolean; message: string; projectCount: number }>;
  restoreProjects: (payload: CloudSyncBundle | CloudProjectRecord[]) => ProjectRecord[];
  serializeProject: (project: ProjectRecord) => CloudProjectRecord;
};

export function createCloudProjectGateway(): CloudProjectGateway {
  const capabilities = getRuntimeCapabilities();

  return {
    isEnabled: () => capabilities.cloudSyncEnabled,
    pullProjects: async () => [],
    pushBundle: async (bundle) => ({
      ok: capabilities.cloudSyncEnabled,
      message: capabilities.cloudSyncEnabled
        ? `云端项目网关已预留，当前共有 ${bundle.projectCount} 个项目可继续接真实存储。`
        : "当前还没有接入真实云端项目存储。",
      projectCount: bundle.projectCount,
    }),
    restoreProjects: (payload) => restoreProjectsFromCloud(payload),
    serializeProject: (project) => serializeProjectForCloud(project),
  };
}
