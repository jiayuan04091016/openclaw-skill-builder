import { createProjectImportPipelineService } from "@/lib/project-import-pipeline-service";
import { createProjectMediaProcessingService } from "@/lib/project-media-processing-service";
import { createProjectResourceProcessingService } from "@/lib/project-resource-processing-service";
import { createProjectService } from "@/lib/project-service";
import { loadImportedSkillText } from "@/lib/skill-import-loader";
import type { ProjectRecord, ResourceItem, ResourceType } from "@/types/app";

export type ProjectResourceInputResult = {
  resource: ResourceItem;
  projectPatch: Partial<ProjectRecord>;
  statusMessage: string;
};

export type ProjectImportedSkillTextResult = {
  projectPatch: Partial<ProjectRecord>;
  statusMessage: string;
};

export type ProjectResourceInputService = {
  readFileContent: (file: File) => Promise<string>;
  addFileResource: (project: ProjectRecord, file: File, type: ResourceType) => Promise<ProjectResourceInputResult>;
  addManualResource: (project: ProjectRecord, type: ResourceType, name: string, content: string) => ProjectResourceInputResult;
  applyImportedSkillText: (project: ProjectRecord) => ProjectImportedSkillTextResult | null;
  processProjectResource: (project: ProjectRecord, resourceId: string) => ReturnType<ReturnType<typeof createProjectResourceProcessingService>["processProjectResource"]>;
  processProjectMediaResources: (project: ProjectRecord, resourceIds?: string[]) => ReturnType<
    ReturnType<typeof createProjectMediaProcessingService>["processProjectResources"]
  >;
};

export function createProjectResourceInputService(): ProjectResourceInputService {
  const projectService = createProjectService();
  const projectImportPipelineService = createProjectImportPipelineService();
  const projectMediaProcessingService = createProjectMediaProcessingService();
  const projectResourceProcessingService = createProjectResourceProcessingService();

  async function readFileContent(file: File) {
    if (
      file.type.startsWith("text/") ||
      file.name.endsWith(".md") ||
      file.name.endsWith(".txt") ||
      file.name.toLowerCase().endsWith(".zip")
    ) {
      return loadImportedSkillText(file);
    }

    return "";
  }

  return {
    readFileContent,
    addFileResource: async (project, file, type) => {
      if (type === "skill") {
        const imported = await projectImportPipelineService.importFromFile(project, file);
        const resource = projectService.createResource(
          imported.resourceType,
          imported.asset.sourceName,
          imported.asset.importedSkillText || `${file.name} 已上传，可作为补充资料使用。`,
        );

        return {
          resource,
          projectPatch: {
            resources: [...project.resources, resource],
            ...imported.projectPatch,
          },
          statusMessage: `已导入旧 Skill：${file.name}`,
        };
      }

      const content = await readFileContent(file);
      const resource = projectService.createResource(type, file.name, content || `${file.name} 已上传，可作为补充资料使用。`);

      return {
        resource,
        projectPatch: {
          resources: [...project.resources, resource],
        },
        statusMessage: `已添加资料：${file.name}`,
      };
    },
    addManualResource: (project, type, name, content) => {
      const resource = projectService.createResource(type, name, content);

      return {
        resource,
        projectPatch: {
          resources: [...project.resources, resource],
        },
        statusMessage: `已添加：${name}`,
      };
    },
    applyImportedSkillText: (project) => {
      if (!project.importedSkillText.trim()) {
        return null;
      }

      const imported = projectImportPipelineService.importFromText(
        project,
        project.importedSkillText,
        project.title || "手动粘贴的旧 Skill",
      );

      return {
        projectPatch: imported.projectPatch,
        statusMessage: "已从已有 Skill 内容中提取主要信息。",
      };
    },
    processProjectResource: (project, resourceId) => projectResourceProcessingService.processProjectResource(project, resourceId),
    processProjectMediaResources: (project, resourceIds) => projectMediaProcessingService.processProjectResources(project, resourceIds),
  };
}
