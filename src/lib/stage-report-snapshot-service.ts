import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { buildStageReport, buildStageReportMarkdown } from "@/lib/stage-report-service";

export async function writeStageReportSnapshot() {
  const report = await buildStageReport();
  const markdown = buildStageReportMarkdown(report);
  const docsDir = path.join(process.cwd(), "docs");
  const fileName = "stage-report.md";
  const filePath = path.join(docsDir, fileName);

  await mkdir(docsDir, { recursive: true });
  await writeFile(filePath, markdown, "utf8");

  return {
    fileName,
    filePath,
    readyForBetaRelease: report.readyForBetaRelease,
  };
}
