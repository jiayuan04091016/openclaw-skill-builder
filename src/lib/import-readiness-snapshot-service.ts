import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { buildImportProviderContractMarkdown, buildImportProviderContractReport } from "@/lib/import-provider-contract-service";
import { buildImportReadinessMarkdown, buildImportReadinessReport } from "@/lib/import-readiness-service";

export async function writeImportReadinessSnapshot() {
  const readiness = buildImportReadinessReport();
  const contract = buildImportProviderContractReport();
  const docsDir = path.join(process.cwd(), "docs");
  const readinessFileName = "import-readiness.md";
  const contractFileName = "import-provider-contract.md";
  const readinessFilePath = path.join(docsDir, readinessFileName);
  const contractFilePath = path.join(docsDir, contractFileName);

  await mkdir(docsDir, { recursive: true });
  await Promise.all([
    writeFile(readinessFilePath, buildImportReadinessMarkdown(readiness), "utf8"),
    writeFile(contractFilePath, buildImportProviderContractMarkdown(contract), "utf8"),
  ]);

  return {
    readiness: {
      fileName: readinessFileName,
      filePath: readinessFilePath,
      readyForIntegration: readiness.readyForIntegration,
    },
    contract: {
      fileName: contractFileName,
      filePath: contractFilePath,
      valid: contract.allValid,
    },
  };
}
