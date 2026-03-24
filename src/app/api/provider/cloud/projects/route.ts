import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { fetchCloudGatewayProjects } from "@/lib/cloud-gateway-service";
import { normalizeProviderSessionToken, PROVIDER_SESSION_COOKIE } from "@/lib/provider-session-cookie";

export async function GET() {
  const cookieStore = await cookies();
  const sessionToken = normalizeProviderSessionToken(cookieStore.get(PROVIDER_SESSION_COOKIE)?.value);
  const projects = await fetchCloudGatewayProjects(sessionToken);

  return NextResponse.json(projects, {
    status: 200,
  });
}

