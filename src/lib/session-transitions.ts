import type { RepositoryCapabilities, RepositoryStatus } from "@/types/app";

type NextSyncStep = {
  action: string;
  hint: string;
};

export function resolveNextSyncStep(
  capabilities?: RepositoryCapabilities | null,
  repositoryStatus?: RepositoryStatus | null,
): NextSyncStep {
  const authEnabled = capabilities?.authEnabled ?? false;
  const cloudSyncEnabled = capabilities?.cloudSyncEnabled ?? false;
  const projectCount = repositoryStatus?.projectCount ?? 0;

  if (authEnabled && cloudSyncEnabled) {
    return {
      action: "继续接真实同步流程",
      hint: "账号和云端能力都已打开，下一步就可以开始接真实的用户身份和项目同步接口。",
    };
  }

  if (cloudSyncEnabled && !authEnabled) {
    return {
      action: "优先补登录接入",
      hint: "云端同步底座已经准备好，下一步最值得做的是把登录和用户身份接进来。",
    };
  }

  if (authEnabled && !cloudSyncEnabled) {
    return {
      action: "优先补云端项目存储",
      hint: "账号入口已经有了，下一步应把项目、资料和草稿接到云端存储里。",
    };
  }

  return {
    action: projectCount ? "继续先用本机版积累项目" : "先在本机版完成第一个项目",
    hint: projectCount
      ? "现在最稳的路径还是先继续在本机版里积累内容；后续接入登录后，再把这批项目迁移到云端。"
      : "当前还不需要被登录和同步打断，先把第一个能跑通的项目做出来最划算。",
  };
}

