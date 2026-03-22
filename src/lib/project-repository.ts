import { buildBackupPayload, loadProjectsFromStorage, parseBackupPayload, saveProjectsToStorage } from "@/lib/project-store";
import type { BackupPayload, ProjectRecord } from "@/types/app";

export type ProjectRepository = {
  loadProjects: () => ProjectRecord[];
  saveProjects: (projects: ProjectRecord[]) => void;
  exportBackup: (projects: ProjectRecord[]) => BackupPayload;
  importBackup: (content: string) => ProjectRecord[];
};

export function createBrowserProjectRepository(storage: Storage): ProjectRepository {
  return {
    loadProjects: () => loadProjectsFromStorage(storage),
    saveProjects: (projects) => saveProjectsToStorage(storage, projects),
    exportBackup: (projects) => buildBackupPayload(projects),
    importBackup: (content) => parseBackupPayload(content),
  };
}
