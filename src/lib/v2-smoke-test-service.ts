import { createAuthService } from "@/lib/auth-service";
import { createCloudProjectGateway } from "@/lib/cloud-project-gateway";
import { createCloudStorageService } from "@/lib/cloud-storage-service";
import { createCloudSyncEngine } from "@/lib/cloud-sync-engine";
import { createProjectImportPipelineService } from "@/lib/project-import-pipeline-service";
import { createProjectMediaProcessingService } from "@/lib/project-media-processing-service";
import { createProjectService } from "@/lib/project-service";

export type V2SmokeTestKey =
  | "auth"
  | "cloud-storage"
  | "cross-device-sync"
  | "skill-import"
  | "ocr"
  | "video";

export type V2SmokeTestItem = {
  key: V2SmokeTestKey;
  ok: boolean;
  summary: string;
};

export type V2SmokeTestReport = {
  allPassed: boolean;
  items: V2SmokeTestItem[];
};

function createSampleProject() {
  const projectService = createProjectService();
  const project = projectService.createProject("import", "把旧 Skill 改成适合新手使用的版本");

  return projectService.patchProject(project, {
    importedSkillText: `---
name: 会议纪要助手
description: 帮助整理会议内容
---

# 会议纪要助手

## 适用对象
办公新手

## 主要任务
整理会议纪要

## 输入内容
会议记录文本

## 输出内容
结构化纪要和待办事项
`,
    resources: [
      projectService.createResource("image", "流程截图.png", "这是图片资料占位"),
      projectService.createResource("video", "培训视频", "这是视频资料占位"),
    ],
  });
}

export async function runV2SmokeTests(): Promise<V2SmokeTestReport> {
  const authService = createAuthService();
  const cloudStorageService = createCloudStorageService();
  const cloudProjectGateway = createCloudProjectGateway();
  const cloudSyncEngine = createCloudSyncEngine(cloudProjectGateway);
  const projectImportPipelineService = createProjectImportPipelineService();
  const projectMediaProcessingService = createProjectMediaProcessingService();
  const sampleProject = createSampleProject();

  const authProfile = await authService.getCurrentProfile();
  const authResult = await authService.signIn();
  const authOk = Boolean(authProfile.displayName) && typeof authResult.ok === "boolean";

  const cloudStorageResult = await cloudStorageService.saveBundle(cloudSyncEngine.buildBundle([sampleProject]));
  const cloudStorageOk = typeof cloudStorageResult.ok === "boolean" && cloudStorageResult.projectCount === 1;

  const syncPlan = cloudSyncEngine.buildPlan([sampleProject]);
  const syncResult = await cloudSyncEngine.pushProjects([sampleProject]);
  const syncOk = syncPlan.projectCount === 1 && syncResult.projectCount === 1;

  const imported = projectImportPipelineService.importFromText(sampleProject, sampleProject.importedSkillText, "烟雾测试旧 Skill");
  const importOk = Boolean(imported.projectPatch.importedSkillArchive) && Boolean(imported.projectPatch.mainTask);

  const ocrResource = sampleProject.resources.find((resource) => resource.type === "image");
  const videoResource = sampleProject.resources.find((resource) => resource.type === "video");

  const ocrResult = ocrResource
    ? await projectMediaProcessingService.processProjectResources(sampleProject, [ocrResource.id])
    : null;
  const videoResult = videoResource
    ? await projectMediaProcessingService.processProjectResources(sampleProject, [videoResource.id])
    : null;

  const items: V2SmokeTestItem[] = [
    {
      key: "auth",
      ok: authOk,
      summary: authOk ? "账号登录框架可调用。" : "账号登录框架调用失败。",
    },
    {
      key: "cloud-storage",
      ok: cloudStorageOk,
      summary: cloudStorageOk ? "云端存储框架可保存同步包。" : "云端存储框架保存失败。",
    },
    {
      key: "cross-device-sync",
      ok: syncOk,
      summary: syncOk ? "跨设备同步框架可构建并推送同步包。" : "跨设备同步框架未通过。",
    },
    {
      key: "skill-import",
      ok: importOk,
      summary: importOk ? "旧 Skill 解析框架可生成字段和归档。" : "旧 Skill 解析框架未通过。",
    },
    {
      key: "ocr",
      ok: Boolean(ocrResult),
      summary: ocrResult ? "OCR 处理链可跑通到项目级处理。" : "OCR 处理链未通过。",
    },
    {
      key: "video",
      ok: Boolean(videoResult),
      summary: videoResult ? "视频增强链可跑通到项目级处理。" : "视频增强链未通过。",
    },
  ];

  return {
    allPassed: items.every((item) => item.ok),
    items,
  };
}
