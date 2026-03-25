#!/usr/bin/env node

import { readdir, readFile, rm } from "node:fs/promises";
import path from "node:path";

const docsDir = path.join(process.cwd(), "docs");
const keepCount = Number(process.env.STAGE_BUNDLE_KEEP_COUNT || "3");
const latestPointerPath = path.join(docsDir, "stage-delivery-bundle-latest.txt");

function isBundleFile(fileName) {
  return /^stage-delivery-bundle-\d{8}-\d{6}\.zip$/.test(fileName);
}

async function readLatestPointer() {
  try {
    return (await readFile(latestPointerPath, "utf8")).trim();
  } catch {
    return "";
  }
}

async function main() {
  const files = await readdir(docsDir);
  const bundles = files.filter(isBundleFile).sort().reverse();
  const latestPointer = await readLatestPointer();
  const keepSet = new Set(bundles.slice(0, Math.max(0, keepCount)));

  if (latestPointer) {
    keepSet.add(latestPointer);
  }

  const removed = [];

  for (const fileName of bundles) {
    if (keepSet.has(fileName)) {
      continue;
    }

    const filePath = path.join(docsDir, fileName);
    await rm(filePath, { force: true });
    removed.push(fileName);
  }

  console.log(
    JSON.stringify(
      {
        keepCount,
        totalBundles: bundles.length,
        removedCount: removed.length,
        removed,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
