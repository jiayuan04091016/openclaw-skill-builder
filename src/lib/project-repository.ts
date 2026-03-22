import { loadRepositoryStatus, buildBackupPayload, loadProjectsFromStorage, parseBackupPayload, saveProjectsToStorage } from "@/lib/project-store";
import { getRuntimeCapabilities } from "@/lib/runtime-capabilities";
import type { BackupPayload, ProjectRecord, RepositoryCapabilities, RepositoryStatus } from "@/types/app";

export type ProjectRepository = {
  loadProjects: () => Promise<ProjectRecord[]>;
  saveProjects: (projects: ProjectRecord[]) => Promise<void>;
  exportBackup: (projects: ProjectRecord[]) => Promise<BackupPayload>;
  importBackup: (content: string) => Promise<ProjectRecord[]>;
  getCapabilities: () => RepositoryCapabilities;
  getStatus: (projects: ProjectRecord[]) => RepositoryStatus;
};

export function createBrowserProjectRepository(storage: Storage): ProjectRepository {
  return {
    loadProjects: async () => loadProjectsFromStorage(storage),
    saveProjects: async (projects) => saveProjectsToStorage(storage, projects),
    exportBackup: async (projects) => buildBackupPayload(projects),
    importBackup: async (content) => parseBackupPayload(content),
    getCapabilities: () => getRuntimeCapabilities(),
    getStatus: (projects) => loadRepositoryStatus(storage, projects),
  };
}
