#!/usr/bin/env node

import { spawn } from "node:child_process";
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.V2_CHECK_BASE_URL || "http://127.0.0.1:3000";
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

const steps = [
  { key: "check:v2:md", args: ["run", "check:v2:md"] },
  { key: "snapshot:stage", args: ["run", "snapshot:stage"] },
  { key: "snapshot:bundle", args: ["run", "snapshot:bundle"] },
];

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureBaseUrlReachable(url) {
  const healthUrl = `${url.replace(/\/+$/, "")}/api/internal/v2-infra-status`;
  const maxAttempts = 20;

  for (let i = 1; i <= maxAttempts; i += 1) {
    try {
      const response = await fetch(healthUrl, { method: "GET", cache: "no-store" });
      if (response.ok) {
        return {
          ok: true,
          url: healthUrl,
          attempts: i,
        };
      }
    } catch {
      // Ignore and retry.
    }
    await wait(1000);
  }

  return {
    ok: false,
    url: healthUrl,
    attempts: maxAttempts,
  };
}

async function readDeliveryStatus(url) {
  const endpoint = `${url.replace(/\/+$/, "")}/api/internal/stage-delivery-status`;

  try {
    const response = await fetch(endpoint, { method: "GET", cache: "no-store" });
    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        readyForDelivery: false,
      };
    }

    const payload = await response.json();
    return {
      ok: true,
      status: response.status,
      readyForDelivery: payload?.readyForDelivery === true,
      latestBundleFileName: typeof payload?.latestBundleFileName === "string" ? payload.latestBundleFileName : null,
      nextStep: typeof payload?.nextStep === "string" ? payload.nextStep : "",
    };
  } catch {
    return {
      ok: false,
      status: 0,
      readyForDelivery: false,
    };
  }
}

async function readArtifactsStatus(url) {
  const endpoint = `${url.replace(/\/+$/, "")}/api/internal/stage-artifacts`;

  try {
    const response = await fetch(endpoint, { method: "GET", cache: "no-store" });
    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        missingCount: null,
        latestBundleExists: false,
      };
    }

    const payload = await response.json();
    return {
      ok: true,
      status: response.status,
      missingCount: typeof payload?.missingCount === "number" ? payload.missingCount : null,
      latestBundleExists: payload?.latestBundleExists === true,
      nextStep: typeof payload?.nextStep === "string" ? payload.nextStep : "",
    };
  } catch {
    return {
      ok: false,
      status: 0,
      missingCount: null,
      latestBundleExists: false,
    };
  }
}

function runNpmStep(step) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const child = spawn(npmCmd, step.args, {
      stdio: "inherit",
      shell: false,
      env: process.env,
    });

    child.on("close", (code) => {
      resolve({
        key: step.key,
        ok: code === 0,
        code: code ?? -1,
        durationMs: Date.now() - startedAt,
      });
    });
  });
}

function buildRunMarkdown(summary) {
  const lines = [
    "# Stage Full Last Run",
    "",
    `- ok: ${summary.ok}`,
    `- baseUrl: ${summary.baseUrl}`,
    `- durationMs: ${summary.durationMs}`,
    `- reachableAfterAttempts: ${summary.reachableAfterAttempts}`,
    `- finishedStep: ${summary.finishedStep ?? "none"}`,
    `- failedStep: ${summary.failedStep ?? "none"}`,
    "",
    "## Delivery Status",
    `- readyForDelivery: ${summary.deliveryStatus?.readyForDelivery ?? "unknown"}`,
    `- latestBundleFileName: ${summary.deliveryStatus?.latestBundleFileName ?? "none"}`,
    `- nextStep: ${summary.deliveryStatus?.nextStep ?? "unknown"}`,
    "",
    "## Artifacts Status",
    `- missingCount: ${summary.artifactsStatus?.missingCount ?? "unknown"}`,
    `- latestBundleExists: ${summary.artifactsStatus?.latestBundleExists ?? "unknown"}`,
    `- nextStep: ${summary.artifactsStatus?.nextStep ?? "unknown"}`,
    "",
    "## Steps",
  ];

  for (const step of summary.steps) {
    lines.push(`- ${step.key}: ${step.ok ? "PASS" : "FAIL"} (code=${step.code}, durationMs=${step.durationMs})`);
  }

  return lines.join("\n");
}

async function persistRunSummary(summary) {
  const docsDir = path.join(process.cwd(), "docs");
  const jsonPath = path.join(docsDir, "stage-full-last-run.json");
  const markdownPath = path.join(docsDir, "stage-full-last-run.md");
  const historyPath = path.join(docsDir, "stage-full-run-history.jsonl");
  const historyMarkdownPath = path.join(docsDir, "stage-run-history.md");

  await mkdir(docsDir, { recursive: true });
  await writeFile(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  await writeFile(markdownPath, buildRunMarkdown(summary), "utf8");
  await appendFile(historyPath, `${JSON.stringify(summary)}\n`, "utf8");

  const historyRaw = await readFile(historyPath, "utf8");
  const historyItems = historyRaw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
  const sampled = historyItems.slice(-20).reverse();
  const successCount = sampled.filter((item) => item.ok === true).length;
  const successRatePercent = sampled.length ? Math.round((successCount / sampled.length) * 100) : 0;
  const historyLines = [
    "# Stage Run History",
    "",
    `- generatedAt: ${new Date().toISOString()}`,
    `- totalRuns: ${historyItems.length}`,
    `- sampledRuns: ${sampled.length}`,
    `- successCount: ${successCount}`,
    `- successRatePercent: ${successRatePercent}%`,
    "",
    "## Recent Runs",
  ];

  for (const item of sampled) {
    historyLines.push(
      `- ${item.generatedAt ?? "unknown"}: ${item.ok ? "PASS" : "FAIL"} (failedStep=${item.failedStep ?? "none"}, durationMs=${item.durationMs ?? 0})`,
    );
  }

  await writeFile(historyMarkdownPath, historyLines.join("\n"), "utf8");
}

async function main() {
  const startedAt = Date.now();
  const reachability = await ensureBaseUrlReachable(baseUrl);

  if (!reachability.ok) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          message: "base url unreachable; ensure local app is running before stage:full",
          baseUrl,
          healthUrl: reachability.url,
          attempts: reachability.attempts,
        },
        null,
        2,
      ),
    );
    process.exit(1);
  }

  const results = [];

  for (const step of steps) {
    const result = await runNpmStep(step);
    results.push(result);
    if (!result.ok) {
      break;
    }
  }

  const failed = results.find((item) => !item.ok) ?? null;
  const deliveryStatus = failed ? null : await readDeliveryStatus(baseUrl);
  const artifactsStatus = failed ? null : await readArtifactsStatus(baseUrl);
  const deliveryBlocked = Boolean(deliveryStatus && !deliveryStatus.readyForDelivery);
  const artifactsBlocked = Boolean(
    artifactsStatus &&
      (artifactsStatus.missingCount === null ||
        artifactsStatus.missingCount > 0 ||
        artifactsStatus.latestBundleExists !== true),
  );
  const finalFailedStep =
    failed?.key ?? (deliveryBlocked ? "stage-delivery-status" : artifactsBlocked ? "stage-artifacts" : null);
  const summary = {
    generatedAt: new Date().toISOString(),
    ok: !failed && !deliveryBlocked && !artifactsBlocked,
    baseUrl,
    reachableAfterAttempts: reachability.attempts,
    durationMs: Date.now() - startedAt,
    finishedStep: results.at(-1)?.key ?? null,
    failedStep: finalFailedStep,
    deliveryStatus,
    artifactsStatus,
    steps: results,
  };

  await persistRunSummary(summary);
  console.log(JSON.stringify(summary, null, 2));

  if (failed || deliveryBlocked || artifactsBlocked) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
