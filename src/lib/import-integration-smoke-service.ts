import { createSkillImportPipelineService } from "@/lib/skill-import-pipeline-service";

export type ImportIntegrationSmokeReport = {
  parsedTitle: string;
  parsedTitleFromJson: string;
  extractedCount: number;
  archiveReady: boolean;
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

export function runImportIntegrationSmoke(): ImportIntegrationSmokeReport {
  const pipeline = createSkillImportPipelineService();
  const result = pipeline.importFromText(sampleImportedSkill, "import-smoke.md");
  const resultFromJson = pipeline.importFromText(sampleImportedSkillJson, "import-smoke.json");

  return {
    parsedTitle: result.review?.parsed.title ?? "",
    parsedTitleFromJson: resultFromJson.review?.parsed.title ?? "",
    extractedCount: result.review?.summary.extractedCount ?? 0,
    archiveReady: Boolean(result.archive),
    readyForFirstDraft: result.review?.summary.readyForFirstDraft === true,
    ok: Boolean(
      result.archive &&
        result.review &&
        result.review.summary.extractedCount >= 4 &&
        resultFromJson.review?.parsed.title.trim(),
    ),
  };
}
