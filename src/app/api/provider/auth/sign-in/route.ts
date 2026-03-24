import { NextResponse } from "next/server";

import { runAuthGatewaySignIn } from "@/lib/auth-gateway-service";
import {
  buildProviderSessionCookieOptions,
  PROVIDER_SESSION_COOKIE,
} from "@/lib/provider-session-cookie";

export async function POST() {
  const result = await runAuthGatewaySignIn();
  const response = NextResponse.json(result, {
    status: result.ok ? 200 : 502,
  });

  if (result.ok && result.sessionToken) {
    response.cookies.set(
      PROVIDER_SESSION_COOKIE,
      result.sessionToken,
      buildProviderSessionCookieOptions({ secure: process.env.NODE_ENV === "production" }),
    );
  }

  return response;
}

