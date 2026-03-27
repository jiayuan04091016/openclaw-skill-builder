import type { RealIntegrationReadinessReport } from "@/lib/real-integration-readiness-service";

type ProviderTelemetryReport = {
  totalCalls: number;
  successRatePercent: number;
};

export type ProviderTelemetryGateResult = {
  enabled: boolean;
  minSuccessRatePercent: number;
  healthy: boolean;
  nextStep: string;
};

export function readProviderTelemetryMinSuccessRatePercent() {
  const fromServer = Number(process.env.PROVIDER_TELEMETRY_MIN_SUCCESS_RATE_PERCENT);
  const fromPublic = Number(process.env.NEXT_PUBLIC_PROVIDER_TELEMETRY_MIN_SUCCESS_RATE_PERCENT);
  const value = Number.isFinite(fromServer) && fromServer > 0 ? fromServer : fromPublic;

  if (Number.isFinite(value) && value > 0 && value <= 100) {
    return Math.floor(value);
  }

  return 95;
}

export function evaluateProviderTelemetryGate(
  telemetry: ProviderTelemetryReport,
  realIntegration: Pick<RealIntegrationReadinessReport, "allConfigured" | "allUsingRemoteTarget">,
): ProviderTelemetryGateResult {
  const minSuccessRatePercent = readProviderTelemetryMinSuccessRatePercent();
  const enabled = realIntegration.allConfigured && realIntegration.allUsingRemoteTarget;
  const hasSample = telemetry.totalCalls > 0;
  const successReady = telemetry.successRatePercent >= minSuccessRatePercent;
  const healthy = !enabled || (hasSample && successReady);

  const nextStep = !enabled
    ? "当前还未进入真实远端联调阶段，provider 遥测检查暂不阻塞。"
    : !hasSample
      ? "先运行 provider 真实调用链路，生成遥测样本。"
      : !successReady
        ? `先修复 provider 调用失败，将成功率提升到 >= ${minSuccessRatePercent}%。`
        : "provider 请求遥测检查已通过。";

  return {
    enabled,
    minSuccessRatePercent,
    healthy,
    nextStep,
  };
}
