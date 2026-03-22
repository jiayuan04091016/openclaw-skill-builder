import { createProjectImportPipelineService } from "@/lib/project-import-pipeline-service";
import { buildBackupPayload, parseBackupPayload } from "@/lib/project-store";
import { createProjectService } from "@/lib/project-service";

export type V1RegressionTestKey =
  | "create-project"
  | "import-skill"
  | "generate-draft"
  | "preview"
  | "export-zip"
  | "backup-export"
  | "backup-restore";

export type V1RegressionTestItem = {
  key: V1RegressionTestKey;
  ok: boolean;
  summary: string;
};

export type V1RegressionTestReport = {
  allPassed: boolean;
  items: V1RegressionTestItem[];
};

export async function runV1RegressionTests(): Promise<V1RegressionTestReport> {
  const projectService = createProjectService();
  const projectImportPipelineService = createProjectImportPipelineService();

  const createdProject = projectService.createProject("create", "帮我整理会议纪要并输出待办事项");
  const createProjectOk = createdProject.mode === "create" && Boolean(createdProject.goal);

  const importedProjectBase = projectService.createProject("import", "在旧 Skill 基础上继续改");
  const imported = projectImportPipelineService.importFromText(
    importedProjectBase,
    `---
name: 客服回复助手
description: 帮助整理客户问题并生成回复
---

# 客服回复助手

## 适用对象
客服人员

## 主要任务
整理客户问题并生成回复

## 输入内容
客户问题文本

## 输出内容
礼貌、简洁的回复建议
`,
    "回归测试旧 Skill",
  );
  const importedProject = projectService.patchProject(importedProjectBase, imported.projectPatch);
  const importSkillOk = Boolean(importedProject.importedSkillArchive) && Boolean(importedProject.mainTask);

  const projectForDraft = projectService.patchProject(createdProject, {
    mainTask: "整理会议纪要",
    inputFormat: "会议记录文本",
    outputFormat: "结构化纪要和待办事项",
  });
  const draft = projectService.buildDraft(projectForDraft);
  const generateDraftOk = Boolean(draft.previewText) && Boolean(draft.skillMarkdown);
  const previewOk = Boolean(draft.previewText) && Boolean(draft.exampleOutput);

  const exportProject = projectService.patchProject(projectForDraft, {
    title: "会议纪要助手",
    draft,
  });
  const exported = await projectService.exportProject(exportProject);
  const exportZipOk = Boolean(exported.fileName) && exported.blob.size > 0;

  const backupPayload = buildBackupPayload([exportProject, importedProject]);
  const backupText = JSON.stringify(backupPayload);
  const backupExportOk = backupText.includes("\"version\":1") && backupPayload.projects.length === 2;

  const restoredProjects = parseBackupPayload(backupText);
  const backupRestoreOk = restoredProjects.length === 2 && Boolean(restoredProjects[0]?.id);

  const items: V1RegressionTestItem[] = [
    {
      key: "create-project",
      ok: createProjectOk,
      summary: createProjectOk ? "从零创建项目主链路可调用。" : "从零创建项目失败。",
    },
    {
      key: "import-skill",
      ok: importSkillOk,
      summary: importSkillOk ? "导入旧 Skill 主链路可生成字段和归档。" : "导入旧 Skill 失败。",
    },
    {
      key: "generate-draft",
      ok: generateDraftOk,
      summary: generateDraftOk ? "草稿生成主链路可调用。" : "草稿生成失败。",
    },
    {
      key: "preview",
      ok: previewOk,
      summary: previewOk ? "预览内容主链路可生成说明版和示例。" : "预览内容不完整。",
    },
    {
      key: "export-zip",
      ok: exportZipOk,
      summary: exportZipOk ? "导出 ZIP 主链路可调用。" : "导出 ZIP 失败。",
    },
    {
      key: "backup-export",
      ok: backupExportOk,
      summary: backupExportOk ? "备份导出主链路可调用。" : "备份导出失败。",
    },
    {
      key: "backup-restore",
      ok: backupRestoreOk,
      summary: backupRestoreOk ? "备份恢复主链路可调用。" : "备份恢复失败。",
    },
  ];

  return {
    allPassed: items.every((item) => item.ok),
    items,
  };
}
