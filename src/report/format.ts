import type { EvalReport, Finding } from "../domain/types.js";

export function statusFromFindings(findings: Finding[]): "pass" | "fail" {
  return findings.some((item) => item.severity === "error") ? "fail" : "pass";
}

export function printFindings(findings: Finding[], json = false): void {
  if (json) {
    console.log(JSON.stringify({ status: statusFromFindings(findings), findings }, null, 2));
    return;
  }
  const errors = findings.filter((item) => item.severity === "error").length;
  const warnings = findings.filter((item) => item.severity === "warning").length;
  console.log(`${errors ? "fail" : "pass"}: ${errors} errors, ${warnings} warnings`);
  for (const item of findings) {
    console.log(`${item.severity.toUpperCase()} ${item.id}${item.route ? ` ${item.route}` : ""}${item.file ? ` ${item.file}` : ""}`);
    console.log(`  ${item.message}`);
    if (item.repair) console.log(`  repair: ${item.repair.message}`);
  }
}

export function printReport(report: EvalReport, json = false): void {
  if (json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  const reviewSuffix = report.manualReviewRequired ? " (deterministic pass; manual review requested)" : "";
  console.log(`${report.status}${reviewSuffix}: ${report.summary.errors} errors, ${report.summary.warnings} warnings, ${report.summary.routesEvaluated} routes, ${report.summary.screenshots} screenshots`);
  for (const item of report.findings) {
    console.log(`${item.severity.toUpperCase()} ${item.id}${item.route ? ` ${item.route}` : ""}${item.viewport ? ` ${item.viewport}` : ""}`);
    console.log(`  ${item.message}`);
    if (item.repair) console.log(`  repair: ${item.repair.message}`);
  }
}
