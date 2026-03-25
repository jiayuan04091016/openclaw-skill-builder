import { access, readFile } from "node:fs/promises";
import path from "node:path";

type DeliveryFileKey =
  | "v2-acceptance-check"
  | "stage-snapshot-manifest"
  | "stage-report"
  | "release-readiness"
  | "v2-infra-status";

export type StageDeliveryFileStatus = {
  key: DeliveryFileKey;
  fileName: string;
  exists: boolean;
  filePath: string;
};

export type StageDeliveryStatusReport = {
  generatedAt: string;
  readyForDelivery: boolean;
  missingCount: number;
  nextStep: string;
  bundlePointerValid: boolean;
  latestBundleFileName: string | null;
  latestBundleFilePath: string | null;
  files: StageDeliveryFileStatus[];
};

const REQUIRED_FILES: Array<{ key: DeliveryFileKey; fileName: string }> = [
  { key: "v2-acceptance-check", fileName: "v2-acceptance-check.md" },
  { key: "stage-snapshot-manifest", fileName: "stage-snapshot-manifest.md" },
  { key: "stage-report", fileName: "stage-report.md" },
  { key: "release-readiness", fileName: "release-readiness.md" },
  { key: "v2-infra-status", fileName: "v2-infra-status.md" },
];

async function pathExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function findLatestBundle(docsDir: string) {
  const latestRefPath = path.join(docsDir, "stage-delivery-bundle-latest.txt");

  try {
    const latest = (await readFile(latestRefPath, "utf8")).trim();
    if (!latest) {
      return null;
    }

    return {
      fileName: latest,
      filePath: path.join(docsDir, latest),
    };
  } catch {
    return null;
  }
}

export async function buildStageDeliveryStatusReport(): Promise<StageDeliveryStatusReport> {
  const docsDir = path.join(/* turbopackIgnore: true */ process.cwd(), "docs");
  const files = await Promise.all(
    REQUIRED_FILES.map(async (required) => {
      const filePath = path.join(docsDir, required.fileName);
      const exists = await pathExists(filePath);

      return {
        key: required.key,
        fileName: required.fileName,
        exists,
        filePath,
      };
    }),
  );

  const latestBundle = await findLatestBundle(docsDir);
  const bundlePointerValid = latestBundle ? await pathExists(latestBundle.filePath) : false;
  const missingCount = files.filter((file) => !file.exists).length;
  const readyForDelivery = missingCount === 0 && bundlePointerValid;

  return {
    generatedAt: new Date().toISOString(),
    readyForDelivery,
    missingCount,
    bundlePointerValid,
    nextStep: readyForDelivery
      ? "交付包已就绪，可直接发送 stage-delivery-bundle。"
      : bundlePointerValid
        ? "先运行 npm run stage:full 生成完整报告与交付包。"
        : "交付包指针无效或文件缺失，请先运行 npm run snapshot:bundle。",
    latestBundleFileName: latestBundle?.fileName ?? null,
    latestBundleFilePath: latestBundle?.filePath ?? null,
    files,
  };
}

export function buildStageDeliveryStatusMarkdown(report: StageDeliveryStatusReport) {
  const lines = [
    "# Stage Delivery Status",
    "",
    `- generatedAt: ${report.generatedAt}`,
    `- readyForDelivery: ${report.readyForDelivery}`,
    `- missingCount: ${report.missingCount}`,
    `- bundlePointerValid: ${report.bundlePointerValid}`,
    `- latestBundleFileName: ${report.latestBundleFileName ?? "none"}`,
    `- nextStep: ${report.nextStep}`,
    "",
    "## Files",
  ];

  for (const file of report.files) {
    lines.push(`- ${file.fileName}: ${file.exists ? "present" : "missing"}`);
    lines.push(`  filePath: ${file.filePath}`);
  }

  return lines.join("\n");
}
