#!/usr/bin/env node

import { spawn } from "node:child_process";

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const baseUrl = process.env.V2_CHECK_BASE_URL || "http://127.0.0.1:3000";
const hostArg = process.env.STAGE_LOCAL_HOST || "127.0.0.1";
const portArg = process.env.STAGE_LOCAL_PORT || "3000";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function isReachable(url) {
  try {
    const response = await fetch(`${url.replace(/\/+$/, "")}/api/internal/v2-infra-status`, {
      method: "GET",
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  }
}

function runNpm(args, options = {}) {
  return spawn(npmCmd, args, {
    stdio: options.silent ? "pipe" : "inherit",
    shell: false,
    env: process.env,
  });
}

async function waitUntilReachable(url, maxAttempts = 40) {
  for (let i = 1; i <= maxAttempts; i += 1) {
    if (await isReachable(url)) {
      return i;
    }
    await wait(1000);
  }
  return 0;
}

async function runStageFullAndWait() {
  const child = runNpm(["run", "stage:full"]);
  return new Promise((resolve) => {
    child.on("close", (code) => {
      resolve(code ?? 1);
    });
  });
}

async function main() {
  const alreadyReachable = await isReachable(baseUrl);

  if (alreadyReachable) {
    const exitCode = await runStageFullAndWait();
    process.exit(exitCode);
  }

  const devServer = runNpm(["run", "dev", "--", "--hostname", hostArg, "--port", portArg], { silent: true });
  let devStopped = false;

  const stopDevServer = () => {
    if (!devStopped) {
      devStopped = true;
      devServer.kill();
    }
  };

  try {
    const attempts = await waitUntilReachable(baseUrl, 50);
    if (!attempts) {
      console.error(
        JSON.stringify(
          {
            ok: false,
            message: "local dev server boot timeout",
            baseUrl,
          },
          null,
          2,
        ),
      );
      stopDevServer();
      process.exit(1);
    }

    const exitCode = await runStageFullAndWait();
    stopDevServer();
    process.exit(exitCode);
  } catch (error) {
    stopDevServer();
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
