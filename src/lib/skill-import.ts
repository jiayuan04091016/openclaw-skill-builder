export type ParsedSkillImport = {
  title: string;
  description: string;
  audience: string;
  mainTask: string;
  inputFormat: string;
  outputFormat: string;
  warnings: string;
};

function extractFrontmatterValue(content: string, key: string) {
  const match = content.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
  return match?.[1]?.trim() ?? "";
}

function extractSection(content: string, heading: string) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = content.match(new RegExp(`##\\s+${escaped}\\s*\\n([\\s\\S]*?)(?=\\n##\\s+|$)`));
  return match?.[1]?.trim() ?? "";
}

export function parseImportedSkill(content: string): ParsedSkillImport {
  return {
    title: extractFrontmatterValue(content, "name") || extractSection(content, "用途").slice(0, 20),
    description: extractFrontmatterValue(content, "description") || extractSection(content, "用途"),
    audience: extractSection(content, "适用对象"),
    mainTask: extractSection(content, "适用场景"),
    inputFormat: extractSection(content, "输入内容"),
    outputFormat: extractSection(content, "输出内容"),
    warnings: extractSection(content, "注意事项"),
  };
}
