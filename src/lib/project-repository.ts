import { buildCloudSyncBundle, restoreProjectsFromCloud } from "@/lib/cloud-project-sync";
import { loadRepositoryStatus, buildBackupPayload, loadProjectsFromStorage, parseBackupPayload, saveProjectsToStorage } from "@/lib/project-store";
import { getRuntimeCapabilities } from "@/lib/runtime-capabilities";
import type { BackupPayload, CloudProjectRecord, CloudSyncBundle, ProjectRecord, RepositoryCapabilities, RepositoryStatus } from "@/types/app";

export type ProjectRepository = {
  loadProjects: () => Promise<ProjectRecord[]>;
  saveProjects: (projects: ProjectRecord[]) => Promise<void>;
  exportBackup: (projects: ProjectRecord[]) => Promise<BackupPayload>;
  importBackup: (content: string) => Promise<ProjectRecord[]>;
  buildCloudBundle: (projects: ProjectRecord[]) => Promise<CloudSyncBundle>;
  restoreFromCloud: (payload: CloudSyncBundle | CloudProjectRecord[]) => Promise<ProjectRecord[]>;
  getCapabilities: () => RepositoryCapabilities;
  getStatus: (projects: ProjectRecord[]) => RepositoryStatus;
};

export function createBrowserProjectRepository(storage: Storage): ProjectRepository {
  const capabilities = getRuntimeCapabilities();

  return {
    loadProjects: async () => loadProjectsFromStorage(storage),
    saveProjects: async (projects) => saveProjectsToStorage(storage, projects),
    exportBackup: async (projects) => buildBackupPayload(projects),
    importBackup: async (content) => parseBackupPayload(content),
    buildCloudBundle: async (projects) => buildCloudSyncBundle(projects),
    restoreFromCloud: async (payload) => restoreProjectsFromCloud(payload),
    getCapabilities: () => capabilities,
    getStatus: (projects) => ({
      ...loadRepositoryStatus(storage, projects),
      syncState: capabilities.cloudSyncEnabled ? "cloud-ready" : "local-only",
    }),
  };
}

export function createProjectRepository(storage: Storage): ProjectRepository {
  return createBrowserProjectRepository(storage);
}
