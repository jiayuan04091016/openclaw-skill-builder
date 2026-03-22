import { createProjectService } from "@/lib/project-service";
import { createSkillImportPipelineService, type SkillImportPipelineResult } from "@/lib/skill-import-pipeline-service";
import type { ProjectRecord, ResourceType } from "@/types/app";

export type ProjectImportPipelineResult = SkillImportPipelineResult & {
  resourceType: ResourceType;
  projectPatch: Partial<ProjectRecord>;
};

export type ProjectImportPipelineService = {
  importFromFile: (project: ProjectRecord, file: File) => Promise<ProjectImportPipelineResult>;
  importFromText: (project: ProjectRecord, text: string, sourceName?: string) => ProjectImportPipelineResult;
};

export function createProjectImportPipelineService(): ProjectImportPipelineService {
  const projectService = createProjectService();
  const skillImportPipelineService = createSkillImportPipelineService();

  function buildProjectPatch(project: ProjectRecord, importedSkillText: string, sourceName: string, sourceType: "text" | "markdown" | "zip" | "manual") {
    return {
      ...projectService.applyImportedSkillPatch(project, importedSkillText),
      importedSkillArchive: importedSkillText
        ? projectService.buildImportedSkillArchive(importedSkillText, sourceName, sourceType)
        : project.importedSkillArchive,
    };
  }

  return {
    importFromFile: async (project, file) => {
      const imported = await skillImportPipelineService.importFromFile(file);

      return {
        ...imported,
        resourceType: "skill",
        projectPatch: buildProjectPatch(project, imported.asset.importedSkillText, imported.asset.sourceName, imported.asset.sourceType),
      };
    },
    importFromText: (project, text, sourceName = "手动粘贴的旧 Skill") => {
      const imported = skillImportPipelineService.importFromText(text, sourceName);

      return {
        ...imported,
        resourceType: "skill",
        projectPatch: buildProjectPatch(project, imported.asset.importedSkillText, imported.asset.sourceName, imported.asset.sourceType),
      };
    },
  };
}
