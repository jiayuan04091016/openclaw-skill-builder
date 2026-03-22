import JSZip from "jszip";

import type { DraftContent, OutputStyle, ProjectRecord, ResourceItem, StructuredSpec } from "@/types/app";

const stopWords = ["一个", "帮我", "帮助", "可以", "能够", "用于", "想做", "希望", "让我", "把"];

export function createId(prefix = "proj") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function cleanGoal(goal: string) {
  let next = goal.trim();

  stopWords.forEach((word) => {
    next = next.replaceAll(word, "");
  });

  next = next.replace(/[，。！？,.!?]/g, " ");
  next = next.replace(/\s+/g, " ").trim();

  if (!next) {
    return "通用任务助手";
  }

  return next.length > 16 ? `${next.slice(0, 16)}助手` : `${next}助手`;
}

function buildWarnings(goal: string, importedSkillText: string) {
  const notices = ["请勿输入敏感信息或未授权内容。"];

  if (importedSkillText.trim()) {
    notices.push("你导入了已有 Skill，请在使用前确认原始内容来源可靠。");
  }

  if (goal.includes("客户") || goal.includes("客服")) {
    notices.push("涉及客户信息时，请先脱敏后再使用。");
  }

  if (goal.includes("公司") || goal.includes("内部")) {
    notices.push("涉及公司内部资料时，请确认分享与导出范围。");
  }

  return notices.join("\n");
}

function summarizeResources(resources: ResourceItem[]) {
  if (!resources.length) {
    return "当前没有补充资料，Skill 主要根据用户目标生成。";
  }

  return resources
    .map((resource) => `${resource.type.toUpperCase()}: ${resource.name}${resource.content ? ` - ${resource.content.slice(0, 80)}` : ""}`)
    .join("\n");
}

export function buildStructuredSpec(project: ProjectRecord): StructuredSpec {
  const goal = project.goal.trim() || "帮助用户完成指定任务";
  const skillName = project.title.trim() || cleanGoal(goal);
  const audience = project.audience.trim() || "刚接触 OpenClaw 的电脑新手";
  const mainTask = project.mainTask.trim() || goal;
  const inputFormat = project.inputFormat.trim() || "用户输入的目标、说明、文本资料或上传的参考内容";
  const outputFormat = project.outputFormat.trim() || "可直接使用的 OpenClaw Skill 说明、安装步骤和示例";
  const description =
    project.description.trim() ||
    `帮助${audience}完成${mainTask}，并输出${outputFormat}。`;

  return {
    skillName,
    description,
    audience,
    mainTask,
    inputFormat,
    outputFormat,
    outputStyle: project.outputStyle,
    language: project.language,
    warnings: project.warnings.trim() || buildWarnings(goal, project.importedSkillText),
    sourceSummary: summarizeResources(project.resources),
  };
}

function styleHint(style: OutputStyle) {
  switch (style) {
    case "detailed":
      return "输出更完整，适合希望看到更多步骤和解释的用户。";
    case "teaching":
      return "输出更像一步一步的教学说明，适合新手跟着操作。";
    default:
      return "输出简洁直接，适合第一次上手的用户。";
  }
}

export function buildDraftContent(spec: StructuredSpec, includeExamples: boolean): DraftContent {
  const previewText = [
    `这个 Skill 用于${spec.mainTask}。`,
    `它主要面向${spec.audience}，帮助用户输入${spec.inputFormat}后，输出${spec.outputFormat}。`,
    styleHint(spec.outputStyle),
    "如果你还不熟悉 OpenClaw，可以先照着示例输入，再逐步换成自己的真实需求。",
    spec.warnings,
  ].join("\n\n");

  const exampleInput = `请根据以下内容执行任务：\n- 目标：${spec.mainTask}\n- 输入：${spec.inputFormat}\n- 输出要求：${spec.outputFormat}`;

  const exampleOutput = `结果摘要：\n1. 已按要求整理任务目标\n2. 已给出更适合新手执行的步骤\n3. 已输出可继续修改和复用的 Skill 内容`;

  const exampleBlock = includeExamples
    ? `## 示例\n### 示例输入\n${exampleInput}\n\n### 示例输出\n${exampleOutput}`
    : "## 示例\n当前版本未附带示例，可在应用中重新打开并勾选“附带示例”。";

  const skillMarkdown = `---
name: ${spec.skillName}
description: ${spec.description}
language: ${spec.language}
---

# ${spec.skillName}

## 用途
${spec.description}

## 适用对象
${spec.audience}

## 适用场景
${spec.mainTask}

## 输入内容
${spec.inputFormat}

## 输出内容
${spec.outputFormat}

## 资料摘要
${spec.sourceSummary}

## 使用建议
- 先用一段简单输入测试效果
- 如果有参考资料，可以和目标一起提供给 Skill
- 输出前再检查是否符合你的真实场景

## 注意事项
${spec.warnings}

${exampleBlock}
`;

  const readmeMarkdown = `# ${spec.skillName}

## 简介
${spec.description}

## 适用场景
${spec.mainTask}

## 安装方式
1. 解压导出的压缩包
2. 将整个目录放入 OpenClaw 的 skills 目录
3. 重启或刷新 OpenClaw
4. 先用示例输入测试一次

## 使用方法
- 输入：${spec.inputFormat}
- 输出：${spec.outputFormat}
- 风格：${styleHint(spec.outputStyle)}

## 注意事项
${spec.warnings}
`;

  return {
    previewText,
    skillMarkdown,
    readmeMarkdown,
    exampleInput,
    exampleOutput,
  };
}

export async function exportProjectZip(project: ProjectRecord) {
  const spec = buildStructuredSpec(project);
  const draft = project.draft ?? buildDraftContent(spec, project.includeExamples);
  const zip = new JSZip();
  const baseFolder = zip.folder(project.title.trim() || spec.skillName);

  if (!baseFolder) {
    throw new Error("无法创建导出目录。");
  }

  baseFolder.file("SKILL.md", draft.skillMarkdown);
  baseFolder.file("README.md", draft.readmeMarkdown);
  baseFolder.file(
    "examples/sample.txt",
    `示例输入\n${draft.exampleInput}\n\n示例输出\n${draft.exampleOutput}`,
  );
  baseFolder.file(
    "meta.json",
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        mode: project.mode,
        language: project.language,
      },
      null,
      2,
    ),
  );

  const blob = await zip.generateAsync({ type: "blob" });
  const fileName = `${(project.title.trim() || spec.skillName).replace(/\s+/g, "-")}.zip`;

  return { blob, fileName };
}
