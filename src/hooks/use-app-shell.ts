"use client";

import { useMemo, useState } from "react";

import type { AppSection, DraftContent, ProjectRecord, RepositoryStatus, StructuredSpec } from "@/types/app";

type UseAppShellOptions = {
  activeProject: ProjectRecord | null;
  projects: ProjectRecord[];
  homeGoal: string;
  currentDraft: DraftContent | null;
  structuredSpec: StructuredSpec | null;
  repositoryStatus: RepositoryStatus | null;
  onStatusChange: (message: string) => void;
  onStartFromScratch: (goal?: string) => void;
  onStartFromImport: (goal?: string) => void;
  onDuplicateProject: (projectId: string) => void;
  onBuildDraft: () => void;
  onBuildCloudSyncPreview: () => Promise<{ projectCount: number; projects: ProjectRecord[] } | null>;
  onUpdateProject: (patch: Partial<ProjectRecord>) => void;
};

export function useAppShell(options: UseAppShellOptions) {
  const {
    activeProject,
    projects,
    homeGoal,
    currentDraft,
    structuredSpec,
    repositoryStatus,
    onStatusChange,
    onStartFromScratch,
    onStartFromImport,
    onDuplicateProject,
    onBuildDraft,
    onBuildCloudSyncPreview,
    onUpdateProject,
  } = options;

  const [section, setSection] = useState<AppSection>("home");
  const [builderStep, setBuilderStep] = useState(1);
  const [previewMode, setPreviewMode] = useState<"guide" | "skill" | "result">("guide");
  const [projectKeyword, setProjectKeyword] = useState("");
  const [projectFilter, setProjectFilter] = useState<"all" | "draft" | "generated" | "import">("all");
  const [syncPreviewMessage, setSyncPreviewMessage] = useState("");

  function startFromScratch(goal = "") {
    onStartFromScratch(goal);
    setBuilderStep(1);
    setSection("builder");
  }

  function startFromImport(goal = "") {
    onStartFromImport(goal);
    setBuilderStep(1);
    setSection("builder");
  }

  function continueFromLearning() {
    if (activeProject) {
      setSection("builder");
      return;
    }

    if (homeGoal.trim()) {
      startFromScratch(homeGoal);
      return;
    }

    setSection("home");
    onStatusChange("先在首页写下一个目标，再开始制作会更顺。");
  }

  function generateDraft() {
    onBuildDraft();
    setBuilderStep(4);
  }

  function duplicateProject(projectId: string) {
    onDuplicateProject(projectId);
    setSection("skills");
  }

  async function previewCloudSyncBundle() {
    const bundle = await onBuildCloudSyncPreview();

    if (!bundle) {
      setSyncPreviewMessage("当前还没有可预览的迁移内容。");
      return;
    }

    const resourceCount = bundle.projects.reduce((total, project) => total + project.resources.length, 0);
    const generatedCount = bundle.projects.filter((project) => Boolean(project.draft)).length;

    setSyncPreviewMessage(
      `如果现在开始迁移，预计会带走 ${bundle.projectCount} 个项目、${resourceCount} 条资料，其中 ${generatedCount} 个已经生成草稿。`,
    );
  }

  async function copyPreviewContent() {
    if (!currentDraft) {
      return;
    }

    const content =
      previewMode === "guide"
        ? currentDraft.previewText
        : previewMode === "skill"
          ? currentDraft.skillMarkdown
          : `示例输入：\n${currentDraft.exampleInput}\n\n示例输出：\n${currentDraft.exampleOutput}`;

    await navigator.clipboard.writeText(content);
    onStatusChange("当前预览内容已复制。");
  }

  async function copyInstallGuide() {
    const guide = [
      "1. 点击导出 ZIP。",
      "2. 解压文件夹。",
      "3. 把整个目录放进 OpenClaw 的 skills 目录。",
      "4. 重启或刷新 OpenClaw。",
      "5. 先用示例输入测试一次，再放入真实内容。",
    ].join("\n");

    await navigator.clipboard.writeText(guide);
    onStatusChange("安装说明已复制。");
  }

  async function copyTestPrompt() {
    if (!currentDraft) {
      return;
    }

    await navigator.clipboard.writeText(currentDraft.exampleInput);
    onStatusChange("测试提示词已复制。");
  }

  function goToResourceStep() {
    if (!activeProject?.goal.trim()) {
      onStatusChange("请先写下你想完成的目标。");
      return;
    }

    setBuilderStep(2);
  }

  function goToGenerateStep() {
    if (!activeProject?.mainTask.trim() || !activeProject.inputFormat.trim() || !activeProject.outputFormat.trim()) {
      onStatusChange("请先补充主要任务、输入内容和输出内容。");
      return;
    }

    generateDraft();
  }

  function applyStructuredSuggestions() {
    if (!activeProject || !structuredSpec) {
      return;
    }

    onUpdateProject({
      title: activeProject.title || structuredSpec.skillName,
      description: activeProject.description || structuredSpec.description,
      audience: activeProject.audience || structuredSpec.audience,
      mainTask: activeProject.mainTask || structuredSpec.mainTask,
      inputFormat: activeProject.inputFormat || structuredSpec.inputFormat,
      outputFormat: activeProject.outputFormat || structuredSpec.outputFormat,
      warnings: activeProject.warnings || structuredSpec.warnings,
      language: activeProject.language || structuredSpec.language,
    });
    onStatusChange("已用系统建议补全空白项。");
  }

  const filteredProjects = useMemo(() => {
    const keyword = projectKeyword.trim().toLowerCase();

    return projects.filter((project) => {
      const text = `${project.title} ${project.goal}`.toLowerCase();
      const keywordMatched = !keyword || text.includes(keyword);

      if (!keywordMatched) {
        return false;
      }

      if (projectFilter === "draft") {
        return !project.draft;
      }

      if (projectFilter === "generated") {
        return Boolean(project.draft);
      }

      if (projectFilter === "import") {
        return project.mode === "import";
      }

      return true;
    });
  }, [projectFilter, projectKeyword, projects]);

  const projectStats = useMemo(
    () => ({
      total: projects.length,
      generated: projects.filter((project) => project.draft).length,
      imported: projects.filter((project) => project.mode === "import").length,
    }),
    [projects],
  );

  const migrationPreview = repositoryStatus?.migrationPreview ?? null;

  return {
    section,
    setSection,
    builderStep,
    setBuilderStep,
    previewMode,
    setPreviewMode,
    projectKeyword,
    setProjectKeyword,
    projectFilter,
    setProjectFilter,
    syncPreviewMessage,
    filteredProjects,
    projectStats,
    migrationPreview,
    startFromScratch,
    startFromImport,
    continueFromLearning,
    generateDraft,
    duplicateProject,
    previewCloudSyncBundle,
    copyPreviewContent,
    copyInstallGuide,
    copyTestPrompt,
    goToResourceStep,
    goToGenerateStep,
    applyStructuredSuggestions,
  };
}
