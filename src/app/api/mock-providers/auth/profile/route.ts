import { NextResponse } from "next/server";

function readBearerToken(request: Request) {
  const header = request.headers.get("authorization")?.trim() || "";
  if (!header.toLowerCase().startsWith("bearer ")) {
    return "";
  }

  return header.slice("bearer ".length).trim();
}

export async function GET(request: Request) {
  const token = readBearerToken(request);

  if (!token) {
    return NextResponse.json({
      mode: "guest",
      displayName: "本地访客",
      email: null,
    });
  }

  return NextResponse.json({
    mode: "authenticated",
    displayName: "本地测试账号",
    email: "local-test@example.com",
    tokenPreview: token.slice(0, 18),
  });
}

