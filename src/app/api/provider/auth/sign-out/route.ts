import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { runAuthGatewaySignOut } from "@/lib/auth-gateway-service";
import { normalizeProviderSessionToken, PROVIDER_SESSION_COOKIE } from "@/lib/provider-session-cookie";

export async function POST() {
  const cookieStore = await cookies();
  const sessionToken = normalizeProviderSessionToken(cookieStore.get(PROVIDER_SESSION_COOKIE)?.value);
  const result = await runAuthGatewaySignOut(sessionToken);
  const response = NextResponse.json(result, {
    status: result.ok ? 200 : 502,
  });

  response.cookies.delete(PROVIDER_SESSION_COOKIE);
  return response;
}

