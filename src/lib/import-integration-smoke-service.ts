import JSZip from "jszip";

import { createSkillImportPipelineService } from "@/lib/skill-import-pipeline-service";
import { loadImportedSkillAssetFromZipData } from "@/lib/skill-import-loader";

export type ImportIntegrationSmokeReport = {
  parsedTitle: string;
  parsedTitleFromJson: string;
  parsedTitleFromYaml: string;
  parsedTitleFromZip: string;
  extractedCount: number;
  archiveReady: boolean;
  zipArchiveReady: boolean;
  readyForFirstDraft: boolean;
  ok: boolean;
};

const sampleImportedSkill = `---
name: 客服回复助手
description: 根据客户问题生成礼貌回复
---

# 客服回复助手

## 适用对象
客服人员

## 主要任务
生成客服回复

## 输入内容
客户提问文本

## 输出内容
礼貌、稳定的回复建议
`;

const sampleImportedSkillJson = JSON.stringify({
  name: "会议纪要结构化助手",
  description: "把会议记录整理成行动项和负责人清单",
  audience: "项目经理",
  mainTask: "提炼决策、待办和风险",
  inputFormat: "会议录音转写文本",
  outputFormat: "行动项列表 + 负责人 + 截止时间",
});

const sampleImportedSkillYaml = `
name: 巡检报告助手
description: 把巡检记录整理成问题清单和优先级
audience: 运维人员
mainTask: 提炼异常与整改任务
inputFormat: 巡检原始记录文本
outputFormat: 问题清单 + 优先级 + 建议动作
`;

async function buildSampleSkillZipData() {
  const zip = new JSZip();
  zip.file(
    "sample-skill/SKILL.md",
    `---
name: ZIP 导入助手
description: 从 ZIP 包中提取 Skill 核心字段
---

# ZIP 导入助手

## 适用对象
电脑新手

## 主要任务
导入已有 Skill 并补全核心结构

## 输入内容
旧 Skill 的压缩包

## 输出内容
解析后的结构化字段
`,
  );
  zip.file("sample-skill/README.txt", "this is a plain readme");
  return zip.generateAsync({ type: "uint8array" });
}

export async function runImportIntegrationSmoke(): Promise<ImportIntegrationSmokeReport> {
  const pipeline = createSkillImportPipelineService();
  const result = pipeline.importFromText(sampleImportedSkill, "import-smoke.md");
  const resultFromJson = pipeline.importFromText(sampleImportedSkillJson, "import-smoke.json");
  const resultFromYaml = pipeline.importFromText(sampleImportedSkillYaml, "import-smoke.yaml");
  const zipAsset = await loadImportedSkillAssetFromZipData("import-smoke.zip", await buildSampleSkillZipData());
  const zipResult = pipeline.importFromText(zipAsset.importedSkillText, zipAsset.sourceName);
  const zipArchiveReady = Boolean(zipResult.archive && zipAsset.sourceType === "zip");

  return {
    parsedTitle: result.review?.parsed.title ?? "",
    parsedTitleFromJson: resultFromJson.review?.parsed.title ?? "",
    parsedTitleFromYaml: resultFromYaml.review?.parsed.title ?? "",
    parsedTitleFromZip: zipResult.review?.parsed.title ?? "",
    extractedCount: result.review?.summary.extractedCount ?? 0,
    archiveReady: Boolean(result.archive),
    zipArchiveReady,
    readyForFirstDraft: result.review?.summary.readyForFirstDraft === true,
    ok: Boolean(
        result.archive &&
        result.review &&
        result.review.summary.extractedCount >= 4 &&
        resultFromJson.review?.parsed.title.trim() &&
        resultFromYaml.review?.parsed.title.trim() &&
        zipResult.review?.parsed.title.trim() &&
        zipArchiveReady,
    ),
  };
}
