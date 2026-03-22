import type { RefObject } from "react";

import { createCloudSyncClient, type CloudSyncClient } from "@/lib/cloud-sync-client";
import { createProjectRepository, type ProjectRepository } from "@/lib/project-repository";
import { createSyncService, type SyncService } from "@/lib/sync-service";
import type { ProjectRecord, RepositoryCapabilities, RepositoryStatus } from "@/types/app";

export type ProjectRuntimeBootstrapResult = {
  repository: ProjectRepository;
  syncService: SyncService;
  capabilities: RepositoryCapabilities;
  projects: ProjectRecord[];
  repositoryStatus: RepositoryStatus;
};

export type ProjectRuntimeService = {
  bootstrap: () => Promise<ProjectRuntimeBootstrapResult>;
  getStatus: (projects: ProjectRecord[]) => RepositoryStatus;
  saveProjects: (projects: ProjectRecord[]) => Promise<void>;
};

type CreateProjectRuntimeServiceOptions = {
  storage: Storage;
  backupInputRef: RefObject<HTMLInputElement | null>;
  cloudSyncClient?: CloudSyncClient;
};

export function createProjectRuntimeService(options: CreateProjectRuntimeServiceOptions): ProjectRuntimeService {
  const cloudSyncClient = options.cloudSyncClient ?? createCloudSyncClient();
  const repository = createProjectRepository(options.storage);
  const syncService = createSyncService({
    repository,
    cloudSyncClient,
    backupInputRef: options.backupInputRef,
  });

  return {
    bootstrap: async () => {
      const projects = await repository.loadProjects();

      return {
        repository,
        syncService,
        capabilities: repository.getCapabilities(),
        projects,
        repositoryStatus: repository.getStatus(projects),
      };
    },
    getStatus: (projects) => repository.getStatus(projects),
    saveProjects: (projects) => repository.saveProjects(projects),
  };
}
