import { runAuthIntegrationSmoke } from "@/lib/auth-integration-smoke-service";
import { buildAuthProviderContractReport } from "@/lib/auth-provider-contract-service";
import { buildAuthProviderModeReport } from "@/lib/auth-provider-mode-service";
import { buildProviderReadinessReport } from "@/lib/provider-readiness-service";

export type AuthReadinessReport = {
  providerMode: "local" | "mock" | "remote";
  providerTarget: string;
  providerReason: string;
  configured: boolean;
  reachable: boolean;
  contractValid: boolean;
  persistenceReady: boolean;
  readyForIntegration: boolean;
  nextStep: string;
  issues: string[];
};

export async function buildAuthReadinessReport(): Promise<AuthReadinessReport> {
  const providerReadiness = await buildProviderReadinessReport();
  const authReadiness = providerReadiness.items.find((item) => item.key === "auth");
  const contractReport = await buildAuthProviderContractReport();
  const integrationSmoke = runAuthIntegrationSmoke();
  const providerMode = buildAuthProviderModeReport();

  const issues = [...contractReport.issues];

  if (!integrationSmoke.ok) {
    issues.push("本机会话持久化链路未通过。");
  }

  const configured = authReadiness?.configured ?? false;
  const reachable = authReadiness?.reachable === true;
  const contractValid = contractReport.allValid;
  const persistenceReady = integrationSmoke.ok;
  const readyForIntegration = configured && reachable && contractValid && persistenceReady;

  let nextStep = "auth 已具备联调条件。";

  if (!configured) {
    nextStep = "先配置 auth provider 地址和健康检查路径。";
  } else if (!reachable) {
    nextStep = "先让 auth provider 的健康检查地址可达。";
  } else if (!contractValid) {
    nextStep = "先修正 auth provider 的返回结构。";
  } else if (!persistenceReady) {
    nextStep = "先修正本机会话持久化链路。";
  }

  return {
    providerMode: providerMode.mode,
    providerTarget: providerMode.target,
    providerReason: providerMode.reason,
    configured,
    reachable,
    contractValid,
    persistenceReady,
    readyForIntegration,
    nextStep,
    issues,
  };
}
