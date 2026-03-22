import { createProjectService } from "@/lib/project-service";
import type { ProjectRecord, ResourceItem } from "@/types/app";

export type ProjectMediaProcessingSummary = {
  processedCount: number;
  skippedCount: number;
  messages: string[];
};

export type ProjectMediaProcessingResult = {
  projectPatch: Partial<ProjectRecord>;
  summary: ProjectMediaProcessingSummary;
};

export type ProjectMediaProcessingService = {
  getProcessableResources: (project: ProjectRecord) => ResourceItem[];
  processProjectResources: (project: ProjectRecord, resourceIds?: string[]) => Promise<ProjectMediaProcessingResult>;
};

export function createProjectMediaProcessingService(): ProjectMediaProcessingService {
  const projectService = createProjectService();

  return {
    getProcessableResources: (project) =>
      project.resources.filter((resource) => resource.type === "image" || resource.type === "video"),
    processProjectResources: async (project, resourceIds) => {
      const targetIds = new Set(resourceIds ?? project.resources.map((resource) => resource.id));
      let nextProject = project;
      let processedCount = 0;
      let skippedCount = 0;
      const messages: string[] = [];

      for (const resource of project.resources) {
        if (!targetIds.has(resource.id)) {
          continue;
        }

        if (resource.type !== "image" && resource.type !== "video") {
          skippedCount += 1;
          continue;
        }

        const processingResult = await projectService.processResource(resource);
        nextProject = projectService.patchProject(
          nextProject,
          projectService.applyResourceProcessingResult(nextProject, resource.id, processingResult),
        );
        processedCount += 1;
        messages.push(processingResult.result.message);
      }

      return {
        projectPatch: {
          resources: nextProject.resources,
        },
        summary: {
          processedCount,
          skippedCount,
          messages,
        },
      };
    },
  };
}
