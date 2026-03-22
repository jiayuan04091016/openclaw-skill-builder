import type { CloudProjectGateway } from "@/lib/cloud-project-gateway";
import { mergeProjectsForCloudSync } from "@/lib/cloud-project-sync";
import type { ProjectRepository } from "@/lib/project-repository";
import {
  buildBackupPayload,
  loadProjectsFromStorage,
  loadRepositoryStatus,
  parseBackupPayload,
  saveProjectsToStorage,
} from "@/lib/project-store";
import { getRuntimeCapabilities } from "@/lib/runtime-capabilities";

export function createCloudProjectRepository(storage: Storage, gateway: CloudProjectGateway): ProjectRepository {
  const capabilities = getRuntimeCapabilities();

  return {
    loadProjects: async () => {
      const localProjects = loadProjectsFromStorage(storage);
      const remoteProjects = await gateway.pullProjects();
      const mergedProjects = mergeProjectsForCloudSync(localProjects, gateway.restoreProjects(remoteProjects));

      saveProjectsToStorage(storage, mergedProjects);
      return mergedProjects;
    },
    saveProjects: async (projects) => {
      saveProjectsToStorage(storage, projects);

      if (gateway.isEnabled()) {
        await gateway.pushBundle({
          version: 1,
          exportedAt: new Date().toISOString(),
          projectCount: projects.length,
          projects: projects.map((project) => gateway.serializeProject(project)),
        });
      }
    },
    exportBackup: async (projects) => buildBackupPayload(projects),
    importBackup: async (content) => parseBackupPayload(content),
    buildCloudBundle: async (projects) => ({
      version: 1,
      exportedAt: new Date().toISOString(),
      projectCount: projects.length,
      projects: projects.map((project) => gateway.serializeProject(project)),
    }),
    restoreFromCloud: async (payload) => gateway.restoreProjects(payload),
    getCapabilities: () => ({
      ...capabilities,
      storageMode: "cloud",
      cloudSyncEnabled: true,
    }),
    getStatus: (projects) => ({
      ...loadRepositoryStatus(storage, projects),
      syncState: gateway.isEnabled() ? "cloud-ready" : "local-only",
    }),
  };
}
