import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  buildV2CapabilityReadinessMarkdown,
  buildV2CapabilityReadinessReport,
} from "@/lib/v2-capability-readiness-service";

export type V2CapabilitySnapshotResult = {
  filePath: string;
  fileName: string;
  reportReady: boolean;
};

export async function writeV2CapabilitySnapshot(): Promise<V2CapabilitySnapshotResult> {
  const report = await buildV2CapabilityReadinessReport();
  const markdown = buildV2CapabilityReadinessMarkdown(report);
  const docsDir = path.join(process.cwd(), "docs");
  const fileName = "v2-capability-readiness.md";
  const filePath = path.join(docsDir, fileName);

  await mkdir(docsDir, { recursive: true });
  await writeFile(filePath, markdown, "utf8");

  return {
    filePath,
    fileName,
    reportReady: report.allReadyForUnifiedTesting,
  };
}
