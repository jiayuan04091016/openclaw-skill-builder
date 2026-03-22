import { createMediaProcessingService } from "@/lib/media-processing-service";
import { parseImportedSkill } from "@/lib/skill-import";
import { createResourceEnhancementService } from "@/lib/resource-enhancement-service";
import {
  createEmptyProject,
  duplicateProjectRecord,
  patchProject,
  removeProjectRecord,
  upsertProjectRecord,
} from "@/lib/project-operations";
import { buildDraftContent, buildStructuredSpec, createId, exportProjectZip } from "@/lib/skill-builder";
import type {
  BuilderMode,
  DraftContent,
  ImportedSkillArchive,
  OcrResult,
  ProjectRecord,
  ResourceProcessingResult,
  ResourceItem,
  ResourceType,
  VideoEnhancementResult,
} from "@/types/app";

export type ProjectService = {
  createProject: (mode: BuilderMode, goal?: string) => ProjectRecord;
  patchProject: (project: ProjectRecord, patch: Partial<ProjectRecord>) => ProjectRecord;
  upsertProject: (projects: ProjectRecord[], project: ProjectRecord) => ProjectRecord[];
  removeProject: (projects: ProjectRecord[], projectId: string) => ProjectRecord[];
  duplicateProject: (project: ProjectRecord) => ProjectRecord;
  createResource: (type: ResourceType, name: string, content: string) => ResourceItem;
  applyImportedSkillPatch: (project: ProjectRecord, importedSkillText: string) => Partial<ProjectRecord>;
  buildImportedSkillArchive: (
    importedSkillText: string,
    sourceName: string,
    sourceType: ImportedSkillArchive["sourceType"],
  ) => ImportedSkillArchive;
  applyResourceProcessingResult: (
    project: ProjectRecord,
    resourceId: string,
    processingResult: ResourceProcessingResult,
  ) => Partial<ProjectRecord>;
  processResource: (resource: ResourceItem) => Promise<ResourceProcessingResult>;
  runOcrForResource: (resource: ResourceItem) => Promise<OcrResult>;
  enhanceVideoResource: (resource: ResourceItem) => Promise<VideoEnhancementResult>;
  buildDraft: (project: ProjectRecord) => DraftContent;
  exportProject: (project: ProjectRecord) => Promise<{ blob: Blob; fileName: string }>;
};

export function createProjectService(): ProjectService {
  const mediaProcessingService = createMediaProcessingService();
  const resourceEnhancementService = createResourceEnhancementService();

  return {
    createProject: (mode, goal = "") => createEmptyProject(mode, goal),
    patchProject: (project, patch) => patchProject(project, patch),
    upsertProject: (projects, project) => upsertProjectRecord(projects, project),
    removeProject: (projects, projectId) => removeProjectRecord(projects, projectId),
    duplicateProject: (project) => duplicateProjectRecord(project),
    createResource: (type, name, content) => ({
      id: createId("res"),
      type,
      name,
      content,
      processingSummary: "",
      processingUpdatedAt: null,
      createdAt: new Date().toISOString(),
    }),
    applyImportedSkillPatch: (project, importedSkillText) => {
      const parsed = parseImportedSkill(importedSkillText);

      return {
        importedSkillText,
        title: project.title || parsed.title,
        description: project.description || parsed.description,
        audience: project.audience || parsed.audience,
        mainTask: project.mainTask || parsed.mainTask,
        inputFormat: project.inputFormat || parsed.inputFormat,
        outputFormat: project.outputFormat || parsed.outputFormat,
        warnings: project.warnings || parsed.warnings,
      };
    },
    buildImportedSkillArchive: (importedSkillText, sourceName, sourceType) => {
      const parsed = parseImportedSkill(importedSkillText);

      return {
        sourceName,
        sourceType,
        importedAt: new Date().toISOString(),
        extractedTitle: parsed.title,
        extractedAudience: parsed.audience,
        extractedMainTask: parsed.mainTask,
        extractedInputFormat: parsed.inputFormat,
        extractedOutputFormat: parsed.outputFormat,
      };
    },
    applyResourceProcessingResult: (project, resourceId, processingResult) => ({
      resources: project.resources.map((resource) =>
        resource.id === resourceId
          ? {
              ...resource,
              processingSummary:
                processingResult.kind === "ocr"
                  ? processingResult.result.text
                  : processingResult.kind === "video"
                    ? processingResult.result.summary
                    : processingResult.result.message,
              processingUpdatedAt: new Date().toISOString(),
            }
          : resource,
      ),
    }),
    processResource: (resource) => mediaProcessingService.processResource(resource),
    runOcrForResource: (resource) => resourceEnhancementService.runOcr(resource),
    enhanceVideoResource: (resource) => resourceEnhancementService.enhanceVideo(resource),
    buildDraft: (project) => {
      const spec = buildStructuredSpec(project);
      return buildDraftContent(spec, project.includeExamples);
    },
    exportProject: (project) => exportProjectZip(project),
  };
}
