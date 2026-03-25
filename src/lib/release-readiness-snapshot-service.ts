import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { buildReleaseReadinessMarkdown, buildReleaseReadinessReport } from "@/lib/release-readiness-service";

export async function writeReleaseReadinessSnapshot() {
  const report = await buildReleaseReadinessReport();
  const markdown = buildReleaseReadinessMarkdown(report);
  const docsDir = path.join(process.cwd(), "docs");
  const fileName = "release-readiness.md";
  const filePath = path.join(docsDir, fileName);

  await mkdir(docsDir, { recursive: true });
  await writeFile(filePath, markdown, "utf8");

  return {
    fileName,
    filePath,
    readyForBetaRelease: report.readyForBetaRelease,
  };
}
