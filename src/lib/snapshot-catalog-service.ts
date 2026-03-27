export type SnapshotCatalogItem = {
  key: string;
  triggerPath: string;
  method: "POST";
  outputFileName: string;
};

export type SnapshotCatalogReport = {
  generatedAt: string;
  totalCount: number;
  items: SnapshotCatalogItem[];
};

const SNAPSHOT_CATALOG: SnapshotCatalogItem[] = [
  { key: "import-readiness", triggerPath: "/api/internal/import-readiness-snapshot", method: "POST", outputFileName: "import-readiness.md + import-provider-contract.md" },
  { key: "media-provider-contract", triggerPath: "/api/internal/media-provider-contract-snapshot", method: "POST", outputFileName: "media-provider-contract.md" },
  { key: "provider-gateway", triggerPath: "/api/internal/provider-gateway-snapshot", method: "POST", outputFileName: "provider-gateway-readiness.md" },
  { key: "provider-integration-plan", triggerPath: "/api/internal/provider-integration-plan-snapshot", method: "POST", outputFileName: "provider-integration-plan.md" },
  { key: "provider-request-telemetry", triggerPath: "/api/internal/provider-request-telemetry-snapshot", method: "POST", outputFileName: "provider-request-telemetry.md" },
  { key: "provider-telemetry-gate", triggerPath: "/api/internal/provider-telemetry-gate-snapshot", method: "POST", outputFileName: "provider-telemetry-gate.md" },
  { key: "release-readiness", triggerPath: "/api/internal/release-readiness-snapshot", method: "POST", outputFileName: "release-readiness.md" },
  { key: "stage-artifacts", triggerPath: "/api/internal/stage-artifacts-snapshot", method: "POST", outputFileName: "stage-artifacts.md" },
  { key: "stage-delivery-status", triggerPath: "/api/internal/stage-delivery-status-snapshot", method: "POST", outputFileName: "stage-delivery-status.md" },
  { key: "stage-gates", triggerPath: "/api/internal/stage-gates-snapshot", method: "POST", outputFileName: "stage-gates.md" },
  { key: "stage-report", triggerPath: "/api/internal/stage-report-snapshot", method: "POST", outputFileName: "stage-report.md" },
  { key: "stage-run-history", triggerPath: "/api/internal/stage-run-history-snapshot", method: "POST", outputFileName: "stage-run-history.md" },
  { key: "stage-snapshot", triggerPath: "/api/internal/stage-snapshot", method: "POST", outputFileName: "stage-snapshot-manifest.md + 多个基础快照" },
  { key: "sync-pipeline", triggerPath: "/api/internal/sync-pipeline-snapshot", method: "POST", outputFileName: "sync-pipeline-snapshot.md" },
  { key: "sync-readiness", triggerPath: "/api/internal/sync-readiness-snapshot", method: "POST", outputFileName: "sync-readiness.md" },
  { key: "v2-capability", triggerPath: "/api/internal/v2-capability-snapshot", method: "POST", outputFileName: "v2-capability-readiness.md" },
  { key: "v2-infra-status", triggerPath: "/api/internal/v2-infra-status-snapshot", method: "POST", outputFileName: "v2-infra-status.md" },
];

export function buildSnapshotCatalogReport(): SnapshotCatalogReport {
  return {
    generatedAt: new Date().toISOString(),
    totalCount: SNAPSHOT_CATALOG.length,
    items: SNAPSHOT_CATALOG,
  };
}

export function buildSnapshotCatalogMarkdown(report: SnapshotCatalogReport) {
  const lines = [
    "# Snapshot Catalog",
    "",
    `- generatedAt: ${report.generatedAt}`,
    `- totalCount: ${report.totalCount}`,
    "",
    "## Items",
  ];

  for (const item of report.items) {
    lines.push(`- ${item.key}: ${item.method} ${item.triggerPath}`);
    lines.push(`  output: ${item.outputFileName}`);
  }

  return lines.join("\n");
}
