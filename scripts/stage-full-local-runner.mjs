#!/usr/bin/env node

import { spawn } from "node:child_process";
const baseUrl = process.env.V2_CHECK_BASE_URL || "http://127.0.0.1:3000";
const hostArg = process.env.STAGE_LOCAL_HOST || "127.0.0.1";
const portArg = process.env.STAGE_LOCAL_PORT || "3000";
const bootTimeoutSeconds = Number(process.env.STAGE_LOCAL_BOOT_TIMEOUT_SECONDS || "50");

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
  const stdio = options.silent ? "ignore" : "inherit";

  if (process.platform === "win32") {
    const commandLine = ["npm.cmd", ...args]
      .map((part) => (/\s/.test(part) ? `"${part.replace(/"/g, '\\"')}"` : part))
      .join(" ");

    return spawn("cmd.exe", ["/d", "/s", "/c", commandLine], {
      stdio,
      shell: false,
      env: process.env,
      cwd: process.cwd(),
    });
  }

  return spawn("npm", args, {
    stdio,
    shell: false,
    env: process.env,
    cwd: process.cwd(),
  });
}

async function waitForProcessClose(child) {
  return new Promise((resolve) => {
    child.on("close", (code) => {
      resolve(code ?? 1);
    });
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
  return waitForProcessClose(child);
}

async function main() {
  const alreadyReachable = await isReachable(baseUrl);

  if (alreadyReachable) {
    const exitCode = await runStageFullAndWait();
    process.exit(exitCode);
  }

  async function runWithServer(serverArgs, timeoutMessage) {
    const server = runNpm(serverArgs, { silent: true });
    let stopped = false;

    const stopServer = () => {
      if (!stopped) {
        stopped = true;
        server.kill();
      }
    };

    try {
      const attempts = await waitUntilReachable(baseUrl, Math.max(5, bootTimeoutSeconds));
      if (!attempts) {
        stopServer();
        return {
          ok: false,
          reason: timeoutMessage,
        };
      }

      const exitCode = await runStageFullAndWait();
      stopServer();
      return {
        ok: exitCode === 0,
        exitCode,
      };
    } catch (error) {
      stopServer();
      return {
        ok: false,
        reason: error instanceof Error ? error.message : String(error),
      };
    }
  }

  const devResult = await runWithServer(
    ["run", "dev", "--", "--hostname", hostArg, "--port", portArg],
    "local dev server boot timeout",
  );

  if (devResult.ok) {
    process.exit(0);
  }

  const buildCode = await waitForProcessClose(runNpm(["run", "build"]));
  if (buildCode !== 0) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          message: "fallback build failed",
        },
        null,
        2,
      ),
    );
    process.exit(buildCode);
  }

  const startResult = await runWithServer(
    ["run", "start", "--", "--hostname", hostArg, "--port", portArg],
    "local start server boot timeout",
  );

  if (startResult.ok) {
    process.exit(0);
  }

  console.error(
    JSON.stringify(
      {
        ok: false,
        message: "stage local failed in both dev and start modes",
        devFailure: devResult.reason || "unknown",
        startFailure: startResult.reason || "unknown",
        baseUrl,
      },
      null,
      2,
    ),
  );
  process.exit(typeof startResult.exitCode === "number" ? startResult.exitCode : 1);
}

main();
