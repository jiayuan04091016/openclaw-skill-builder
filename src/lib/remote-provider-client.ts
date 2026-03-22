type RequestJsonOptions = {
  method?: "GET" | "POST";
  payload?: unknown;
  timeoutMs?: number;
  cache?: RequestCache;
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
  const response = await fetchWithTimeout(
    url,
    {
      method: options.method ?? "GET",
      cache: options.cache ?? "no-store",
      headers: options.payload
        ? {
            "content-type": "application/json",
          }
        : undefined,
      body: options.payload ? JSON.stringify(options.payload) : undefined,
    },
    options.timeoutMs,
  );

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as T;
}

export async function probeRemoteProvider(baseUrl: string, healthPath = "/health", timeoutMs = 5000): Promise<RemoteProbeResult> {
  const healthUrl = joinUrl(baseUrl, healthPath);

  try {
    const response = await fetchWithTimeout(
      healthUrl,
      {
        method: "GET",
        cache: "no-store",
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
