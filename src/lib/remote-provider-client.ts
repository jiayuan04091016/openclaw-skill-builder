type RequestJsonOptions = {
  method?: "GET" | "POST";
  payload?: unknown;
  timeoutMs?: number;
  cache?: RequestCache;
  headers?: HeadersInit;
  telemetryKey?: string;
};

type RequestRetryOptions = {
  attempts?: number;
  initialDelayMs?: number;
  backoffFactor?: number;
};

export type RemoteProbeResult = {
  reachable: boolean;
  statusCode: number | null;
  healthUrl: string;
};

export type RemoteProviderTelemetryItem = {
  key: string;
  totalCalls: number;
  successCalls: number;
  failureCalls: number;
  retriedCalls: number;
  totalAttempts: number;
  maxAttemptsInSingleCall: number;
  lastAttemptCount: number;
  lastStatusCode: number | null;
  lastError: string | null;
  lastUrl: string;
  lastRequestedAt: string | null;
  lastSucceededAt: string | null;
  lastFailedAt: string | null;
};

const remoteProviderTelemetryStore = new Map<string, RemoteProviderTelemetryItem>();

function joinUrl(baseUrl: string, path: string) {
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

async function fetchWithTimeout(input: string, init: RequestInit, timeoutMs = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

type RequestRemoteJsonResult<T> = {
  data: T | null;
  statusCode: number | null;
  error: string | null;
};

function normalizeTelemetryKey(url: string, explicitKey = "") {
  if (explicitKey.trim()) {
    return explicitKey.trim();
  }

  if (url.includes("/auth")) {
    return "auth";
  }
  if (url.includes("/cloud")) {
    return "cloud-storage";
  }
  if (url.includes("/ocr")) {
    return "ocr";
  }
  if (url.includes("/video")) {
    return "video";
  }

  return "unknown";
}

function readTelemetryItem(key: string): RemoteProviderTelemetryItem {
  return (
    remoteProviderTelemetryStore.get(key) ?? {
      key,
      totalCalls: 0,
      successCalls: 0,
      failureCalls: 0,
      retriedCalls: 0,
      totalAttempts: 0,
      maxAttemptsInSingleCall: 0,
      lastAttemptCount: 0,
      lastStatusCode: null,
      lastError: null,
      lastUrl: "",
      lastRequestedAt: null,
      lastSucceededAt: null,
      lastFailedAt: null,
    }
  );
}

function writeTelemetryItem(item: RemoteProviderTelemetryItem) {
  remoteProviderTelemetryStore.set(item.key, item);
}

function updateTelemetry(
  telemetryKey: string,
  payload: {
    attemptsUsed: number;
    success: boolean;
    statusCode: number | null;
    error: string | null;
    url: string;
  },
) {
  const current = readTelemetryItem(telemetryKey);
  const now = new Date().toISOString();

  const next: RemoteProviderTelemetryItem = {
    ...current,
    totalCalls: current.totalCalls + 1,
    successCalls: current.successCalls + (payload.success ? 1 : 0),
    failureCalls: current.failureCalls + (payload.success ? 0 : 1),
    retriedCalls: current.retriedCalls + (payload.attemptsUsed > 1 ? 1 : 0),
    totalAttempts: current.totalAttempts + payload.attemptsUsed,
    maxAttemptsInSingleCall: Math.max(current.maxAttemptsInSingleCall, payload.attemptsUsed),
    lastAttemptCount: payload.attemptsUsed,
    lastStatusCode: payload.statusCode,
    lastError: payload.error,
    lastUrl: payload.url,
    lastRequestedAt: now,
    lastSucceededAt: payload.success ? now : current.lastSucceededAt,
    lastFailedAt: payload.success ? current.lastFailedAt : now,
  };

  writeTelemetryItem(next);
}

async function requestRemoteJsonDetailed<T>(
  url: string,
  options: RequestJsonOptions = {},
): Promise<RequestRemoteJsonResult<T>> {
  const headers = new Headers(options.headers);

  if (options.payload) {
    headers.set("content-type", "application/json");
  }

  try {
    const response = await fetchWithTimeout(
      url,
      {
        method: options.method ?? "GET",
        cache: options.cache ?? "no-store",
        headers,
        body: options.payload ? JSON.stringify(options.payload) : undefined,
      },
      options.timeoutMs,
    );

    if (!response.ok) {
      return {
        data: null,
        statusCode: response.status,
        error: `HTTP ${response.status}`,
      };
    }

    return {
      data: (await response.json()) as T,
      statusCode: response.status,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      statusCode: null,
      error: error instanceof Error ? error.message : "unknown error",
    };
  }
}

export async function requestRemoteJson<T>(url: string, options: RequestJsonOptions = {}): Promise<T | null> {
  const telemetryKey = normalizeTelemetryKey(url, options.telemetryKey);
  const response = await requestRemoteJsonDetailed<T>(url, options);
  updateTelemetry(telemetryKey, {
    attemptsUsed: 1,
    success: Boolean(response.data),
    statusCode: response.statusCode,
    error: response.data ? null : response.error,
    url,
  });
  return response.data;
}

function sleep(ms: number) {
  if (ms <= 0) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function requestRemoteJsonWithRetry<T>(
  url: string,
  options: RequestJsonOptions = {},
  retryOptions: RequestRetryOptions = {},
): Promise<T | null> {
  const telemetryKey = normalizeTelemetryKey(url, options.telemetryKey);
  const attempts = Math.max(1, Math.floor(retryOptions.attempts ?? 1));
  const initialDelayMs = Math.max(0, Math.floor(retryOptions.initialDelayMs ?? 250));
  const backoffFactor = Math.max(1, retryOptions.backoffFactor ?? 2);
  let delayMs = initialDelayMs;
  let lastResult: T | null = null;
  let attemptsUsed = 0;
  let lastStatusCode: number | null = null;
  let lastError: string | null = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    attemptsUsed = attempt;
    const response = await requestRemoteJsonDetailed<T>(url, options);
    lastResult = response.data;
    lastStatusCode = response.statusCode;
    lastError = response.error;
    if (lastResult) {
      updateTelemetry(telemetryKey, {
        attemptsUsed,
        success: true,
        statusCode: lastStatusCode,
        error: null,
        url,
      });
      return lastResult;
    }

    if (attempt < attempts) {
      await sleep(delayMs);
      delayMs = Math.ceil(delayMs * backoffFactor);
    }
  }

  updateTelemetry(telemetryKey, {
    attemptsUsed,
    success: false,
    statusCode: lastStatusCode,
    error: lastError,
    url,
  });

  return lastResult;
}

export async function probeRemoteProvider(
  baseUrl: string,
  healthPath = "/health",
  timeoutMs = 5000,
  headers?: HeadersInit,
): Promise<RemoteProbeResult> {
  const healthUrl = joinUrl(baseUrl, healthPath);

  try {
    const response = await fetchWithTimeout(
      healthUrl,
      {
        method: "GET",
        cache: "no-store",
        headers,
      },
      timeoutMs,
    );

    return {
      reachable: response.ok,
      statusCode: response.status,
      healthUrl,
    };
  } catch {
    return {
      reachable: false,
      statusCode: null,
      healthUrl,
    };
  }
}

export function buildRemoteProviderUrl(baseUrl: string, path: string) {
  return joinUrl(baseUrl, path);
}

export function readRemoteProviderTelemetrySummary() {
  const items = Array.from(remoteProviderTelemetryStore.values())
    .map((item) => ({
      ...item,
      successRatePercent: item.totalCalls > 0 ? Math.round((item.successCalls / item.totalCalls) * 100) : 0,
      averageAttemptsPerCall:
        item.totalCalls > 0 ? Number((item.totalAttempts / item.totalCalls).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.totalCalls - a.totalCalls || a.key.localeCompare(b.key));

  const totalCalls = items.reduce((sum, item) => sum + item.totalCalls, 0);
  const successCalls = items.reduce((sum, item) => sum + item.successCalls, 0);
  const failureCalls = items.reduce((sum, item) => sum + item.failureCalls, 0);
  const retriedCalls = items.reduce((sum, item) => sum + item.retriedCalls, 0);
  const totalAttempts = items.reduce((sum, item) => sum + item.totalAttempts, 0);

  return {
    generatedAt: new Date().toISOString(),
    totalCalls,
    successCalls,
    failureCalls,
    retriedCalls,
    totalAttempts,
    successRatePercent: totalCalls > 0 ? Math.round((successCalls / totalCalls) * 100) : 0,
    averageAttemptsPerCall: totalCalls > 0 ? Number((totalAttempts / totalCalls).toFixed(2)) : 0,
    items,
  };
}

export function resetRemoteProviderTelemetry() {
  remoteProviderTelemetryStore.clear();
}
