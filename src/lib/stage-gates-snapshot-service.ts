import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { buildStageGatesMarkdown, buildStageGatesReport } from "@/lib/stage-gates-service";

export async function writeStageGatesSnapshot() {
  const report = await buildStageGatesReport();
  const markdown = buildStageGatesMarkdown(report);
  const docsDir = path.join(process.cwd(), "docs");
  const fileName = "stage-gates.md";
  const filePath = path.join(docsDir, fileName);

  await mkdir(docsDir, { recursive: true });
  await writeFile(filePath, markdown, "utf8");

  return {
    fileName,
    filePath,
    allPassed: report.allPassed,
  };
}
