import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { buildSnapshotCatalogMarkdown, buildSnapshotCatalogReport } from "@/lib/snapshot-catalog-service";

export async function writeSnapshotCatalogSnapshot() {
  const report = buildSnapshotCatalogReport();
  const markdown = buildSnapshotCatalogMarkdown(report);
  const docsDir = path.join(process.cwd(), "docs");
  const fileName = "snapshot-catalog.md";
  const filePath = path.join(docsDir, fileName);

  await mkdir(docsDir, { recursive: true });
  await writeFile(filePath, markdown, "utf8");

  return {
    fileName,
    filePath,
    totalCount: report.totalCount,
  };
}
