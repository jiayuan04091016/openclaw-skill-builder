#!/usr/bin/env node

const baseUrl = process.env.V2_CHECK_BASE_URL || "http://127.0.0.1:3000";

async function main() {
  const url = `${baseUrl.replace(/\/+$/, "")}/api/internal/stage-snapshot`;
  const response = await fetch(url, { method: "POST", cache: "no-store" });

  if (!response.ok) {
    const text = await response.text();
    console.error(`stage snapshot failed: HTTP ${response.status}`);
    if (text) {
      console.error(text);
    }
    process.exit(1);
  }

  const json = await response.json();
  console.log(JSON.stringify(json, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
