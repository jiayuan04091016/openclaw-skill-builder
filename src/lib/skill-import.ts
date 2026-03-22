export type ParsedSkillImportSource =
  | "frontmatter:name"
  | "frontmatter:description"
  | "heading:h1"
  | "section:description"
  | "section:audience"
  | "section:mainTask"
  | "section:inputFormat"
  | "section:outputFormat"
  | "section:warnings"
  | "fallback:summary"
  | "missing";

export type ParsedSkillImport = {
  title: string;
  description: string;
  audience: string;
  mainTask: string;
  inputFormat: string;
  outputFormat: string;
  warnings: string;
  sources: {
    title: ParsedSkillImportSource;
    description: ParsedSkillImportSource;
    audience: ParsedSkillImportSource;
    mainTask: ParsedSkillImportSource;
    inputFormat: ParsedSkillImportSource;
    outputFormat: ParsedSkillImportSource;
    warnings: ParsedSkillImportSource;
  };
};

const sectionAliases = {
  description: ["用途", "简介", "说明", "Description", "Purpose"],
  audience: ["适用对象", "适合谁用", "Audience"],
  mainTask: ["适用场景", "主要任务", "场景", "Scenario", "Use Cases"],
  inputFormat: ["输入内容", "输入", "Input", "Inputs"],
  outputFormat: ["输出内容", "输出", "Output", "Outputs"],
  warnings: ["注意事项", "风险提示", "Warnings", "Notes"],
} as const;

function normalizeText(value: string) {
  return value.replace(/\r\n/g, "\n").trim();
}

function extractFrontmatter(content: string) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  return match?.[1] ?? "";
}

function extractFrontmatterValue(content: string, key: string) {
  const frontmatter = extractFrontmatter(content);
  const match = frontmatter.match(new RegExp(`^${key}\\s*[:：]\\s*(.+)$`, "im"));

  return match?.[1]?.trim().replace(/^['"]|['"]$/g, "") ?? "";
}

function extractTitle(content: string) {
  return content.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? "";
}

function extractSectionByHeading(content: string, heading: string) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = content.match(new RegExp(`^#{2,4}\\s+${escaped}\\s*$\\n([\\s\\S]*?)(?=^#{2,4}\\s+|\\Z)`, "im"));

  return normalizeText(match?.[1] ?? "");
}

function extractFirstAvailableSection(content: string, aliases: readonly string[]) {
  for (const alias of aliases) {
    const section = extractSectionByHeading(content, alias);

    if (section) {
      return section;
    }
  }

  return "";
}

function fallbackSummary(content: string) {
  const withoutFrontmatter = content.replace(/^---[\s\S]*?---\n?/, "");

  return withoutFrontmatter
    .split("\n")
    .map((line) => line.replace(/^#+\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(" ")
    .slice(0, 120)
    .trim();
}

function resolveSectionSource<T extends keyof typeof sectionAliases>(
  content: string,
  key: T,
): { value: string; source: ParsedSkillImportSource } {
  const value = extractFirstAvailableSection(content, sectionAliases[key]);

  if (!value) {
    return { value: "", source: "missing" };
  }

  const sourceMap: Record<keyof typeof sectionAliases, ParsedSkillImportSource> = {
    description: "section:description",
    audience: "section:audience",
    mainTask: "section:mainTask",
    inputFormat: "section:inputFormat",
    outputFormat: "section:outputFormat",
    warnings: "section:warnings",
  };

  return {
    value,
    source: sourceMap[key],
  };
}

export function formatParsedSkillImportSource(source: ParsedSkillImportSource) {
  switch (source) {
    case "frontmatter:name":
      return "frontmatter 名称";
    case "frontmatter:description":
      return "frontmatter 描述";
    case "heading:h1":
      return "主标题";
    case "section:description":
      return "用途/说明章节";
    case "section:audience":
      return "适用对象章节";
    case "section:mainTask":
      return "主要任务章节";
    case "section:inputFormat":
      return "输入内容章节";
    case "section:outputFormat":
      return "输出内容章节";
    case "section:warnings":
      return "注意事项章节";
    case "fallback:summary":
      return "正文摘要回退";
    default:
      return "还没有提取到";
  }
}

export function parseImportedSkill(content: string): ParsedSkillImport {
  const normalized = normalizeText(content);
  const frontmatterName = extractFrontmatterValue(normalized, "name");
  const headingTitle = extractTitle(normalized);
  const descriptionSection = resolveSectionSource(normalized, "description");
  const audienceSection = resolveSectionSource(normalized, "audience");
  const mainTaskSection = resolveSectionSource(normalized, "mainTask");
  const inputSection = resolveSectionSource(normalized, "inputFormat");
  const outputSection = resolveSectionSource(normalized, "outputFormat");
  const warningSection = resolveSectionSource(normalized, "warnings");
  const frontmatterDescription = extractFrontmatterValue(normalized, "description");
  const summaryFallback = fallbackSummary(normalized);

  const title = frontmatterName || headingTitle || descriptionSection.value.slice(0, 20);
  const titleSource = frontmatterName
    ? "frontmatter:name"
    : headingTitle
      ? "heading:h1"
      : descriptionSection.value
        ? "section:description"
        : "missing";

  const description = frontmatterDescription || descriptionSection.value || summaryFallback;
  const descriptionSource = frontmatterDescription
    ? "frontmatter:description"
    : descriptionSection.value
      ? "section:description"
      : summaryFallback
        ? "fallback:summary"
        : "missing";

  return {
    title,
    description,
    audience: audienceSection.value,
    mainTask: mainTaskSection.value,
    inputFormat: inputSection.value,
    outputFormat: outputSection.value,
    warnings: warningSection.value,
    sources: {
      title: titleSource,
      description: descriptionSource,
      audience: audienceSection.source,
      mainTask: mainTaskSection.source,
      inputFormat: inputSection.source,
      outputFormat: outputSection.source,
      warnings: warningSection.source,
    },
  };
}
