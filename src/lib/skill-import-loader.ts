import JSZip from "jszip";

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

export async function loadImportedSkillText(file: File) {
  if (file.name.toLowerCase().endsWith(".zip")) {
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const candidate = chooseZipCandidate(Object.keys(zip.files));

    if (!candidate) {
      return "";
    }

    const importedSkillText = await zip.file(candidate)!.async("text");
    return importedSkillText.replace(/\r\n/g, "\n").trim();
  }

  if (file.type.startsWith("text/") || /\.(md|txt)$/i.test(file.name)) {
    return decodeText(await file.arrayBuffer());
  }

  return "";
}
