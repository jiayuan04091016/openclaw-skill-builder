import type { V1RegressionTestItem, V1RegressionTestReport } from "@/lib/v1-regression-test-service";

function getItemLabel(item: V1RegressionTestItem) {
  switch (item.key) {
    case "create-project":
      return "从零创建项目";
    case "import-skill":
      return "导入旧 Skill";
    case "generate-draft":
      return "生成草稿";
    case "preview":
      return "预览内容";
    case "export-zip":
      return "导出 ZIP";
    case "backup-export":
      return "备份导出";
    case "backup-restore":
      return "备份恢复";
    default:
      return item.key;
  }
}

export function buildV1RegressionReportMarkdown(report: V1RegressionTestReport) {
  const lines = [
    "# 第一版主流程回归结果",
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
