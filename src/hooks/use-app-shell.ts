"use client";

import { useMemo, useState } from "react";

import {
  buildInstallGuideText,
  buildPreviewClipboardText,
  buildSyncPreviewMessage,
  filterProjects,
  getDraftReadinessMessage,
  getGoalValidationMessage,
  summarizeProjects,
  type AppPreviewMode,
  type AppProjectFilter,
} from "@/lib/app-shell-service";
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
  const [previewMode, setPreviewMode] = useState<AppPreviewMode>("guide");
  const [projectKeyword, setProjectKeyword] = useState("");
  const [projectFilter, setProjectFilter] = useState<AppProjectFilter>("all");
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

    setSyncPreviewMessage(buildSyncPreviewMessage(bundle.projectCount, bundle.projects));
  }

  async function copyPreviewContent() {
    if (!currentDraft) {
      return;
    }

    await navigator.clipboard.writeText(buildPreviewClipboardText(currentDraft, previewMode));
    onStatusChange("当前预览内容已复制。");
  }

  async function copyInstallGuide() {
    await navigator.clipboard.writeText(buildInstallGuideText());
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
    const message = getGoalValidationMessage(activeProject?.goal ?? "");

    if (message) {
      onStatusChange(message);
      return;
    }

    setBuilderStep(2);
  }

  function goToGenerateStep() {
    if (!activeProject) {
      return;
    }

    const message = getDraftReadinessMessage(activeProject);

    if (message) {
      onStatusChange(message);
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

  const filteredProjects = useMemo(
    () => filterProjects(projects, projectKeyword, projectFilter),
    [projectFilter, projectKeyword, projects],
  );

  const projectStats = useMemo(() => summarizeProjects(projects), [projects]);

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
