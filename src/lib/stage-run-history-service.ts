import { readFile } from "node:fs/promises";
import path from "node:path";

export type StageRunHistoryItem = {
  generatedAt: string;
  ok: boolean;
  failedStep: string | null;
  durationMs: number;
  baseUrl: string;
};

export type StageRunHistoryReport = {
  generatedAt: string;
  totalRuns: number;
  sampledRuns: number;
  successCount: number;
  successRatePercent: number;
  latestFailureStep: string | null;
  nextStep: string;
  items: StageRunHistoryItem[];
};

const MAX_SAMPLED_RUNS = 20;

function toPercent(numerator: number, denominator: number) {
  if (!denominator) {
    return 0;
  }
  return Math.round((numerator / denominator) * 100);
}

function parseHistoryLine(line: string): StageRunHistoryItem | null {
  try {
    const parsed = JSON.parse(line) as {
      generatedAt?: unknown;
      ok?: unknown;
      failedStep?: unknown;
      durationMs?: unknown;
      baseUrl?: unknown;
    };

    if (typeof parsed.generatedAt !== "string" || typeof parsed.ok !== "boolean") {
      return null;
    }

    return {
      generatedAt: parsed.generatedAt,
      ok: parsed.ok,
      failedStep: typeof parsed.failedStep === "string" ? parsed.failedStep : null,
      durationMs: typeof parsed.durationMs === "number" ? parsed.durationMs : 0,
      baseUrl: typeof parsed.baseUrl === "string" ? parsed.baseUrl : "",
    };
  } catch {
    return null;
  }
}

export async function buildStageRunHistoryReport(): Promise<StageRunHistoryReport> {
  const historyPath = path.join(/* turbopackIgnore: true */ process.cwd(), "docs", "stage-full-run-history.jsonl");
  let allItems: StageRunHistoryItem[] = [];

  try {
    const raw = await readFile(historyPath, "utf8");
    allItems = raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map(parseHistoryLine)
      .filter((item): item is StageRunHistoryItem => Boolean(item));
  } catch {
    allItems = [];
  }

  const items = allItems.slice(-MAX_SAMPLED_RUNS).reverse();
  const successCount = items.filter((item) => item.ok).length;
  const latestFailure = items.find((item) => !item.ok) ?? null;

  return {
    generatedAt: new Date().toISOString(),
    totalRuns: allItems.length,
    sampledRuns: items.length,
    successCount,
    successRatePercent: toPercent(successCount, items.length),
    latestFailureStep: latestFailure?.failedStep ?? null,
    nextStep:
      !items.length
        ? "先运行 npm run stage:full 生成第一条执行记录。"
        : latestFailure
          ? `最近失败步骤：${latestFailure.failedStep ?? "unknown"}，优先修复该环节。`
          : "最近执行稳定，可继续按当前节奏推进。",
    items,
  };
}

export function buildStageRunHistoryMarkdown(report: StageRunHistoryReport) {
  const lines = [
    "# Stage Run History",
    "",
    `- generatedAt: ${report.generatedAt}`,
    `- totalRuns: ${report.totalRuns}`,
    `- sampledRuns: ${report.sampledRuns}`,
    `- successCount: ${report.successCount}`,
    `- successRatePercent: ${report.successRatePercent}%`,
    `- latestFailureStep: ${report.latestFailureStep ?? "none"}`,
    `- nextStep: ${report.nextStep}`,
    "",
    "## Recent Runs",
  ];

  for (const item of report.items) {
    lines.push(
      `- ${item.generatedAt}: ${item.ok ? "PASS" : "FAIL"} (failedStep=${item.failedStep ?? "none"}, durationMs=${item.durationMs})`,
    );
  }

  return lines.join("\n");
}
