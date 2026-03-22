import type { ChangeEvent, RefObject } from "react";

import type { CloudSyncClient } from "@/lib/cloud-sync-client";
import type { ProjectRepository } from "@/lib/project-repository";
import type { CloudSyncBundle, CloudSyncResult, ProjectRecord } from "@/types/app";

export type SyncService = {
  exportBackup: (projects: ProjectRecord[]) => Promise<{ blob: Blob; fileName: string } | null>;
  importBackup: (event: ChangeEvent<HTMLInputElement>) => Promise<ProjectRecord[]>;
  buildCloudPreview: (projects: ProjectRecord[]) => Promise<CloudSyncBundle | null>;
  prepareCloudSync: (projects: ProjectRecord[]) => Promise<CloudSyncResult>;
  refreshFromCloud: (projects: ProjectRecord[]) => Promise<ProjectRecord[]>;
  openBackupDialog: () => void;
};

type CreateSyncServiceOptions = {
  repository: ProjectRepository;
  cloudSyncClient: CloudSyncClient;
  backupInputRef: RefObject<HTMLInputElement | null>;
};

export function createSyncService(options: CreateSyncServiceOptions): SyncService {
  const { repository, cloudSyncClient, backupInputRef } = options;

  return {
    exportBackup: async (projects) => {
      const payload = await repository.exportBackup(projects);
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const fileName = `openclaw-skill-builder-backup-${new Date().toISOString().slice(0, 10)}.json`;

      return { blob, fileName };
    },
    importBackup: async (event) => {
      const file = event.target.files?.[0];

      if (!file) {
        return [];
      }

      const content = await file.text();
      const importedProjects = await repository.importBackup(content);
      event.target.value = "";

      return importedProjects;
    },
    buildCloudPreview: async (projects) => repository.buildCloudBundle(projects),
    prepareCloudSync: async (projects) => cloudSyncClient.pushBundle(projects),
    refreshFromCloud: async (projects) => cloudSyncClient.pullAndMerge(projects),
    openBackupDialog: () => backupInputRef.current?.click(),
  };
}
