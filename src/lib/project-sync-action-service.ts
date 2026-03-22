import type { ChangeEvent } from "react";

import type { SyncService } from "@/lib/sync-service";
import type { ProjectRecord } from "@/types/app";

type CloudRefreshResult = {
  projects: ProjectRecord[];
  statusMessage: string;
};

type ImportedBackupResult = {
  projects: ProjectRecord[];
  homeGoal: string;
  statusMessage: string;
};

export type ProjectSyncActionService = {
  exportBackup: (
    syncService: SyncService | null,
    projects: ProjectRecord[],
  ) => Promise<Awaited<ReturnType<SyncService["exportBackup"]>> | null>;
  buildCloudPreview: (
    syncService: SyncService | null,
    projects: ProjectRecord[],
  ) => Promise<Awaited<ReturnType<SyncService["buildCloudPreview"]>> | null>;
  prepareCloudSync: (
    syncService: SyncService | null,
    projects: ProjectRecord[],
  ) => Promise<Awaited<ReturnType<SyncService["prepareCloudSync"]>> | null>;
  refreshFromCloud: (
    syncService: SyncService | null,
    projects: ProjectRecord[],
  ) => Promise<CloudRefreshResult | null>;
  importBackup: (
    syncService: SyncService | null,
    event: ChangeEvent<HTMLInputElement>,
  ) => Promise<ImportedBackupResult | null>;
};

export function createProjectSyncActionService(): ProjectSyncActionService {
  return {
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

      const mergedProjects = await syncService.refreshFromCloud(projects);

      if (!mergedProjects) {
        return null;
      }

      return {
        projects: mergedProjects,
        statusMessage: "已完成一次云端项目刷新，后续接入真实服务后会从这里继续。",
      };
    },
    importBackup: async (syncService, event) => {
      if (!syncService) {
        return null;
      }

      const importedProjects = await syncService.importBackup(event);

      if (!importedProjects) {
        return null;
      }

      return {
        projects: importedProjects,
        homeGoal: importedProjects[0]?.goal ?? "",
        statusMessage: `已导入 ${importedProjects.length} 个项目，并切换到最新一个。`,
      };
    },
  };
}
