import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

import { parseImportedSkill } from "@/lib/skill-import";
import {
  createEmptyProject,
  duplicateProjectRecord,
  patchProject,
  removeProjectRecord,
  upsertProjectRecord,
} from "@/lib/project-operations";
import { createBrowserProjectRepository } from "@/lib/project-repository";
import { buildDraftContent, buildStructuredSpec, createId, exportProjectZip } from "@/lib/skill-builder";
import type {
  BuilderMode,
  DraftContent,
  ProjectRecord,
  RepositoryCapabilities,
  RepositoryStatus,
  ResourceItem,
  ResourceType,
} from "@/types/app";

type UseProjectManagerOptions = {
  onStatusChange: (message: string) => void;
};

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function readFileContent(file: File) {
  if (file.type.startsWith("text/") || file.name.endsWith(".md") || file.name.endsWith(".txt")) {
    return file.text();
  }

  return Promise.resolve("");
}

export function useProjectManager({ onStatusChange }: UseProjectManagerOptions) {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [homeGoal, setHomeGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasLoadedProjects, setHasLoadedProjects] = useState(false);
  const [repositoryCapabilities, setRepositoryCapabilities] = useState<RepositoryCapabilities | null>(null);
  const [repositoryStatus, setRepositoryStatus] = useState<RepositoryStatus | null>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);
  const repositoryRef = useRef<ReturnType<typeof createBrowserProjectRepository> | null>(null);

  useEffect(() => {
    repositoryRef.current = createBrowserProjectRepository(window.localStorage);
    setRepositoryCapabilities(repositoryRef.current.getCapabilities());
    const repository = repositoryRef.current;
    let isMounted = true;

    async function loadProjects() {
      try {
        const parsed = await repository.loadProjects();

        if (!isMounted || !parsed) {
          return;
        }

        setProjects(parsed);
        setRepositoryStatus(repository.getStatus(parsed));
        if (parsed[0]) {
          setActiveProjectId(parsed[0].id);
          setHomeGoal(parsed[0].goal);
        }
      } catch {
        if (isMounted) {
          onStatusChange("本地项目读取失败，已切换为空白状态。");
        }
      } finally {
        if (isMounted) {
          setHasLoadedProjects(true);
        }
      }
    }

    void loadProjects();

    return () => {
      isMounted = false;
    };
  }, [onStatusChange]);

  useEffect(() => {
    if (!hasLoadedProjects) {
      return;
    }

    void repositoryRef.current?.saveProjects(projects);
    if (repositoryRef.current) {
      setRepositoryStatus(repositoryRef.current.getStatus(projects));
    }
  }, [projects, hasLoadedProjects]);

  const activeProject = useMemo(
    () => projects.find((item) => item.id === activeProjectId) ?? null,
    [projects, activeProjectId],
  );

  const structuredSpec = useMemo(
    () => (activeProject ? buildStructuredSpec(activeProject) : null),
    [activeProject],
  );

  const currentDraft =
    activeProject?.draft ??
    (structuredSpec && activeProject ? buildDraftContent(structuredSpec, activeProject.includeExamples) : null);

  function upsertProject(project: ProjectRecord) {
    setProjects((current) => upsertProjectRecord(current, project));
  }

  function ensureProject(mode: BuilderMode, seedGoal = "") {
    if (activeProject && activeProject.mode === mode) {
      return activeProject;
    }

    const project = createEmptyProject(mode, seedGoal);
    upsertProject(project);
    setActiveProjectId(project.id);
    return project;
  }

  function updateProject(patch: Partial<ProjectRecord>) {
    if (!activeProject) {
      return;
    }

    upsertProject(patchProject(activeProject, patch));
  }

  function startFromScratch(goal = "") {
    const project = createEmptyProject("create", goal);
    upsertProject(project);
    setActiveProjectId(project.id);
    onStatusChange("已创建新项目，可以开始填写目标。");
    return project;
  }

  function startFromImport(goal = "") {
    const project = createEmptyProject("import", goal);
    upsertProject(project);
    setActiveProjectId(project.id);
    onStatusChange("已进入导入模式，请先添加已有 Skill 内容。");
    return project;
  }

  function removeResource(resourceId: string) {
    if (!activeProject) {
      return;
    }

    updateProject({
      resources: activeProject.resources.filter((item) => item.id !== resourceId),
    });
  }

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>, type: ResourceType) {
    const file = event.target.files?.[0];

    if (!file || !activeProject) {
      return;
    }

    const content = await readFileContent(file);
    const resource: ResourceItem = {
      id: createId("res"),
      type,
      name: file.name,
      content: content || `${file.name} 已上传，可作为补充资料使用。`,
      createdAt: new Date().toISOString(),
    };

    const importedPatch =
      type === "skill"
        ? (() => {
            const parsed = parseImportedSkill(content);

            return {
              importedSkillText: content,
              title: activeProject.title || parsed.title,
              description: activeProject.description || parsed.description,
              audience: activeProject.audience || parsed.audience,
              mainTask: activeProject.mainTask || parsed.mainTask,
              inputFormat: activeProject.inputFormat || parsed.inputFormat,
              outputFormat: activeProject.outputFormat || parsed.outputFormat,
              warnings: activeProject.warnings || parsed.warnings,
            };
          })()
        : { importedSkillText: activeProject.importedSkillText };

    updateProject({
      resources: [...activeProject.resources, resource],
      ...importedPatch,
    });
    onStatusChange(`已添加资料：${file.name}`);
    event.target.value = "";
  }

  function addManualResource(type: ResourceType, name: string, content: string) {
    if (!activeProject || !content.trim()) {
      return;
    }

    const resource: ResourceItem = {
      id: createId("res"),
      type,
      name,
      content,
      createdAt: new Date().toISOString(),
    };

    updateProject({ resources: [...activeProject.resources, resource] });
    onStatusChange(`已添加 ${name}`);
  }

  function generateDraft() {
    if (!activeProject) {
      return;
    }

    const spec = buildStructuredSpec(activeProject);
    const nextDraft: DraftContent = buildDraftContent(spec, activeProject.includeExamples);
    updateProject({ draft: nextDraft, title: activeProject.title || spec.skillName });
    onStatusChange("内容已生成，现在可以预览、调整并导出。");
  }

  async function exportCurrentProject() {
    if (!activeProject) {
      return false;
    }

    try {
      setLoading(true);
      const { blob, fileName } = await exportProjectZip(activeProject);
      downloadBlob(blob, fileName);
      onStatusChange(`导出成功：${fileName}，压缩包已经开始下载。`);
      return true;
    } catch {
      onStatusChange("导出失败，请稍后重试。");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function exportProjectById(projectId: string) {
    const target = projects.find((item) => item.id === projectId);
    if (!target) {
      onStatusChange("没有找到要导出的项目。");
      return false;
    }

    try {
      setLoading(true);
      const { blob, fileName } = await exportProjectZip(target);
      downloadBlob(blob, fileName);
      onStatusChange(`已开始导出：${fileName}`);
      return true;
    } catch {
      onStatusChange("重新导出失败，请稍后重试。");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function exportProjectBackup() {
    const payload = await repositoryRef.current?.exportBackup(projects);

    if (!payload) {
      onStatusChange("当前无法导出备份，请稍后重试。");
      return;
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const fileName = `openclaw-skill-builder-backup-${new Date().toISOString().slice(0, 10)}.json`;
    downloadBlob(blob, fileName);
    onStatusChange(`备份文件已开始下载：${fileName}`);
  }

  async function buildCloudSyncPreview() {
    if (!repositoryRef.current) {
      return null;
    }

    return repositoryRef.current.buildCloudBundle(projects);
  }

  async function importProjectBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const content = await file.text();
      const importedProjects = (await repositoryRef.current?.importBackup(content)) ?? [];

      setProjects(importedProjects);
      setActiveProjectId(importedProjects[0]?.id ?? null);
      setHomeGoal(importedProjects[0]?.goal ?? "");
      onStatusChange(`已导入 ${importedProjects.length} 个项目，并切换到最新一个。`);
    } catch {
      onStatusChange("备份文件读取失败，请检查文件内容后重试。");
    } finally {
      event.target.value = "";
    }
  }

  function applyImportedSkillText() {
    if (!activeProject?.importedSkillText.trim()) {
      onStatusChange("请先粘贴已有 Skill 内容，再进行提取。");
      return;
    }

    const parsed = parseImportedSkill(activeProject.importedSkillText);

    updateProject({
      title: parsed.title || activeProject.title,
      description: parsed.description || activeProject.description,
      audience: parsed.audience || activeProject.audience,
      mainTask: parsed.mainTask || activeProject.mainTask,
      inputFormat: parsed.inputFormat || activeProject.inputFormat,
      outputFormat: parsed.outputFormat || activeProject.outputFormat,
      warnings: parsed.warnings || activeProject.warnings,
    });
    onStatusChange("已从已有 Skill 内容中提取主要信息。");
  }

  function duplicateProject(projectId: string) {
    const source = projects.find((item) => item.id === projectId);
    if (!source) {
      return;
    }

    const duplicate = duplicateProjectRecord(source);
    upsertProject(duplicate);
    setActiveProjectId(duplicate.id);
    onStatusChange("已复制为新版本。");
  }

  function deleteProject(projectId: string) {
    const nextProjects = removeProjectRecord(projects, projectId);
    setProjects(nextProjects);
    if (activeProjectId === projectId) {
      setActiveProjectId(nextProjects[0]?.id ?? null);
    }
    if (nextProjects.length) {
      onStatusChange("项目已删除，已切换到列表里的下一个项目。");
    } else {
      setHomeGoal("");
      onStatusChange("项目已删除。当前已经没有项目了，可以从零开始创建新的内容。");
    }
  }

  return {
    projects,
    activeProject,
    activeProjectId,
    setActiveProjectId,
    homeGoal,
    setHomeGoal,
    loading,
    backupInputRef,
    currentDraft,
    structuredSpec,
    repositoryCapabilities,
    repositoryStatus,
    ensureProject,
    updateProject,
    startFromScratch,
    startFromImport,
    removeResource,
    handleFileUpload,
    addManualResource,
    generateDraft,
    exportCurrentProject,
    exportProjectById,
    exportProjectBackup,
    buildCloudSyncPreview,
    importProjectBackup,
    applyImportedSkillText,
    duplicateProject,
    deleteProject,
  };
}
