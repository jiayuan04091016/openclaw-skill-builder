#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const docsDir = path.join(process.cwd(), "docs");
const lastRunPath = path.join(docsDir, "stage-full-last-run.json");
const historyPath = path.join(docsDir, "stage-full-run-history.jsonl");

function normalizeRunRecord(value) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const generatedAt = typeof value.generatedAt === "string" ? value.generatedAt : "";
  const ok = value.ok === true;
  const failedStep = typeof value.failedStep === "string" ? value.failedStep : null;
  const durationMs = typeof value.durationMs === "number" ? value.durationMs : 0;
  const baseUrl = typeof value.baseUrl === "string" ? value.baseUrl : "";

  if (!generatedAt) {
    return null;
  }

  return {
    generatedAt,
    ok,
    failedStep,
    durationMs,
    baseUrl,
  };
}

async function main() {
  const raw = await readFile(lastRunPath, "utf8");
  const parsed = JSON.parse(raw);
  const normalized = normalizeRunRecord(parsed);

  if (!normalized) {
    console.error("failed to rebuild history: invalid stage-full-last-run.json");
    process.exit(1);
  }

  await writeFile(historyPath, `${JSON.stringify(normalized)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        rebuilt: true,
        source: lastRunPath,
        target: historyPath,
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
