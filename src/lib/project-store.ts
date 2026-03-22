import { normalizeProjects } from "@/lib/project-normalizer";
import type { BackupPayload, ProjectRecord } from "@/types/app";

export const STORAGE_KEY = "openclaw-skill-builder-projects";

export function loadProjectsFromStorage(storage: Storage): ProjectRecord[] {
  const raw = storage.getItem(STORAGE_KEY);

  if (!raw) {
    return [];
  }

  const parsed = JSON.parse(raw) as ProjectRecord[];

  if (!Array.isArray(parsed)) {
    return [];
  }

  return normalizeProjects(parsed);
}

export function saveProjectsToStorage(storage: Storage, projects: ProjectRecord[]) {
  storage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function buildBackupPayload(projects: ProjectRecord[]): BackupPayload {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    projects,
  };
}

export function parseBackupPayload(content: string): ProjectRecord[] {
  const parsed = JSON.parse(content) as BackupPayload | ProjectRecord[];

  if (Array.isArray(parsed)) {
    return normalizeProjects(parsed);
  }

  if (parsed && parsed.version === 1 && Array.isArray(parsed.projects)) {
    return normalizeProjects(parsed.projects);
  }

  throw new Error("备份文件格式不正确。");
}
