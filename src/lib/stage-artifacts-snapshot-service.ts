import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { buildStageArtifactsMarkdown, buildStageArtifactsReport } from "@/lib/stage-artifacts-service";

export async function writeStageArtifactsSnapshot() {
  const report = await buildStageArtifactsReport();
  const markdown = buildStageArtifactsMarkdown(report);
  const docsDir = path.join(process.cwd(), "docs");
  const fileName = "stage-artifacts.md";
  const filePath = path.join(docsDir, fileName);

  await mkdir(docsDir, { recursive: true });
  await writeFile(filePath, markdown, "utf8");

  return {
    fileName,
    filePath,
    missingCount: report.missingCount,
  };
}
