#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import JSZip from "jszip";

const docsDir = path.join(process.cwd(), "docs");
const manifestPath = path.join(docsDir, "stage-snapshot-manifest.md");

function nowStamp() {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}-${hh}${mi}${ss}`;
}

function extractFilePathsFromManifest(markdown) {
  return markdown
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.replace(/^- /, ""))
    .map((line) => {
      const index = line.indexOf(": ");
      return index >= 0 ? line.slice(index + 2).trim() : "";
    })
    .filter((value) => value && /[\\\/]/.test(value));
}

async function main() {
  const manifest = await readFile(manifestPath, "utf8");
  const filePaths = extractFilePathsFromManifest(manifest);
  const zip = new JSZip();

  zip.file("stage-snapshot-manifest.md", manifest);

  let addedCount = 0;
  for (const absolutePath of filePaths) {
    try {
      const content = await readFile(absolutePath, "utf8");
      const fileName = path.basename(absolutePath);
      zip.file(fileName, content);
      addedCount += 1;
    } catch {
      // Ignore missing file and continue bundling available outputs.
    }
  }

  const outputFileName = `stage-delivery-bundle-${nowStamp()}.zip`;
  const outputPath = path.join(docsDir, outputFileName);
  const latestRefPath = path.join(docsDir, "stage-delivery-bundle-latest.txt");
  const blob = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  await writeFile(outputPath, blob);
  await writeFile(latestRefPath, `${outputFileName}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        outputPath,
        addedCount,
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
