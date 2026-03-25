import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { buildV2InfraStatusMarkdown, buildV2InfraStatusReport } from "@/lib/v2-infra-status-service";

export async function writeV2InfraStatusSnapshot() {
  const report = await buildV2InfraStatusReport();
  const markdown = buildV2InfraStatusMarkdown(report);
  const docsDir = path.join(process.cwd(), "docs");
  const fileName = "v2-infra-status.md";
  const filePath = path.join(docsDir, fileName);

  await mkdir(docsDir, { recursive: true });
  await writeFile(filePath, markdown, "utf8");

  return {
    fileName,
    filePath,
    readyForUnifiedTesting: report.readyForUnifiedTesting,
  };
}
