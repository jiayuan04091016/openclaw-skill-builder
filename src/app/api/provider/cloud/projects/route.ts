import { NextResponse } from "next/server";

import { fetchCloudGatewayProjects } from "@/lib/cloud-gateway-service";

export async function GET() {
  const projects = await fetchCloudGatewayProjects();

  return NextResponse.json(projects, {
    status: 200,
  });
}
