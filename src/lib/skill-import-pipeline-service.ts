import { buildImportReviewSnapshot, type ImportReviewSnapshot } from "@/lib/import-review-service";
import { loadImportedSkillAsset, type ImportedSkillAsset } from "@/lib/skill-import-loader";
import { createProjectService } from "@/lib/project-service";
import type { ImportedSkillArchive } from "@/types/app";

export type SkillImportPipelineResult = {
  asset: ImportedSkillAsset;
  archive: ImportedSkillArchive | null;
  review: ImportReviewSnapshot | null;
};

export type SkillImportPipelineService = {
  importFromFile: (file: File) => Promise<SkillImportPipelineResult>;
  importFromText: (text: string, sourceName?: string) => SkillImportPipelineResult;
};

export function createSkillImportPipelineService(): SkillImportPipelineService {
  const projectService = createProjectService();

  return {
    importFromFile: async (file) => {
      const asset = await loadImportedSkillAsset(file);
      const review = buildImportReviewSnapshot(asset.importedSkillText);
      const archive = asset.importedSkillText
        ? projectService.buildImportedSkillArchive(asset.importedSkillText, asset.sourceName, asset.sourceType)
        : null;

      return {
        asset,
        archive,
        review,
      };
    },
    importFromText: (text, sourceName = "手动粘贴的旧 Skill") => {
      const importedSkillText = text.trim();
      const review = buildImportReviewSnapshot(importedSkillText);
      const archive = importedSkillText
        ? projectService.buildImportedSkillArchive(importedSkillText, sourceName, "manual")
        : null;

      return {
        asset: {
          sourceType: "manual",
          sourceName,
          importedSkillText,
        },
        archive,
        review,
      };
    },
  };
}
