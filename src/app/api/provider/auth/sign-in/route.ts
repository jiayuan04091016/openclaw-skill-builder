import { NextResponse } from "next/server";

import { runAuthGatewaySignIn } from "@/lib/auth-gateway-service";

export async function POST() {
  const result = await runAuthGatewaySignIn();

  return NextResponse.json(result, {
    status: result.ok ? 200 : 502,
  });
}
