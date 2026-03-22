import { restoreProjectsFromCloud, serializeProjectForCloud } from "@/lib/cloud-project-sync";
import { createCloudStorageService } from "@/lib/cloud-storage-service";
import type { CloudProjectRecord, CloudSyncBundle, ProjectRecord } from "@/types/app";

export type CloudProjectGateway = {
  isEnabled: () => boolean;
  pullProjects: () => Promise<CloudProjectRecord[]>;
  pushBundle: (bundle: CloudSyncBundle) => Promise<{ ok: boolean; message: string; projectCount: number }>;
  restoreProjects: (payload: CloudSyncBundle | CloudProjectRecord[]) => ProjectRecord[];
  serializeProject: (project: ProjectRecord) => CloudProjectRecord;
};

export function createCloudProjectGateway(): CloudProjectGateway {
  const storageService = createCloudStorageService();

  return {
    isEnabled: () => storageService.isConfigured(),
    pullProjects: async () => storageService.fetchProjects(),
    pushBundle: async (bundle) => storageService.saveBundle(bundle),
    restoreProjects: (payload) => restoreProjectsFromCloud(payload),
    serializeProject: (project) => serializeProjectForCloud(project),
  };
}
