import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
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
});
