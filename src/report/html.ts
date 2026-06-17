import type { EvalReport } from "../domain/types.js";
import { escapeHtml } from "../renderer/template.js";

export function renderReportHtml(report: EvalReport): string {
  const findings = report.findings
    .map(
      (finding) => `<article>
        <header><strong>${escapeHtml(finding.severity.toUpperCase())}</strong> ${escapeHtml(finding.id)}</header>
        <p>${escapeHtml(finding.message)}</p>
        ${finding.route ? `<p><code>${escapeHtml(finding.route)}</code></p>` : ""}
        ${finding.file ? `<p><code>${escapeHtml(finding.file)}</code></p>` : ""}
        ${finding.repair ? `<p><b>Repair:</b> ${escapeHtml(finding.repair.message)}</p>` : ""}
      </article>`
    )
    .join("\n");
  const screenshots = report.artifacts.screenshots.map((screenshot) => `<li><a href="./${escapeHtml(screenshot.replace(/^reports\//, ""))}">${escapeHtml(screenshot)}</a></li>`).join("\n");
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Draftpine Report</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css" />
    <style>body{padding:2rem} article{margin-block:1rem} code{white-space:normal}</style>
  </head>
  <body>
    <main class="container">
      <h1>Draftpine Report</h1>
      <p><strong>${escapeHtml(report.status)}</strong>: ${report.summary.errors} errors, ${report.summary.warnings} warnings, ${report.summary.routesEvaluated} routes, ${report.summary.screenshots} screenshots.</p>
      <p>Deterministic status: <strong>${escapeHtml(report.deterministicStatus)}</strong>${report.manualReviewRequired ? " · Manual review requested" : ""}</p>
      <h2>Findings</h2>
      ${findings || "<p>No findings.</p>"}
      <h2>Screenshots</h2>
      <ul>${screenshots}</ul>
    </main>
  </body>
</html>
`;
}
