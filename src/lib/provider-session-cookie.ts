export const PROVIDER_SESSION_COOKIE = "openclaw_provider_session";

export type ProviderSessionCookieOptions = {
  secure?: boolean;
  maxAgeSeconds?: number;
};

export function buildProviderSessionCookieOptions(options: ProviderSessionCookieOptions = {}) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: options.secure ?? true,
    maxAge: options.maxAgeSeconds ?? 60 * 60 * 24 * 7,
  };
}

export function normalizeProviderSessionToken(value: string | null | undefined) {
  const token = value?.trim() ?? "";
  return token || "";
}

