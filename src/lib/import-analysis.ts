import type { ParsedSkillImport } from "@/lib/skill-import";
import type { ImportAnalysisSummary } from "@/types/app";

const importFieldLabels = [
  { key: "title", label: "名称" },
  { key: "audience", label: "适用对象" },
  { key: "mainTask", label: "主要任务" },
  { key: "inputFormat", label: "输入内容" },
  { key: "outputFormat", label: "输出内容" },
] as const;

export function buildImportAnalysisSummary(parsed: ParsedSkillImport, sourceText: string): ImportAnalysisSummary {
  const missingFields = importFieldLabels
    .filter((field) => !parsed[field.key].trim())
    .map((field) => field.label);
  const extractedCount = importFieldLabels.length - missingFields.length;
  const sourceLength = sourceText.trim().length;
  const coveredSections = [
    parsed.description.trim() ? "用途/说明" : "",
    parsed.audience.trim() ? "适用对象" : "",
    parsed.mainTask.trim() ? "主要任务" : "",
    parsed.inputFormat.trim() ? "输入内容" : "",
    parsed.outputFormat.trim() ? "输出内容" : "",
  ].filter(Boolean);
  const qualityLevel =
    extractedCount >= 5 && sourceLength >= 120 ? "high" : extractedCount >= 3 && sourceLength >= 60 ? "medium" : "low";

  return {
    extractedCount,
    totalCount: importFieldLabels.length,
    missingFields,
    sourceLength,
    qualityLevel,
    coveredSections,
    message:
      qualityLevel === "high"
        ? "当前提取结果已经比较完整，通常足够直接生成第一版。"
        : qualityLevel === "medium"
          ? `当前先提取到了 ${extractedCount}/${importFieldLabels.length} 项，已经够先生成第一版，剩下的内容可以下一步再补。`
          : `当前先提取到了 ${extractedCount}/${importFieldLabels.length} 项，建议再补一点旧 Skill 的用途、输入或输出说明，会更稳。`,
  };
}
