import type { ChangeEvent } from "react";

import type { SyncService } from "@/lib/sync-service";
import { createProjectService } from "@/lib/project-service";
import type { ProjectRecord } from "@/types/app";

export type ProjectTransferService = {
  exportProject: (project: ProjectRecord) => ReturnType<ReturnType<typeof createProjectService>["exportProject"]>;
  exportBackup: (syncService: SyncService | null, projects: ProjectRecord[]) => Promise<Awaited<ReturnType<SyncService["exportBackup"]>> | null>;
  buildCloudPreview: (syncService: SyncService | null, projects: ProjectRecord[]) => Promise<Awaited<ReturnType<SyncService["buildCloudPreview"]>> | null>;
  prepareCloudSync: (syncService: SyncService | null, projects: ProjectRecord[]) => Promise<Awaited<ReturnType<SyncService["prepareCloudSync"]>> | null>;
  refreshFromCloud: (syncService: SyncService | null, projects: ProjectRecord[]) => Promise<Awaited<ReturnType<SyncService["refreshFromCloud"]>> | null>;
  importBackup: (syncService: SyncService | null, event: ChangeEvent<HTMLInputElement>) => Promise<Awaited<ReturnType<SyncService["importBackup"]>> | null>;
};

export function createProjectTransferService(): ProjectTransferService {
  const projectService = createProjectService();

  return {
    exportProject: (project) => projectService.exportProject(project),
    exportBackup: async (syncService, projects) => {
      if (!syncService) {
        return null;
      }

      return syncService.exportBackup(projects);
    },
    buildCloudPreview: async (syncService, projects) => {
      if (!syncService) {
        return null;
      }

      return syncService.buildCloudPreview(projects);
    },
    prepareCloudSync: async (syncService, projects) => {
      if (!syncService) {
        return null;
      }

      return syncService.prepareCloudSync(projects);
    },
    refreshFromCloud: async (syncService, projects) => {
      if (!syncService) {
        return null;
      }

      return syncService.refreshFromCloud(projects);
    },
    importBackup: async (syncService, event) => {
      if (!syncService) {
        return null;
      }

      return syncService.importBackup(event);
    },
  };
}
