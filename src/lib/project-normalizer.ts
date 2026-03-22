import { createId } from "@/lib/skill-builder";
import type { ProjectRecord } from "@/types/app";

function nowIso() {
  return new Date().toISOString();
}

export function normalizeProjects(records: ProjectRecord[]): ProjectRecord[] {
  return records.map((record) => {
    const createdAt = record.createdAt || nowIso();
    const updatedAt = record.updatedAt || createdAt;

    return {
      id: record.id || createId(),
      mode: record.mode === "import" ? "import" : "create",
      title: record.title || "",
      goal: record.goal || "",
      description: record.description || "",
      audience: record.audience || "",
      mainTask: record.mainTask || "",
      inputFormat: record.inputFormat || "",
      outputFormat: record.outputFormat || "",
      outputStyle:
        record.outputStyle === "detailed" || record.outputStyle === "teaching"
          ? record.outputStyle
          : "simple",
      language: record.language || "zh-CN",
      warnings: record.warnings || "",
      includeExamples: record.includeExamples ?? true,
      resources: Array.isArray(record.resources)
        ? record.resources.map((resource) => ({
            id: resource.id || createId("res"),
            type:
              resource.type === "image" || resource.type === "video" || resource.type === "skill"
                ? resource.type
                : "text",
            name: resource.name || "",
            content: resource.content || "",
            processingSummary: resource.processingSummary || "",
            processingUpdatedAt: resource.processingUpdatedAt || null,
            createdAt: resource.createdAt || createdAt,
          }))
        : [],
      importedSkillText: record.importedSkillText || "",
      importedSkillArchive: record.importedSkillArchive || null,
      draft: record.draft || null,
      createdAt,
      updatedAt,
    };
  });
}
