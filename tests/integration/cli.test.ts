import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import pkg from "../../package.json" with { type: "json" };
import { generate } from "../../src/compiler/compiler.js";
import { check } from "../../src/eval/check.js";
import { evalProject } from "../../src/eval/browserEval.js";
import { initProject, scaffoldBlock } from "../../src/cli/scaffold.js";

const originalCwd = process.cwd();
const tempDirs: string[] = [];

afterEach(async () => {
  process.chdir(originalCwd);
  for (const dir of tempDirs.splice(0)) await rm(dir, { recursive: true, force: true });
});

describe("Draftpine v3 CLI internals", () => {
  it("initializes a pages/theme project that generates and checks", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "draftpine-v3-"));
    tempDirs.push(dir);
    await initProject(dir, "single-screen", true);
    process.chdir(dir);
    const generated = await generate();
    expect(generated.findings).toEqual([]);
    expect(generated.artifact.routesRendered.map((route) => route.path)).toEqual(["/"]);
    const checked = await check();
    expect(checked.findings).toEqual([]);
  });

  it("initializes a browsable project with literal route output and strict eval", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "draftpine-v3-browsable-"));
    tempDirs.push(dir);
    await initProject(dir, "browsable", true);
    process.chdir(dir);
    const generated = await generate();
    expect(generated.findings).toEqual([]);
    expect(generated.artifact.routesRendered.map((route) => route.path)).toEqual(["/", "/pricing/", "/about/", "/contact/", "/resources/", "/404/"]);
    const home = await readFile(path.join(dir, "prototype/index.html"), "utf8");
    expect(home).toContain('href="./pricing/"');
    expect(home).toContain('href="./contact/"');
    expect(home).toContain('href="./resources/"');
    const report = await evalProject({ strict: true });
    expect(report.summary.errors).toBe(0);
    expect(report.deterministicStatus).toBe("pass");
    expect(report.status).toBe("pass");
  });

  it("scaffolds a local block in the active theme", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "draftpine-v3-block-"));
    tempDirs.push(dir);
    await initProject(dir, "single-screen", true);
    process.chdir(dir);
    await scaffoldBlock("audit-panel");
    const theme = JSON.parse(await readFile(path.join(dir, "themes/default/theme.json"), "utf8"));
    expect(theme.blocks["audit-panel"].file).toBe("blocks/audit-panel.html");
    const block = await readFile(path.join(dir, "themes/default/blocks/audit-panel.html"), "utf8");
    expect(block).toContain('data-block="audit-panel"');
  });

  it("uses prompt text to name initialized projects", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "draftpine-v3-prompt-"));
    tempDirs.push(dir);
    await initProject(dir, "browsable", true, "membership portal for urban garden cooperative");
    const config = JSON.parse(await readFile(path.join(dir, "draftpine.config.json"), "utf8"));
    expect(config.project.name).toBe("Membership Portal For Urban Garden Cooperative");
    const home = JSON.parse(await readFile(path.join(dir, "pages/home.json"), "utf8"));
    expect(home.sections[0].props.headline).toContain("Membership Portal For Urban Garden Cooperative");
  });

  it("reports requested eval routes that are not generated", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "draftpine-v3-unknown-route-"));
    tempDirs.push(dir);
    await initProject(dir, "single-screen", true);
    process.chdir(dir);

    const report = await evalProject({ strict: true, routes: ["/missing/"] });

    expect(report.deterministicStatus).toBe("fail");
    expect(report.findings.some((item) => item.id === "route.unknownEvalRoute")).toBe(true);
    expect(report.summary.screenshots).toBe(0);
  });

  it("rejects generated local links that escape the output directory", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "draftpine-v3-escaping-link-"));
    tempDirs.push(dir);
    await initProject(dir, "single-screen", true);
    const homePath = path.join(dir, "pages/home.json");
    const home = JSON.parse(await readFile(homePath, "utf8"));
    home.sections[0].props.primaryHref = "../outside.html";
    await writeFile(homePath, `${JSON.stringify(home, null, 2)}\n`);
    process.chdir(dir);

    await generate();
    const checked = await check();

    expect(checked.findings.some((item) => item.id === "route.localLinkEscapesOutput")).toBe(true);
  });

  it("seeds AGENTS.md and CLAUDE.md into the workspace", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "draftpine-v3-agent-files-"));
    tempDirs.push(dir);
    await initProject(dir, "browsable", true);
    const agents = await readFile(path.join(dir, "AGENTS.md"), "utf8");
    expect(agents).toContain("draftpine new block <name>");
    expect(agents).toContain("draftpine eval --strict");
    expect(agents).toContain("run from inside this workspace");
    const claude = await readFile(path.join(dir, "CLAUDE.md"), "utf8");
    expect(claude).toContain("AGENTS.md");
  });

  it("skips agent files when agentFiles is false", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "draftpine-v3-no-agent-files-"));
    tempDirs.push(dir);
    await initProject(dir, "single-screen", true, "", { agentFiles: false });
    await expect(readFile(path.join(dir, "AGENTS.md"), "utf8")).rejects.toThrow();
    await expect(readFile(path.join(dir, "CLAUDE.md"), "utf8")).rejects.toThrow();
  });

  it("seeds cursor and copilot pointers when targeted", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "draftpine-v3-agent-targets-"));
    tempDirs.push(dir);
    await initProject(dir, "single-screen", true, "", { agentTargets: ["cursor", "copilot"] });
    const cursor = await readFile(path.join(dir, ".cursor/rules/draftpine.mdc"), "utf8");
    expect(cursor).toContain("AGENTS.md");
    const copilot = await readFile(path.join(dir, ".github/copilot-instructions.md"), "utf8");
    expect(copilot).toContain("AGENTS.md");
  });

  it("records the package version in the generated manifest", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "draftpine-v3-manifest-version-"));
    tempDirs.push(dir);
    await initProject(dir, "single-screen", true);
    process.chdir(dir);
    await generate();
    const manifest = JSON.parse(await readFile(path.join(dir, "prototype/draftpine.manifest.json"), "utf8"));
    expect(manifest.draftpineVersion).toBe(pkg.version);
  });
});
