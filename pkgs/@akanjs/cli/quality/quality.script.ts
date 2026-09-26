import { script, type Workspace } from "@akanjs/devkit/commandDecorators";
import { AkanQualityScanner, formatQualityScanResult, formatSsrScanResult } from "@akanjs/devkit/qualityScanner";
import { Logger } from "akanjs/common";

export class QualityScript extends script("quality") {
  async scan(workspace: Workspace, format: "text" | "json" = "text") {
    const spinner = workspace.spinning("Scanning Akan code quality...");
    const result = await new AkanQualityScanner().scan(workspace.workspaceRoot);
    spinner.succeed(`Quality scan completed (${result.scannedFiles} files, ${result.warnings.length} warnings)`);
    Logger.rawLog(format === "json" ? JSON.stringify(result, null, 2) : formatQualityScanResult(result));
  }

  async ssr(workspace: Workspace, format: "text" | "json" = "text") {
    const spinner = workspace.spinning("Measuring Akan server/client render balance...");
    const scanned = await new AkanQualityScanner().scan(workspace.workspaceRoot);
    const result = { ...scanned, warnings: scanned.warnings.filter((warning) => warning.scope === "ssr") };
    spinner.succeed(`SSR scan completed (${result.scannedFiles} files, ${result.warnings.length} warnings)`);
    Logger.rawLog(format === "json" ? JSON.stringify(result, null, 2) : formatSsrScanResult(result));
  }
}
