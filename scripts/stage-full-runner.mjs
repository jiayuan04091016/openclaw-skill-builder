#!/usr/bin/env node

import { spawn } from "node:child_process";

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
  const deliveryBlocked = Boolean(deliveryStatus && !deliveryStatus.readyForDelivery);
  const finalFailedStep = failed?.key ?? (deliveryBlocked ? "stage-delivery-status" : null);
  const summary = {
    ok: !failed && !deliveryBlocked,
    baseUrl,
    reachableAfterAttempts: reachability.attempts,
    durationMs: Date.now() - startedAt,
    finishedStep: results.at(-1)?.key ?? null,
    failedStep: finalFailedStep,
    deliveryStatus,
    steps: results,
  };

  console.log(JSON.stringify(summary, null, 2));

  if (failed || deliveryBlocked) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
