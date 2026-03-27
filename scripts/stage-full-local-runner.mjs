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
    child.on("close", (code, signal) => {
      resolve({
        code: code ?? 1,
        signal: signal ?? null,
      });
    });
  });
}

async function waitUntilReachable(url, maxAttempts, getServerExit) {
  for (let i = 1; i <= maxAttempts; i += 1) {
    if (await isReachable(url)) {
      return {
        reachable: true,
        attempts: i,
      };
    }

    const serverExit = getServerExit();
    if (serverExit) {
      return {
        reachable: false,
        attempts: i,
        serverExit,
        reason: "server exited before health endpoint became reachable",
      };
    }

    await wait(1000);
  }

  return {
    reachable: false,
    attempts: maxAttempts,
    reason: "boot timeout",
  };
}

async function runStageFullAndWait() {
  const child = runNpm(["run", "stage:full"]);
  return waitForProcessClose(child);
}

async function runWithServer(serverArgs, mode) {
  const server = runNpm(serverArgs, { silent: true });
  let serverExit = null;
  let stopped = false;

  server.on("close", (code, signal) => {
    serverExit = {
      code: code ?? 1,
      signal: signal ?? null,
    };
  });

  const stopServer = () => {
    if (!stopped) {
      stopped = true;
      server.kill();
    }
  };

  try {
    const reachability = await waitUntilReachable(baseUrl, Math.max(5, bootTimeoutSeconds), () => serverExit);
    if (!reachability.reachable) {
      stopServer();
      return {
        ok: false,
        mode,
        reason: reachability.reason || "unreachable",
        attempts: reachability.attempts,
        serverExit: reachability.serverExit ?? serverExit,
      };
    }

    const stageResult = await runStageFullAndWait();
    stopServer();

    return {
      ok: stageResult.code === 0,
      mode,
      attempts: reachability.attempts,
      stageFullExitCode: stageResult.code,
      stageFullSignal: stageResult.signal,
      serverExit,
    };
  } catch (error) {
    stopServer();
    return {
      ok: false,
      mode,
      reason: error instanceof Error ? error.message : String(error),
      serverExit,
    };
  }
}

async function main() {
  const alreadyReachable = await isReachable(baseUrl);
  if (alreadyReachable) {
    const stageResult = await runStageFullAndWait();
    process.exit(stageResult.code);
  }

  const devResult = await runWithServer(
    ["run", "dev", "--", "--hostname", hostArg, "--port", portArg],
    "dev",
  );
  if (devResult.ok) {
    process.exit(0);
  }

  const buildResult = await waitForProcessClose(runNpm(["run", "build"]));
  if (buildResult.code !== 0) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          message: "fallback build failed",
          buildExitCode: buildResult.code,
          buildSignal: buildResult.signal,
        },
        null,
        2,
      ),
    );
    process.exit(buildResult.code);
  }

  const startResult = await runWithServer(
    ["run", "start", "--", "--hostname", hostArg, "--port", portArg],
    "start",
  );
  if (startResult.ok) {
    process.exit(0);
  }

  console.error(
    JSON.stringify(
      {
        ok: false,
        message: "stage local failed in both dev and start modes",
        baseUrl,
        devResult,
        startResult,
      },
      null,
      2,
    ),
  );

  process.exit(
    typeof startResult.stageFullExitCode === "number"
      ? startResult.stageFullExitCode
      : startResult.serverExit?.code ?? 1,
  );
}

main();
