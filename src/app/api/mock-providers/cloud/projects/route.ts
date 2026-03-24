import { NextResponse } from "next/server";

import { readMockCloudProjects } from "@/lib/mock-cloud-store";

function readBearerToken(request: Request) {
  const header = request.headers.get("authorization")?.trim() || "";
  if (!header.toLowerCase().startsWith("bearer ")) {
    return "";
  }

  return header.slice("bearer ".length).trim();
}

export async function GET(request: Request) {
  const sessionToken = readBearerToken(request);
  const projects = readMockCloudProjects(sessionToken);
  return NextResponse.json(projects);
}

