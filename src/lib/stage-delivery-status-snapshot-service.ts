import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { buildStageDeliveryStatusMarkdown, buildStageDeliveryStatusReport } from "@/lib/stage-delivery-status-service";

export async function writeStageDeliveryStatusSnapshot() {
  const report = await buildStageDeliveryStatusReport();
  const markdown = buildStageDeliveryStatusMarkdown(report);
  const docsDir = path.join(process.cwd(), "docs");
  const fileName = "stage-delivery-status.md";
  const filePath = path.join(docsDir, fileName);

  await mkdir(docsDir, { recursive: true });
  await writeFile(filePath, markdown, "utf8");

  return {
    fileName,
    filePath,
    readyForDelivery: report.readyForDelivery,
  };
}
