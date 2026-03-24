import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getAuthGatewayProfile } from "@/lib/auth-gateway-service";
import { normalizeProviderSessionToken, PROVIDER_SESSION_COOKIE } from "@/lib/provider-session-cookie";

export async function GET() {
  const cookieStore = await cookies();
  const sessionToken = normalizeProviderSessionToken(cookieStore.get(PROVIDER_SESSION_COOKIE)?.value);
  const profile = await getAuthGatewayProfile(sessionToken);

  return NextResponse.json(profile, {
    status: 200,
  });
}

