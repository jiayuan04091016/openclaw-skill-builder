import { NextResponse } from "next/server";

import { runAuthGatewaySignOut } from "@/lib/auth-gateway-service";

export async function POST() {
  const result = await runAuthGatewaySignOut();

  return NextResponse.json(result, {
    status: result.ok ? 200 : 502,
  });
}
