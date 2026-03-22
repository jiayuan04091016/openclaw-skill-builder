import { createSkillImportPipelineService } from "@/lib/skill-import-pipeline-service";

export type ImportProviderContractReport = {
  parseShapeValid: boolean;
  reviewShapeValid: boolean;
  archiveShapeValid: boolean;
  allValid: boolean;
  issues: string[];
};

const sampleImportedSkill = `---
name: 会议纪要助手
description: 帮助整理会议内容并输出纪要
---

# 会议纪要助手

## 适用对象
办公新手

## 主要任务
整理会议纪要

## 输入内容
会议记录文本

## 输出内容
结构化纪要和待办事项

## 注意事项
不要输入敏感信息
`;

export function buildImportProviderContractReport(): ImportProviderContractReport {
  const pipeline = createSkillImportPipelineService();
  const result = pipeline.importFromText(sampleImportedSkill, "sample-skill.md");
  const issues: string[] = [];
  const parseShapeValid = Boolean(
    result.review?.parsed.title &&
      typeof result.review?.parsed.description === "string" &&
      typeof result.review?.parsed.inputFormat === "string" &&
      typeof result.review?.parsed.outputFormat === "string",
  );
  const reviewShapeValid = Boolean(
    result.review &&
      typeof result.review.summary.extractedCount === "number" &&
      Array.isArray(result.review.summary.missingFields) &&
      Array.isArray(result.review.weakFields),
  );
  const archiveShapeValid = Boolean(
    result.archive &&
      result.archive.sourceName === "sample-skill.md" &&
      typeof result.archive.extractedTitle === "string" &&
      typeof result.archive.extractedInputFormat === "string",
  );

  if (!parseShapeValid) {
    issues.push("旧 Skill 解析结果结构不符合当前业务约定。");
  }

  if (!reviewShapeValid) {
    issues.push("旧 Skill 复核摘要结构不符合当前业务约定。");
  }

  if (!archiveShapeValid) {
    issues.push("旧 Skill 导入归档结构不符合当前业务约定。");
  }

  return {
    parseShapeValid,
    reviewShapeValid,
    archiveShapeValid,
    allValid: parseShapeValid && reviewShapeValid && archiveShapeValid,
    issues,
  };
}
