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

  return {
    extractedCount,
    totalCount: importFieldLabels.length,
    missingFields,
    sourceLength: sourceText.trim().length,
    message: missingFields.length
      ? `当前先提取到了 ${extractedCount}/${importFieldLabels.length} 项，剩下的内容可以在下一步继续补。`
      : "当前关键字段已经提取完整，下一步可以直接去补充新版细节。",
  };
}
