import { normalizeProjects } from "@/lib/project-normalizer";
import type { BackupPayload, ProjectRecord, RepositoryStatus } from "@/types/app";

export const STORAGE_KEY = "openclaw-skill-builder-projects";
export const STORAGE_META_KEY = "openclaw-skill-builder-sync-meta";

type StorageMeta = {
  lastSavedAt: string | null;
};

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
  saveStorageMeta(storage, {
    lastSavedAt: new Date().toISOString(),
  });
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

export function loadRepositoryStatus(storage: Storage, projects: ProjectRecord[]): RepositoryStatus {
  const meta = loadStorageMeta(storage);

  return {
    projectCount: projects.length,
    lastSavedAt: meta.lastSavedAt,
    syncState: "local-only",
  };
}

function loadStorageMeta(storage: Storage): StorageMeta {
  const raw = storage.getItem(STORAGE_META_KEY);

  if (!raw) {
    return { lastSavedAt: null };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StorageMeta>;

    return {
      lastSavedAt: typeof parsed.lastSavedAt === "string" ? parsed.lastSavedAt : null,
    };
  } catch {
    return { lastSavedAt: null };
  }
}

function saveStorageMeta(storage: Storage, meta: StorageMeta) {
  storage.setItem(STORAGE_META_KEY, JSON.stringify(meta));
}
