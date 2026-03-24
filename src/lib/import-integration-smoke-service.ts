import { createSkillImportPipelineService } from "@/lib/skill-import-pipeline-service";

export type ImportIntegrationSmokeReport = {
  parsedTitle: string;
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

export function runImportIntegrationSmoke(): ImportIntegrationSmokeReport {
  const pipeline = createSkillImportPipelineService();
  const result = pipeline.importFromText(sampleImportedSkill, "import-smoke.md");

  return {
    parsedTitle: result.review?.parsed.title ?? "",
    extractedCount: result.review?.summary.extractedCount ?? 0,
    archiveReady: Boolean(result.archive),
    readyForFirstDraft: result.review?.summary.readyForFirstDraft === true,
    ok: Boolean(result.archive && result.review && result.review.summary.extractedCount >= 4),
  };
}

