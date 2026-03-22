import { loadSessionProfile } from "@/lib/session-bootstrap-service";
import { createProjectRepository, type ProjectRepository } from "@/lib/project-repository";
import { createBrowserSessionRepository } from "@/lib/session-repository";
import type { RepositoryCapabilities, SessionProfile } from "@/types/app";

export type RuntimeBootstrapResult = {
  repository: ProjectRepository;
  capabilities: RepositoryCapabilities;
  sessionProfile: SessionProfile;
};

export type RuntimeBootstrapService = {
  bootstrap: () => Promise<RuntimeBootstrapResult>;
};

export function createRuntimeBootstrapService(storage: Storage): RuntimeBootstrapService {
  return {
    bootstrap: async () => {
      const repository = createProjectRepository(storage);
      const sessionRepository = createBrowserSessionRepository();
      const session = await loadSessionProfile(sessionRepository);

      return {
        repository,
        capabilities: repository.getCapabilities(),
        sessionProfile: session.sessionProfile,
      };
    },
  };
}
