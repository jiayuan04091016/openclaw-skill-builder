import { resolveNextSyncStep } from "@/lib/session-transitions";
import type { RepositoryCapabilities, RepositoryStatus, SessionProfile, SessionState } from "@/types/app";

type BuildSessionStateOptions = {
  capabilities?: RepositoryCapabilities | null;
  repositoryStatus?: RepositoryStatus | null;
  sessionProfile?: SessionProfile | null;
};

export function buildGuestSessionProfile(authEnabled: boolean): SessionProfile {
  return {
    mode: authEnabled ? "authenticated" : "guest",
    displayName: authEnabled ? "已登录用户" : "本机访客",
    email: null,
  };
}

export function buildSessionState(options: BuildSessionStateOptions = {}): SessionState {
  const { capabilities, repositoryStatus, sessionProfile } = options;
  const storageMode = capabilities?.storageMode ?? "local";
  const syncAvailable = capabilities?.cloudSyncEnabled ?? false;
  const projectCount = repositoryStatus?.projectCount ?? 0;
  const lastSavedAt = repositoryStatus?.lastSavedAt;
  const migrationPreview = repositoryStatus?.migrationPreview;
  const syncState = repositoryStatus?.syncState ?? "local-only";
  const syncStateLabel =
    syncState === "cloud-ready"
      ? "可接云端同步"
      : syncState === "syncing"
        ? "正在同步"
        : syncState === "error"
          ? "同步异常"
          : "本机保存中";

  const syncHint = syncAvailable
    ? "云端同步底座已开启，后续接入登录后就可以继续补真实同步流程。"
    : lastSavedAt
      ? `当前是本机保存模式，最近一次本机保存时间：${new Date(lastSavedAt).toLocaleString("zh-CN")}。后续接入登录后可再升级为跨设备同步。`
      : projectCount
        ? "当前是本机保存模式，项目会先保存在这台设备里；后续接入登录后可再升级为跨设备同步。"
        : "当前是本机保存模式，后续接入登录后可支持跨设备同步。";

  const migrationHint = migrationPreview?.readyProjectCount
    ? `当前已有 ${migrationPreview.readyProjectCount} 个项目可作为后续云端迁移的第一批，其中 ${migrationPreview.generatedProjectCount} 个已经生成草稿。`
    : "当前还没有需要迁移到云端的项目，后续可以先继续在本机版里积累内容。";

  const nextSyncStep = resolveNextSyncStep(capabilities, repositoryStatus);

  return {
    mode: sessionProfile?.mode ?? (capabilities?.authEnabled ? "authenticated" : "guest"),
    storageMode,
    displayName: sessionProfile?.displayName ?? (capabilities?.authEnabled ? "已登录用户" : "本机访客"),
    syncAvailable,
    syncStateLabel,
    syncHint,
    migrationHint,
    nextSyncAction: nextSyncStep.action,
    nextSyncActionHint: nextSyncStep.hint,
  };
}
