import { buildImportAnalysisSummary } from "@/lib/import-analysis";
import {
  isWeakParsedSkillImportSource,
  parseImportedSkill,
  type ParsedSkillImport,
} from "@/lib/skill-import";
import type { ImportAnalysisSummary } from "@/types/app";

const reviewPriority = ["输入内容", "输出内容", "主要任务", "适用对象", "名称"] as const;

export type ImportReviewSnapshot = {
  parsed: ParsedSkillImport;
  summary: ImportAnalysisSummary;
  weakFields: string[];
};

export function buildImportReviewSnapshot(importedSkillText: string): ImportReviewSnapshot | null {
  const normalizedText = importedSkillText.trim();

  if (!normalizedText) {
    return null;
  }

  const parsed = parseImportedSkill(normalizedText);
  const summary = buildImportAnalysisSummary(parsed, normalizedText);
  const weakFields = (
    [
      { label: "名称", source: parsed.sources.title },
      { label: "适用对象", source: parsed.sources.audience },
      { label: "主要任务", source: parsed.sources.mainTask },
      { label: "输入内容", source: parsed.sources.inputFormat },
      { label: "输出内容", source: parsed.sources.outputFormat },
    ] as const
  )
    .filter((item) => isWeakParsedSkillImportSource(item.source))
    .sort(
      (left, right) =>
        reviewPriority.indexOf(left.label as (typeof reviewPriority)[number]) -
        reviewPriority.indexOf(right.label as (typeof reviewPriority)[number]),
    )
    .map((item) => item.label);

  return {
    parsed,
    summary,
    weakFields,
  };
}

