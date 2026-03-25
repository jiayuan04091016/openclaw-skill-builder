type RequestJsonOptions = {
  method?: "GET" | "POST";
  payload?: unknown;
  timeoutMs?: number;
  cache?: RequestCache;
  headers?: HeadersInit;
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

export async function requestRemoteJson<T>(url: string, options: RequestJsonOptions = {}): Promise<T | null> {
  const headers = new Headers(options.headers);

  if (options.payload) {
    headers.set("content-type", "application/json");
  }

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
    return null;
  }

  return (await response.json()) as T;
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
  const attempts = Math.max(1, Math.floor(retryOptions.attempts ?? 1));
  const initialDelayMs = Math.max(0, Math.floor(retryOptions.initialDelayMs ?? 250));
  const backoffFactor = Math.max(1, retryOptions.backoffFactor ?? 2);
  let delayMs = initialDelayMs;
  let lastResult: T | null = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    lastResult = await requestRemoteJson<T>(url, options);
    if (lastResult) {
      return lastResult;
    }

    if (attempt < attempts) {
      await sleep(delayMs);
      delayMs = Math.ceil(delayMs * backoffFactor);
    }
  }

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
