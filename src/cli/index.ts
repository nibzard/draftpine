#!/usr/bin/env node
import path from "node:path";
import { generate } from "../compiler/compiler.js";
import { check } from "../eval/check.js";
import { evalProject, setupEvalBrowser } from "../eval/browserEval.js";
import { printFindings, printReport } from "../report/format.js";
import { parseArgs, flagBoolean, flagString } from "./args.js";
import { initProject, scaffoldBlock } from "./scaffold.js";
import { dev } from "../dev/dev.js";
import { generateDocs } from "../docs/docs.js";

const VERSION = "3.0.0";

async function main() {
  const parsed = parseArgs(normalizeWorkspaceFirstArgs(process.argv.slice(2)));
  const key = parsed.command.join(" ");
  const json = flagBoolean(parsed.flags, "json");

  if (key === "version" || flagBoolean(parsed.flags, "version")) {
    console.log(VERSION);
    return;
  }

  if (!key || key === "help" || flagBoolean(parsed.flags, "help")) {
    printHelp();
    return;
  }

  if (key === "init") {
    await initProject(
      parsed.positionals[0] ?? ".",
      (flagString(parsed.flags, "starter", "single-screen") as "single-screen" | "browsable" | "docs") ?? "single-screen",
      flagBoolean(parsed.flags, "force"),
      flagString(parsed.flags, "prompt")
    );
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

  if (key === "new block") {
    const name = parsed.positionals[0];
    if (!name) throw new Error("Usage: draftpine new block <name>");
    await scaffoldBlock(name, flagString(parsed.flags, "theme", "default") ?? "default");
    console.log(`Created block ${name}.`);
    return;
  }

  if (key === "setup") {
    const result = await setupEvalBrowser();
    console.log(result.message);
    process.exitCode = result.ok ? 0 : 1;
    return;
  }

  if (key === "docs") {
    await generateDocs(flagString(parsed.flags, "out", path.join("docs", "generated")) ?? path.join("docs", "generated"));
    console.log("Generated docs.");
    return;
  }

  throw new Error(`Unknown command: ${key}`);
}

function normalizeWorkspaceFirstArgs(args: string[]): string[] {
  const commands = new Set(["init", "generate", "check", "eval", "dev", "new", "docs", "setup", "version", "help"]);
  if (args.length >= 2 && !args[0].startsWith("-") && !commands.has(args[0]) && commands.has(args[1])) {
    return [args[1], args[0], ...args.slice(2)];
  }
  return args;
}

function applyWorkspaceOperand(positionals: string[]): void {
  if (positionals[0]) {
    process.chdir(path.resolve(process.cwd(), positionals[0]));
  }
}

function printHelp() {
  console.log(`Draftpine v3

Commands:
  draftpine init [path] [--starter single-screen|browsable|docs] [--prompt "..."] [--force]
  draftpine generate [workspace] [--json]
  draftpine check [workspace] [--json] [--scope source|generated|all]
  draftpine eval [workspace] [--json] [--strict] [--ai-review] [--routes /,/pricing/]
  draftpine setup
  draftpine dev [--port 5173] [--report-port 5174]
  draftpine new block <name> [--theme default]
  draftpine docs [--out docs/generated]
  draftpine --version
`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
