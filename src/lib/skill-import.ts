import { parseSkillImportSections } from "@/lib/skill-import-parser";

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

export function formatParsedSkillImportSource(source: ParsedSkillImportSource) {
  switch (source) {
    case "frontmatter:name":
      return "frontmatter 名称";
    case "frontmatter:description":
      return "frontmatter 描述";
    case "heading:h1":
      return "主标题";
    case "section:description":
      return "用途说明章节";
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

export function isWeakParsedSkillImportSource(source: ParsedSkillImportSource) {
  return source === "fallback:summary" || source === "missing";
}

export function parseImportedSkill(content: string): ParsedSkillImport {
  const sections = parseSkillImportSections(content);

  const title = sections.frontmatterName || sections.headingTitle || sections.description.slice(0, 20);
  const titleSource = sections.frontmatterName
    ? "frontmatter:name"
    : sections.headingTitle
      ? "heading:h1"
      : sections.description
        ? "section:description"
        : "missing";

  const description = sections.frontmatterDescription || sections.description || sections.summary;
  const descriptionSource = sections.frontmatterDescription
    ? "frontmatter:description"
    : sections.description
      ? "section:description"
      : sections.summary
        ? "fallback:summary"
        : "missing";

  return {
    title,
    description,
    audience: sections.audience,
    mainTask: sections.mainTask,
    inputFormat: sections.inputFormat,
    outputFormat: sections.outputFormat,
    warnings: sections.warnings,
    sources: {
      title: titleSource,
      description: descriptionSource,
      audience: sections.audience ? "section:audience" : "missing",
      mainTask: sections.mainTask ? "section:mainTask" : "missing",
      inputFormat: sections.inputFormat ? "section:inputFormat" : "missing",
      outputFormat: sections.outputFormat ? "section:outputFormat" : "missing",
      warnings: sections.warnings ? "section:warnings" : "missing",
    },
  };
}
