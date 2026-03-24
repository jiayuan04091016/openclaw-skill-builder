import type { CloudProjectRecord, CloudSyncBundle } from "@/types/app";

const mockCloudProjectStore = new Map<string, CloudProjectRecord[]>();

function normalizeToken(token: string | undefined) {
  return (token?.trim() || "guest").slice(0, 128);
}

function cloneProjects(projects: CloudProjectRecord[]) {
  return projects.map((project) => ({
    ...project,
    resources: project.resources.map((resource) => ({ ...resource })),
    draft: project.draft ? { ...project.draft } : null,
    importedSkillArchive: project.importedSkillArchive ? { ...project.importedSkillArchive } : null,
  }));
}

export function readMockCloudProjects(sessionToken?: string) {
  const key = normalizeToken(sessionToken);
  return cloneProjects(mockCloudProjectStore.get(key) ?? []);
}

export function saveMockCloudBundle(bundle: CloudSyncBundle, sessionToken?: string) {
  const key = normalizeToken(sessionToken);
  const projects = bundle.projects.slice(0, 300);
  mockCloudProjectStore.set(key, cloneProjects(projects));

  return {
    ok: true,
    projectCount: projects.length,
    message: `本地 mock 云端已保存 ${projects.length} 个项目（token: ${key}）。`,
  };
}

