import { createProjectService } from "@/lib/project-service";
import type { ProjectRecord, ResourceProcessingResult } from "@/types/app";

export type ProjectResourceProcessingResult = {
  processingResult: ResourceProcessingResult;
  projectPatch: Partial<ProjectRecord>;
};

export type ProjectResourceProcessingService = {
  processProjectResource: (project: ProjectRecord, resourceId: string) => Promise<ProjectResourceProcessingResult | null>;
};

export function createProjectResourceProcessingService(): ProjectResourceProcessingService {
  const projectService = createProjectService();

  return {
    processProjectResource: async (project, resourceId) => {
      const resource = project.resources.find((item) => item.id === resourceId);

      if (!resource) {
        return null;
      }

      const processingResult = await projectService.processResource(resource);

      return {
        processingResult,
        projectPatch: projectService.applyResourceProcessingResult(project, resourceId, processingResult),
      };
    },
  };
}
