import type { V2SmokeTestItem, V2SmokeTestReport } from "@/lib/v2-smoke-test-service";

function getItemLabel(item: V2SmokeTestItem) {
  switch (item.key) {
    case "auth":
      return "账号登录";
    case "cloud-storage":
      return "云端存储";
    case "cross-device-sync":
      return "跨设备同步";
    case "skill-import":
      return "旧 Skill 解析";
    case "ocr":
      return "OCR";
    case "video":
      return "视频增强";
    default:
      return item.key;
  }
}

export function buildV2SmokeReportMarkdown(report: V2SmokeTestReport) {
  const lines = [
    "# 第二版主框架烟雾测试结果",
    "",
    `整体结果：${report.allPassed ? "通过" : "未通过"}`,
    "",
    "## 检查项",
  ];

  for (const item of report.items) {
    lines.push(`- ${getItemLabel(item)}：${item.ok ? "通过" : "未通过"}，${item.summary}`);
  }

  return lines.join("\n");
}
