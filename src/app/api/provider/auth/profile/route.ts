import { NextResponse } from "next/server";

import { getAuthGatewayProfile } from "@/lib/auth-gateway-service";

export async function GET() {
  const profile = await getAuthGatewayProfile();

  return NextResponse.json(profile, {
    status: 200,
  });
}
