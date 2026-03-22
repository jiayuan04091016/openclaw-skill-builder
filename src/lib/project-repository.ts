import { buildBackupPayload, loadProjectsFromStorage, parseBackupPayload, saveProjectsToStorage } from "@/lib/project-store";
import type { BackupPayload, ProjectRecord } from "@/types/app";

export type ProjectRepository = {
  loadProjects: () => Promise<ProjectRecord[]>;
  saveProjects: (projects: ProjectRecord[]) => Promise<void>;
  exportBackup: (projects: ProjectRecord[]) => Promise<BackupPayload>;
  importBackup: (content: string) => Promise<ProjectRecord[]>;
};

export function createBrowserProjectRepository(storage: Storage): ProjectRepository {
  return {
    loadProjects: async () => loadProjectsFromStorage(storage),
    saveProjects: async (projects) => saveProjectsToStorage(storage, projects),
    exportBackup: async (projects) => buildBackupPayload(projects),
    importBackup: async (content) => parseBackupPayload(content),
  };
}
