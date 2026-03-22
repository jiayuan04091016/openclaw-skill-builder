import JSZip from "jszip";

export type ImportedSkillAsset = {
  sourceType: "text" | "markdown" | "zip" | "manual";
  sourceName: string;
  importedSkillText: string;
};

function decodeText(buffer: ArrayBuffer) {
  return new TextDecoder("utf-8").decode(buffer).replace(/\r\n/g, "\n").trim();
}

function chooseZipCandidate(entries: string[]) {
  const normalizedEntries = entries.filter((entry) => !entry.endsWith("/"));

  return (
    normalizedEntries.find((entry) => /(^|\/)SKILL\.md$/i.test(entry)) ??
    normalizedEntries.find((entry) => /(^|\/)README\.md$/i.test(entry)) ??
    normalizedEntries.find((entry) => /\.md$/i.test(entry)) ??
    normalizedEntries.find((entry) => /\.txt$/i.test(entry)) ??
    null
  );
}

export async function loadImportedSkillAsset(file: File): Promise<ImportedSkillAsset> {
  if (file.name.toLowerCase().endsWith(".zip")) {
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const candidate = chooseZipCandidate(Object.keys(zip.files));

    if (!candidate) {
      return {
        sourceType: "zip",
        sourceName: file.name,
        importedSkillText: "",
      };
    }

    const importedSkillText = await zip.file(candidate)!.async("text");
    return {
      sourceType: "zip",
      sourceName: file.name,
      importedSkillText: importedSkillText.replace(/\r\n/g, "\n").trim(),
    };
  }

  if (file.type.startsWith("text/") || /\.(md|txt)$/i.test(file.name)) {
    return {
      sourceType: /\.md$/i.test(file.name) ? "markdown" : "text",
      sourceName: file.name,
      importedSkillText: decodeText(await file.arrayBuffer()),
    };
  }

  return {
    sourceType: "manual",
    sourceName: file.name,
    importedSkillText: "",
  };
}

export async function loadImportedSkillText(file: File) {
  const asset = await loadImportedSkillAsset(file);
  return asset.importedSkillText;
}
