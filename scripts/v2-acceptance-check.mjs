#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.V2_CHECK_BASE_URL || "http://127.0.0.1:3000";
const outputMarkdown = process.argv.includes("--markdown");

const checks = [
  {
    key: "v2-infra-status",
    path: "/api/internal/v2-infra-status",
    validate: (payload) => Boolean(payload && typeof payload.progressPercent === "number"),
  },
  {
    key: "v2-acceptance",
    path: "/api/internal/v2-acceptance",
    validate: (payload) => Boolean(payload && typeof payload.scorePercent === "number"),
  },
  {
    key: "release-readiness",
    path: "/api/internal/release-readiness",
    validate: (payload) => Boolean(payload && typeof payload.readyForBetaRelease === "boolean"),
  },
  {
    key: "stage-report",
    path: "/api/internal/stage-report",
    validate: (payload) => Boolean(payload && typeof payload.readyForBetaRelease === "boolean"),
  },
  {
    key: "stage-delivery-status",
    path: "/api/internal/stage-delivery-status",
    validate: (payload) => Boolean(payload && typeof payload.readyForDelivery === "boolean"),
  },
  {
    key: "stage-artifacts",
    path: "/api/internal/stage-artifacts",
    validate: (payload) => Boolean(payload && typeof payload.existingCount === "number"),
  },
  {
    key: "stage-gates",
    path: "/api/internal/stage-gates",
    validate: (payload) => Boolean(payload && typeof payload.passPercent === "number"),
  },
  {
    key: "stage-run-history",
    path: "/api/internal/stage-run-history",
    validate: (payload) => Boolean(payload && typeof payload.successRatePercent === "number"),
  },
  {
    key: "real-integration-readiness",
    path: "/api/internal/real-integration-readiness",
    validate: (payload) => Boolean(payload && typeof payload.readyForRealIntegration === "boolean"),
  },
  {
    key: "provider-request-telemetry",
    path: "/api/internal/provider-request-telemetry",
    validate: (payload) => Boolean(payload && typeof payload.totalCalls === "number" && Array.isArray(payload.items)),
  },
  {
    key: "import-readiness",
    path: "/api/internal/import-readiness",
    validate: (payload) =>
      Boolean(payload && Array.isArray(payload.formatCoverage) && payload.formatCoverage.length >= 1),
  },
  {
    key: "sync-readiness",
    path: "/api/internal/sync-readiness",
    validate: (payload) => Boolean(payload && typeof payload.readyForIntegration === "boolean"),
  },
  {
    key: "media-provider-contract",
    path: "/api/internal/media-provider-contract",
    validate: (payload) => Boolean(payload && typeof payload.allValid === "boolean"),
  },
];

async function runCheck(check) {
  const url = `${baseUrl.replace(/\/+$/, "")}${check.path}`;

  try {
    const response = await fetch(url, { method: "GET", cache: "no-store" });

    if (!response.ok) {
      return {
        key: check.key,
        ok: false,
        status: response.status,
        message: `HTTP ${response.status}`,
      };
    }

    const json = await response.json();
    const valid = check.validate(json);

    return {
      key: check.key,
      ok: valid,
      status: response.status,
      message: valid ? "OK" : "shape mismatch",
    };
  } catch (error) {
    return {
      key: check.key,
      ok: false,
      status: 0,
      message: error instanceof Error ? error.message : "unknown error",
    };
  }
}

function buildMarkdown(result) {
  const lines = [
    "# V2 Acceptance Check",
    "",
    `- baseUrl: ${result.baseUrl}`,
    `- passed: ${result.passedCount}/${result.totalCount}`,
    `- percent: ${result.percent}%`,
    "",
    "## Results",
  ];

  for (const item of result.items) {
    lines.push(`- ${item.key}: ${item.ok ? "PASS" : "FAIL"} (status=${item.status}, message=${item.message})`);
  }

  return lines.join("\n");
}

async function main() {
  const items = await Promise.all(checks.map((check) => runCheck(check)));
  const passedCount = items.filter((item) => item.ok).length;
  const totalCount = items.length;
  const percent = totalCount ? Math.round((passedCount / totalCount) * 100) : 0;
  const result = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    passedCount,
    totalCount,
    percent,
    items,
  };

  console.log(JSON.stringify(result, null, 2));

  if (outputMarkdown) {
    const docsDir = path.join(process.cwd(), "docs");
    const filePath = path.join(docsDir, "v2-acceptance-check.md");
    await mkdir(docsDir, { recursive: true });
    await writeFile(filePath, buildMarkdown(result), "utf8");
    console.log(`\nmarkdown written: ${filePath}`);
  }

  if (passedCount !== totalCount) {
    process.exitCode = 1;
  }
}

main();
