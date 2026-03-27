import JSZip from "jszip";

import { loadImportedSkillAssetFromZipData } from "@/lib/skill-import-loader";
import { createSkillImportPipelineService } from "@/lib/skill-import-pipeline-service";

export type ImportProviderContractReport = {
  parseShapeValid: boolean;
  reviewShapeValid: boolean;
  archiveShapeValid: boolean;
  jsonFormatValid: boolean;
  yamlFormatValid: boolean;
  zipFormatValid: boolean;
  formatCoverage: Array<"markdown" | "json" | "yaml" | "zip">;
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

const sampleImportedSkillJson = JSON.stringify({
  name: "JSON 导入助手",
  description: "从 JSON 结构提取 skill 字段",
  audience: "内容整理人员",
  mainTask: "解析结构化字段",
  inputFormat: "JSON 文本",
  outputFormat: "Skill 字段",
});

const sampleImportedSkillYaml = `
name: YAML 导入助手
description: 从 YAML 结构提取 skill 字段
audience: 内容整理人员
mainTask: 解析结构化字段
inputFormat: YAML 文本
outputFormat: Skill 字段
`;

async function buildSampleZipData() {
  const zip = new JSZip();
  zip.file(
    "bundle/SKILL.md",
    `---
name: ZIP 合约助手
description: 验证 ZIP 结构导入
---

## 适用对象
内容整理人员

## 主要任务
验证 ZIP 解析

## 输入内容
zip 文件

## 输出内容
Skill 字段
`,
  );
  return zip.generateAsync({ type: "uint8array" });
}

export async function buildImportProviderContractReport(): Promise<ImportProviderContractReport> {
  const pipeline = createSkillImportPipelineService();
  const result = pipeline.importFromText(sampleImportedSkill, "sample-skill.md");
  const jsonResult = pipeline.importFromText(sampleImportedSkillJson, "sample-skill.json");
  const yamlResult = pipeline.importFromText(sampleImportedSkillYaml, "sample-skill.yaml");
  const zipAsset = await loadImportedSkillAssetFromZipData("sample-skill.zip", await buildSampleZipData());
  const zipResult = pipeline.importFromText(zipAsset.importedSkillText, zipAsset.sourceName);
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
  const jsonFormatValid = Boolean(
    jsonResult.review?.parsed.title.trim() &&
      jsonResult.review?.parsed.description.trim() &&
      jsonResult.review?.parsed.inputFormat.trim() &&
      jsonResult.review?.parsed.outputFormat.trim(),
  );
  const yamlFormatValid = Boolean(
    yamlResult.review?.parsed.title.trim() &&
      yamlResult.review?.parsed.description.trim() &&
      yamlResult.review?.parsed.inputFormat.trim() &&
      yamlResult.review?.parsed.outputFormat.trim(),
  );
  const zipFormatValid = Boolean(
    zipAsset.sourceType === "zip" &&
      zipResult.review?.parsed.title.trim() &&
      zipResult.review?.parsed.description.trim() &&
      zipResult.review?.parsed.inputFormat.trim() &&
      zipResult.review?.parsed.outputFormat.trim(),
  );
  const formatCoverage: Array<"markdown" | "json" | "yaml" | "zip"> = ["markdown"];

  if (jsonFormatValid) {
    formatCoverage.push("json");
  }

  if (yamlFormatValid) {
    formatCoverage.push("yaml");
  }

  if (zipFormatValid) {
    formatCoverage.push("zip");
  }

  if (!parseShapeValid) {
    issues.push("旧 Skill 解析结果结构不符合当前业务约定。");
  }

  if (!reviewShapeValid) {
    issues.push("旧 Skill 复核摘要结构不符合当前业务约定。");
  }

  if (!archiveShapeValid) {
    issues.push("旧 Skill 导入归档结构不符合当前业务约定。");
  }

  if (!jsonFormatValid) {
    issues.push("旧 Skill JSON 结构解析未通过。");
  }

  if (!yamlFormatValid) {
    issues.push("旧 Skill YAML 结构解析未通过。");
  }

  if (!zipFormatValid) {
    issues.push("旧 Skill ZIP 结构解析未通过。");
  }

  return {
    parseShapeValid,
    reviewShapeValid,
    archiveShapeValid,
    jsonFormatValid,
    yamlFormatValid,
    zipFormatValid,
    formatCoverage,
    allValid:
      parseShapeValid &&
      reviewShapeValid &&
      archiveShapeValid &&
      jsonFormatValid &&
      yamlFormatValid &&
      zipFormatValid,
    issues,
  };
}

export function buildImportProviderContractMarkdown(report: ImportProviderContractReport) {
  const lines = [
    "# Import Provider Contract",
    "",
    `- allValid: ${report.allValid}`,
    `- parseShapeValid: ${report.parseShapeValid}`,
    `- reviewShapeValid: ${report.reviewShapeValid}`,
    `- archiveShapeValid: ${report.archiveShapeValid}`,
    `- jsonFormatValid: ${report.jsonFormatValid}`,
    `- yamlFormatValid: ${report.yamlFormatValid}`,
    `- zipFormatValid: ${report.zipFormatValid}`,
    `- formatCoverage: ${report.formatCoverage.join(", ")}`,
    "",
    "## Issues",
  ];

  if (!report.issues.length) {
    lines.push("- none");
  } else {
    for (const issue of report.issues) {
      lines.push(`- ${issue}`);
    }
  }

  return lines.join("\n");
}
