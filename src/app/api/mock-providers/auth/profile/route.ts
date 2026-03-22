import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    mode: "authenticated",
    displayName: "本地测试账号",
    email: "local-test@example.com",
  });
}
