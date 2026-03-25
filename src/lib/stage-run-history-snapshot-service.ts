import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { buildStageRunHistoryMarkdown, buildStageRunHistoryReport } from "@/lib/stage-run-history-service";

export async function writeStageRunHistorySnapshot() {
  const report = await buildStageRunHistoryReport();
  const markdown = buildStageRunHistoryMarkdown(report);
  const docsDir = path.join(process.cwd(), "docs");
  const fileName = "stage-run-history.md";
  const filePath = path.join(docsDir, fileName);

  await mkdir(docsDir, { recursive: true });
  await writeFile(filePath, markdown, "utf8");

  return {
    fileName,
    filePath,
    successRatePercent: report.successRatePercent,
  };
}
