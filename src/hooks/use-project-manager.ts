import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

import { createCloudSyncClient } from "@/lib/cloud-sync-client";
import { buildImportReviewSnapshot } from "@/lib/import-review-service";
import { createProjectImportPipelineService } from "@/lib/project-import-pipeline-service";
import { createProjectMediaProcessingService } from "@/lib/project-media-processing-service";
import { createProjectResourceProcessingService } from "@/lib/project-resource-processing-service";
import type { ProjectRepository } from "@/lib/project-repository";
import { createProjectService } from "@/lib/project-service";
import { createRuntimeBootstrapService } from "@/lib/runtime-bootstrap-service";
import { loadImportedSkillText } from "@/lib/skill-import-loader";
import { createSyncService, type SyncService } from "@/lib/sync-service";
import { buildStructuredSpec } from "@/lib/skill-builder";
import type {
  BuilderMode,
  ProjectRecord,
  RepositoryCapabilities,
  RepositoryStatus,
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
  if (
    file.type.startsWith("text/") ||
    file.name.endsWith(".md") ||
    file.name.endsWith(".txt") ||
    file.name.toLowerCase().endsWith(".zip")
  ) {
    return loadImportedSkillText(file);
  }

  return Promise.resolve("");
}

export function useProjectManager({ onStatusChange }: UseProjectManagerOptions) {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [homeGoal, setHomeGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [syncPreparing, setSyncPreparing] = useState(false);
  const [hasLoadedProjects, setHasLoadedProjects] = useState(false);
  const [repositoryCapabilities, setRepositoryCapabilities] = useState<RepositoryCapabilities | null>(null);
  const [repositoryStatus, setRepositoryStatus] = useState<RepositoryStatus | null>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);
  const repositoryRef = useRef<ProjectRepository | null>(null);
  const syncServiceRef = useRef<SyncService | null>(null);
  const projectServiceRef = useRef(createProjectService());
  const projectImportPipelineServiceRef = useRef(createProjectImportPipelineService());
  const projectMediaProcessingServiceRef = useRef(createProjectMediaProcessingService());
  const projectResourceProcessingServiceRef = useRef(createProjectResourceProcessingService());
  const cloudSyncClientRef = useRef(createCloudSyncClient());

  useEffect(() => {
    const runtimeBootstrapService = createRuntimeBootstrapService(window.localStorage);
    let isMounted = true;

    async function loadProjects() {
      try {
        const { repository, capabilities } = await runtimeBootstrapService.bootstrap();

        if (!isMounted) {
          return;
        }

        repositoryRef.current = repository;
        syncServiceRef.current = createSyncService({
          repository,
          cloudSyncClient: cloudSyncClientRef.current,
          backupInputRef,
        });
        setRepositoryCapabilities(capabilities);

        const parsed = await repository.loadProjects();

        if (!isMounted) {
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
          onStatusChange("本机项目读取失败，已切换为空白状态。");
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
    if (!hasLoadedProjects || !repositoryRef.current) {
      return;
    }

    void repositoryRef.current.saveProjects(projects);
    setRepositoryStatus(repositoryRef.current.getStatus(projects));
  }, [projects, hasLoadedProjects]);

  const activeProject = useMemo(
    () => projects.find((item) => item.id === activeProjectId) ?? null,
    [projects, activeProjectId],
  );

  const structuredSpec = useMemo(
    () => (activeProject ? buildStructuredSpec(activeProject) : null),
    [activeProject],
  );

  const currentDraft = useMemo(() => {
    if (!activeProject) {
      return null;
    }

    return activeProject.draft ?? projectServiceRef.current.buildDraft(activeProject);
  }, [activeProject]);

  const cloudSyncPlan = useMemo(() => cloudSyncClientRef.current.buildPlan(projects), [projects]);
  const importReviewSnapshot = useMemo(
    () => (activeProject?.mode === "import" ? buildImportReviewSnapshot(activeProject.importedSkillText) : null),
    [activeProject?.mode, activeProject?.importedSkillText],
  );

  function upsertProject(project: ProjectRecord) {
    setProjects((current) => projectServiceRef.current.upsertProject(current, project));
  }

  function ensureProject(mode: BuilderMode, seedGoal = "") {
    if (activeProject && activeProject.mode === mode) {
      return activeProject;
    }

    const project = projectServiceRef.current.createProject(mode, seedGoal);
    upsertProject(project);
    setActiveProjectId(project.id);
    return project;
  }

  function updateProject(patch: Partial<ProjectRecord>) {
    if (!activeProject) {
      return;
    }

    upsertProject(projectServiceRef.current.patchProject(activeProject, patch));
  }

  function startFromScratch(goal = "") {
    const project = projectServiceRef.current.createProject("create", goal);
    upsertProject(project);
    setActiveProjectId(project.id);
    onStatusChange("已创建新项目，现在可以开始填写目标。");
    return project;
  }

  function startFromImport(goal = "") {
    const project = projectServiceRef.current.createProject("import", goal);
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

    if (type === "skill") {
      const imported = await projectImportPipelineServiceRef.current.importFromFile(activeProject, file);
      const resource = projectServiceRef.current.createResource(
        imported.resourceType,
        imported.asset.sourceName,
        imported.asset.importedSkillText || `${file.name} 已上传，可作为补充资料使用。`,
      );

      updateProject({
        resources: [...activeProject.resources, resource],
        ...imported.projectPatch,
      });
      onStatusChange(`已导入旧 Skill：${file.name}`);
      event.target.value = "";
      return;
    }

    const content = await readFileContent(file);
    const resource = projectServiceRef.current.createResource(
      type,
      file.name,
      content || `${file.name} 已上传，可作为补充资料使用。`,
    );

    updateProject({
      resources: [...activeProject.resources, resource],
    });
    onStatusChange(`已添加资料：${file.name}`);
    event.target.value = "";
  }

  function addManualResource(type: ResourceType, name: string, content: string) {
    if (!activeProject || !content.trim()) {
      return;
    }

    const resource = projectServiceRef.current.createResource(type, name, content);
    updateProject({ resources: [...activeProject.resources, resource] });
    onStatusChange(`已添加 ${name}`);
  }

  function generateDraft() {
    if (!activeProject) {
      return;
    }

    const nextDraft = projectServiceRef.current.buildDraft(activeProject);
    updateProject({
      draft: nextDraft,
      title: activeProject.title || buildStructuredSpec(activeProject).skillName,
    });
    onStatusChange("内容已生成，现在可以预览、调整并导出。");
  }

  async function exportCurrentProject() {
    if (!activeProject) {
      return false;
    }

    try {
      setLoading(true);
      const { blob, fileName } = await projectServiceRef.current.exportProject(activeProject);
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
      const { blob, fileName } = await projectServiceRef.current.exportProject(target);
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
    if (!syncServiceRef.current) {
      onStatusChange("当前无法导出备份，请稍后重试。");
      return;
    }

    const payload = await syncServiceRef.current.exportBackup(projects);

    if (!payload) {
      onStatusChange("当前无法导出备份，请稍后重试。");
      return;
    }

    downloadBlob(payload.blob, payload.fileName);
    onStatusChange(`备份文件已经开始下载：${payload.fileName}`);
  }

  async function buildCloudSyncPreview() {
    if (!syncServiceRef.current) {
      return null;
    }

    return syncServiceRef.current.buildCloudPreview(projects);
  }

  async function prepareCloudSync() {
    if (!syncServiceRef.current) {
      return null;
    }

    try {
      setSyncPreparing(true);
      const result = await syncServiceRef.current.prepareCloudSync(projects);
      onStatusChange(result.message);
      return result;
    } finally {
      setSyncPreparing(false);
    }
  }

  async function refreshProjectsFromCloud() {
    if (!syncServiceRef.current) {
      return null;
    }

    try {
      setSyncPreparing(true);
      const mergedProjects = await syncServiceRef.current.refreshFromCloud(projects);

      setProjects(mergedProjects);
      setActiveProjectId((currentActiveProjectId) =>
        mergedProjects.some((project) => project.id === currentActiveProjectId) ? currentActiveProjectId : (mergedProjects[0]?.id ?? null),
      );
      onStatusChange("已完成一次云端项目刷新，后续接入真实服务后会从这里继续走。");
      return mergedProjects;
    } finally {
      setSyncPreparing(false);
    }
  }

  async function importProjectBackup(event: ChangeEvent<HTMLInputElement>) {
    if (!syncServiceRef.current) {
      return;
    }

    try {
      const importedProjects = await syncServiceRef.current.importBackup(event);

      setProjects(importedProjects);
      setActiveProjectId(importedProjects[0]?.id ?? null);
      setHomeGoal(importedProjects[0]?.goal ?? "");
      onStatusChange(`已导入 ${importedProjects.length} 个项目，并切换到最新一个。`);
    } catch {
      onStatusChange("备份文件读取失败，请检查文件内容后重试。");
    }
  }

  function applyImportedSkillText() {
    if (!activeProject?.importedSkillText.trim()) {
      onStatusChange("请先粘贴已有 Skill 内容，再进行提取。");
      return;
    }

    updateProject({
      ...projectServiceRef.current.applyImportedSkillPatch(activeProject, activeProject.importedSkillText),
      importedSkillArchive: projectServiceRef.current.buildImportedSkillArchive(
        activeProject.importedSkillText,
        activeProject.title || "手动粘贴的旧 Skill",
        "manual",
      ),
    });
    onStatusChange("已从已有 Skill 内容中提取主要信息。");
  }

  async function processProjectResource(resourceId: string) {
    if (!activeProject) {
      return null;
    }

    const resource = activeProject.resources.find((item) => item.id === resourceId);

    if (!resource) {
      return null;
    }

    const nextProcessing = await projectResourceProcessingServiceRef.current.processProjectResource(
      activeProject,
      resourceId,
    );

    if (!nextProcessing) {
      return null;
    }

    const { processingResult, projectPatch } = nextProcessing;
    updateProject(projectPatch);
    onStatusChange(processingResult.result.message);

    return processingResult;
  }

  async function processProjectMediaResources(resourceIds?: string[]) {
    if (!activeProject) {
      return null;
    }

    const nextProcessing = await projectMediaProcessingServiceRef.current.processProjectResources(activeProject, resourceIds);
    updateProject(nextProcessing.projectPatch);

    const message =
      nextProcessing.summary.processedCount > 0
        ? `已处理 ${nextProcessing.summary.processedCount} 条媒体资料。`
        : "当前没有可处理的图片或视频资料。";
    onStatusChange(message);

    return nextProcessing;
  }

  function duplicateProject(projectId: string) {
    const source = projects.find((item) => item.id === projectId);
    if (!source) {
      return;
    }

    const duplicate = projectServiceRef.current.duplicateProject(source);
    upsertProject(duplicate);
    setActiveProjectId(duplicate.id);
    onStatusChange("已复制为新版本。");
  }

  function deleteProject(projectId: string) {
    const nextProjects = projectServiceRef.current.removeProject(projects, projectId);
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
    syncPreparing,
    backupInputRef,
    currentDraft,
    structuredSpec,
    repositoryCapabilities,
    repositoryStatus,
    cloudSyncPlan,
    importReviewSnapshot,
    prepareCloudSync,
    refreshProjectsFromCloud,
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
    processProjectResource,
    processProjectMediaResources,
    duplicateProject,
    deleteProject,
  };
}
