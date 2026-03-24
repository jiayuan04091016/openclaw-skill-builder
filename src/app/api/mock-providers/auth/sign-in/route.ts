import { NextResponse } from "next/server";

const MOCK_SESSION_TOKEN = "mock-session-user-1";

export async function POST() {
  return NextResponse.json({
    ok: true,
    message: "本地 mock 登录成功。",
    sessionToken: MOCK_SESSION_TOKEN,
  });
}

