import type { DraftContent, ProjectRecord } from "@/types/app";

export type AppPreviewMode = "guide" | "skill" | "result";

export type AppProjectFilter = "all" | "draft" | "generated" | "import";

export type ProjectStats = {
  total: number;
  generated: number;
  imported: number;
};

export function filterProjects(projects: ProjectRecord[], keyword: string, filter: AppProjectFilter) {
  const normalizedKeyword = keyword.trim().toLowerCase();

  return projects.filter((project) => {
    const searchableText = `${project.title} ${project.goal}`.toLowerCase();
    const keywordMatched = !normalizedKeyword || searchableText.includes(normalizedKeyword);

    if (!keywordMatched) {
      return false;
    }

    if (filter === "draft") {
      return !project.draft;
    }

    if (filter === "generated") {
      return Boolean(project.draft);
    }

    if (filter === "import") {
      return project.mode === "import";
    }

    return true;
  });
}

export function summarizeProjects(projects: ProjectRecord[]): ProjectStats {
  return {
    total: projects.length,
    generated: projects.filter((project) => Boolean(project.draft)).length,
    imported: projects.filter((project) => project.mode === "import").length,
  };
}

export function buildSyncPreviewMessage(projectCount: number, projects: ProjectRecord[]) {
  const resourceCount = projects.reduce((total, project) => total + project.resources.length, 0);
  const generatedCount = projects.filter((project) => Boolean(project.draft)).length;

  return `如果现在开始迁移，预计会带走 ${projectCount} 个项目、${resourceCount} 条资料，其中 ${generatedCount} 个已经生成草稿。`;
}

export function buildPreviewClipboardText(draft: DraftContent, previewMode: AppPreviewMode) {
  if (previewMode === "guide") {
    return draft.previewText;
  }

  if (previewMode === "skill") {
    return draft.skillMarkdown;
  }

  return `示例输入：\n${draft.exampleInput}\n\n示例输出：\n${draft.exampleOutput}`;
}

export function buildInstallGuideText() {
  return [
    "1. 点击导出 ZIP。",
    "2. 解压文件夹。",
    "3. 把整个目录放进 OpenClaw 的 skills 目录。",
    "4. 重启或刷新 OpenClaw。",
    "5. 先用示例输入测试一次，再放入真实内容。",
  ].join("\n");
}

export function getGoalValidationMessage(goal: string) {
  return goal.trim() ? null : "请先写下你想完成的目标。";
}

export function getDraftReadinessMessage(project: ProjectRecord) {
  if (!project.mainTask.trim() || !project.inputFormat.trim() || !project.outputFormat.trim()) {
    return "请先补充主要任务、输入内容和输出内容。";
  }

  return null;
}
