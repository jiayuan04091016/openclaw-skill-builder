import { parseImportedSkill } from "@/lib/skill-import";
import type { ImportedSkillArchive } from "@/types/app";

export type SkillImportArchiveService = {
  buildArchive: (
    importedSkillText: string,
    sourceName: string,
    sourceType: ImportedSkillArchive["sourceType"],
  ) => ImportedSkillArchive;
};

export function createSkillImportArchiveService(): SkillImportArchiveService {
  return {
    buildArchive: (importedSkillText, sourceName, sourceType) => {
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
  };
}
