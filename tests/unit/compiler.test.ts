import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { generate, validateProjectContracts } from "../../src/compiler/compiler.js";
import { loadProject } from "../../src/io/workspace.js";
import { initProject } from "../../src/cli/scaffold.js";

const repoRoot = path.resolve(import.meta.dirname, "../..");
const originalCwd = process.cwd();
const tempDirs: string[] = [];

afterEach(async () => {
  process.chdir(originalCwd);
  for (const dir of tempDirs.splice(0)) {
    await rm(dir, { recursive: true, force: true });
  }
});

async function contractFindings(fixtureDir: string) {
  process.chdir(path.join(repoRoot, fixtureDir));
  const project = await loadProject("draftpine.config.json");
  return validateProjectContracts(project);
}

describe("compiler determinism", () => {
  it("produces byte-stable HTML and CSS across regenerations", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "draftpine-determinism-"));
    tempDirs.push(dir);
    await initProject(dir, "single-screen", true);
    process.chdir(dir);

    await generate();
    const html1 = await readFile(path.join(dir, "prototype/index.html"), "utf8");
    const css1 = await readFile(path.join(dir, "prototype/assets/draftpine.css"), "utf8");

    await generate();
    const html2 = await readFile(path.join(dir, "prototype/index.html"), "utf8");
    const css2 = await readFile(path.join(dir, "prototype/assets/draftpine.css"), "utf8");

    expect(html1).toBe(html2);
    expect(css1).toBe(css2);
  });
});

describe("compiler contract enforcement", () => {
  it("flags a home route that omits required primitives", async () => {
    const findings = await contractFindings("fixtures/bad/generic-card-dump");
    expect(findings.some((item) => item.id === "route.missingRequiredPrimitive")).toBe(true);
  });

  it("flags a project that exceeds the route budget", async () => {
    const findings = await contractFindings("fixtures/bad/route-explosion");
    expect(findings.some((item) => item.id === "route.budgetExceeded")).toBe(true);
  });

  it("computes a differentiation fingerprint for repetitive shells", async () => {
    const findings = await contractFindings("fixtures/bad/route-explosion");
    expect(findings.some((item) => item.id === "route.repetitiveFingerprint")).toBe(true);
  });
});
