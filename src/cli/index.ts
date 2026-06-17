#!/usr/bin/env node
import path from "node:path";
import { generate } from "../compiler/compiler.js";
import { check } from "../eval/check.js";
import { evalProject } from "../eval/browserEval.js";
import { printFindings, printReport } from "../report/format.js";
import { parseArgs, flagBoolean, flagString } from "./args.js";
import { initProject, scaffoldLayout, scaffoldPrimitive } from "./scaffold.js";
import { dev } from "../dev/dev.js";
import { generateDocs } from "../docs/docs.js";
import { migrateV1 } from "./migrate.js";
import { testLayout, testPrimitive } from "./testExtension.js";

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  const key = parsed.command.join(" ");
  const json = flagBoolean(parsed.flags, "json");

  if (!key || key === "help" || flagBoolean(parsed.flags, "help")) {
    printHelp();
    return;
  }

  if (key === "init") {
    await initProject(parsed.positionals[0] ?? ".", (flagString(parsed.flags, "starter", "single-screen") as "single-screen" | "browsable" | "docs") ?? "single-screen", flagBoolean(parsed.flags, "force"));
    console.log("Draftpine project initialized.");
    return;
  }

  if (key === "generate") {
    applyWorkspaceOperand(parsed.positionals);
    const result = await generate(flagString(parsed.flags, "config") ?? "draftpine.config.json");
    if (json) {
      console.log(JSON.stringify({ artifact: result.artifact, findings: result.findings }, null, 2));
    } else {
      console.log(`compile ${result.findings.some((item) => item.blocking) ? "fail" : "pass"}: ${result.artifact.routesRendered.length} routes`);
      printFindings(result.findings);
    }
    process.exitCode = result.findings.some((item) => item.severity === "error") ? 1 : 0;
    return;
  }

  if (key === "check") {
    applyWorkspaceOperand(parsed.positionals);
    const result = await check(flagString(parsed.flags, "config") ?? "draftpine.config.json", (flagString(parsed.flags, "scope", "all") as "source" | "generated" | "all") ?? "all");
    printFindings(result.findings, json);
    process.exitCode = result.findings.some((item) => item.severity === "error") ? 1 : 0;
    return;
  }

  if (key === "eval") {
    applyWorkspaceOperand(parsed.positionals);
    const routesValue = flagString(parsed.flags, "routes");
    const report = await evalProject({
      configPath: flagString(parsed.flags, "config") ?? "draftpine.config.json",
      strict: flagBoolean(parsed.flags, "strict"),
      aiReview: flagBoolean(parsed.flags, "aiReview"),
      routes: routesValue ? routesValue.split(",") : undefined
    });
    printReport(report, json);
    process.exitCode = report.summary.errors > 0 ? 1 : 0;
    return;
  }

  if (key === "dev") {
    await dev({
      port: Number(flagString(parsed.flags, "port", "5173")),
      reportPort: Number(flagString(parsed.flags, "reportPort", "5174")),
      aiReview: (flagString(parsed.flags, "aiReview", "off") as "off" | "manual" | "auto") ?? "off"
    });
    return;
  }

  if (key === "new primitive") {
    const name = parsed.positionals[0];
    if (!name) throw new Error("Usage: draftpine new primitive <name>");
    await scaffoldPrimitive(name, flagString(parsed.flags, "namespace", "project") ?? "project", flagString(parsed.flags, "variant", "default") ?? "default");
    console.log(`Created primitive ${name}.`);
    return;
  }

  if (key === "new layout") {
    const name = parsed.positionals[0];
    if (!name) throw new Error("Usage: draftpine new layout <name>");
    await scaffoldLayout(name, flagString(parsed.flags, "namespace", "project") ?? "project");
    console.log(`Created layout ${name}.`);
    return;
  }

  if (key === "test primitive") {
    const name = parsed.positionals[0];
    if (!name) throw new Error("Usage: draftpine test primitive <name>");
    const findings = await testPrimitive(name);
    printFindings(findings, json);
    process.exitCode = findings.some((item) => item.severity === "error") ? 1 : 0;
    return;
  }

  if (key === "test layout") {
    const name = parsed.positionals[0];
    if (!name) throw new Error("Usage: draftpine test layout <name>");
    const findings = await testLayout(name);
    printFindings(findings, json);
    process.exitCode = findings.some((item) => item.severity === "error") ? 1 : 0;
    return;
  }

  if (key === "docs") {
    await generateDocs(flagString(parsed.flags, "out", path.join("docs", "generated")) ?? path.join("docs", "generated"));
    console.log("Generated docs.");
    return;
  }

  if (key === "migrate v1") {
    await migrateV1(parsed.positionals[0] ?? ".", flagString(parsed.flags, "out", "wireframe-v2") ?? "wireframe-v2");
    console.log("Created v1 migration workspace.");
    return;
  }

  throw new Error(`Unknown command: ${key}`);
}

function applyWorkspaceOperand(positionals: string[]): void {
  if (positionals[0]) {
    process.chdir(path.resolve(process.cwd(), positionals[0]));
  }
}

function printHelp() {
  console.log(`Draftpine v2

Commands:
  draftpine init [path] [--starter single-screen|browsable|docs] [--force]
  draftpine generate [--json]
  draftpine check [--json] [--scope source|generated|all]
  draftpine eval [--json] [--strict] [--ai-review] [--routes /,/pricing/]
  draftpine dev [--port 5173] [--report-port 5174]
  draftpine new primitive <name>
  draftpine new layout <name>
  draftpine test primitive <name>
  draftpine test layout <name>
  draftpine docs [--out docs/generated]
  draftpine migrate v1 [path] [--out wireframe-v2]
`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
