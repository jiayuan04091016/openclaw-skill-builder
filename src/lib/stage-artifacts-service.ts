import { readFile, stat } from "node:fs/promises";
import path from "node:path";

type StageArtifactKey =
  | "v2-capability-readiness"
  | "provider-integration-plan"
  | "provider-gateway-readiness"
  | "provider-request-telemetry"
  | "provider-telemetry-gate"
  | "snapshot-catalog"
  | "sync-readiness"
  | "sync-pipeline-snapshot"
  | "media-provider-contract"
  | "import-readiness"
  | "import-provider-contract"
  | "real-integration-readiness"
  | "v2-infra-status"
  | "release-readiness"
  | "stage-report"
  | "stage-snapshot-manifest"
  | "stage-delivery-status"
  | "stage-gates"
  | "stage-full-last-run-json"
  | "stage-full-last-run-markdown"
  | "stage-full-run-history"
  | "stage-run-history-markdown"
  | "v2-acceptance-check"
  | "stage-delivery-bundle-latest";

export type StageArtifactItem = {
  key: StageArtifactKey;
  fileName: string;
  filePath: string;
  exists: boolean;
  sizeBytes: number | null;
  modifiedAt: string | null;
};

export type StageArtifactsReport = {
  generatedAt: string;
  existingCount: number;
  totalCount: number;
  missingCount: number;
  latestBundleFileName: string | null;
  latestBundleFilePath: string | null;
  latestBundleExists: boolean;
  nextStep: string;
  items: StageArtifactItem[];
};

const REQUIRED_ARTIFACTS: Array<{ key: StageArtifactKey; fileName: string }> = [
  { key: "v2-capability-readiness", fileName: "v2-capability-readiness.md" },
  { key: "provider-integration-plan", fileName: "provider-integration-plan.md" },
  { key: "provider-gateway-readiness", fileName: "provider-gateway-readiness.md" },
  { key: "provider-request-telemetry", fileName: "provider-request-telemetry.md" },
  { key: "provider-telemetry-gate", fileName: "provider-telemetry-gate.md" },
  { key: "snapshot-catalog", fileName: "snapshot-catalog.md" },
  { key: "sync-readiness", fileName: "sync-readiness.md" },
  { key: "sync-pipeline-snapshot", fileName: "sync-pipeline-snapshot.md" },
  { key: "media-provider-contract", fileName: "media-provider-contract.md" },
  { key: "import-readiness", fileName: "import-readiness.md" },
  { key: "import-provider-contract", fileName: "import-provider-contract.md" },
  { key: "real-integration-readiness", fileName: "real-integration-readiness.md" },
  { key: "v2-infra-status", fileName: "v2-infra-status.md" },
  { key: "release-readiness", fileName: "release-readiness.md" },
  { key: "stage-report", fileName: "stage-report.md" },
  { key: "stage-snapshot-manifest", fileName: "stage-snapshot-manifest.md" },
  { key: "stage-delivery-status", fileName: "stage-delivery-status.md" },
  { key: "stage-gates", fileName: "stage-gates.md" },
  { key: "stage-full-last-run-json", fileName: "stage-full-last-run.json" },
  { key: "stage-full-last-run-markdown", fileName: "stage-full-last-run.md" },
  { key: "stage-full-run-history", fileName: "stage-full-run-history.jsonl" },
  { key: "stage-run-history-markdown", fileName: "stage-run-history.md" },
  { key: "v2-acceptance-check", fileName: "v2-acceptance-check.md" },
  { key: "stage-delivery-bundle-latest", fileName: "stage-delivery-bundle-latest.txt" },
];

async function readFileStats(filePath: string) {
  try {
    const fileStat = await stat(filePath);
    return {
      exists: true,
      sizeBytes: fileStat.size,
      modifiedAt: fileStat.mtime.toISOString(),
    };
  } catch {
    return {
      exists: false,
      sizeBytes: null,
      modifiedAt: null,
    };
  }
}

async function readLatestBundlePointer(docsDir: string) {
  const pointerPath = path.join(docsDir, "stage-delivery-bundle-latest.txt");

  try {
    const fileName = (await readFile(pointerPath, "utf8")).trim();
    if (!fileName) {
      return {
        latestBundleFileName: null,
        latestBundleFilePath: null,
        latestBundleExists: false,
      };
    }

    const filePath = path.join(docsDir, fileName);
    const bundleStats = await readFileStats(filePath);
    return {
      latestBundleFileName: fileName,
      latestBundleFilePath: filePath,
      latestBundleExists: bundleStats.exists,
    };
  } catch {
    return {
      latestBundleFileName: null,
      latestBundleFilePath: null,
      latestBundleExists: false,
    };
  }
}

export async function buildStageArtifactsReport(): Promise<StageArtifactsReport> {
  const docsDir = path.join(/* turbopackIgnore: true */ process.cwd(), "docs");

  const items = await Promise.all(
    REQUIRED_ARTIFACTS.map(async (required) => {
      const filePath = path.join(docsDir, required.fileName);
      const fileStats = await readFileStats(filePath);

      return {
        key: required.key,
        fileName: required.fileName,
        filePath,
        ...fileStats,
      };
    }),
  );

  const existingCount = items.filter((item) => item.exists).length;
  const missingCount = items.length - existingCount;
  const latestBundle = await readLatestBundlePointer(docsDir);

  return {
    generatedAt: new Date().toISOString(),
    existingCount,
    totalCount: items.length,
    missingCount,
    latestBundleFileName: latestBundle.latestBundleFileName,
    latestBundleFilePath: latestBundle.latestBundleFilePath,
    latestBundleExists: latestBundle.latestBundleExists,
    nextStep:
      missingCount === 0 && latestBundle.latestBundleExists
        ? "交付资产齐全，可直接输出交付包。"
        : "先运行 npm run stage:full 生成并补齐交付资产。",
    items,
  };
}

export function buildStageArtifactsMarkdown(report: StageArtifactsReport) {
  const lines = [
    "# Stage Artifacts",
    "",
    `- generatedAt: ${report.generatedAt}`,
    `- existing: ${report.existingCount}/${report.totalCount}`,
    `- missingCount: ${report.missingCount}`,
    `- latestBundleFileName: ${report.latestBundleFileName ?? "none"}`,
    `- latestBundleExists: ${report.latestBundleExists}`,
    `- nextStep: ${report.nextStep}`,
    "",
    "## Items",
  ];

  for (const item of report.items) {
    lines.push(`- ${item.fileName}: ${item.exists ? "present" : "missing"}`);
    lines.push(`  sizeBytes: ${item.sizeBytes ?? "null"}, modifiedAt: ${item.modifiedAt ?? "null"}`);
  }

  return lines.join("\n");
}
